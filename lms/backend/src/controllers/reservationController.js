import { reservationModel } from '../models/reservationModel.js';
import { bookModel } from '../models/bookModel.js';
import { memberModel } from '../models/memberModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { HTTP_STATUS, MESSAGES, RESERVATION_STATUS, MEMBER_STATUS } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import { getPaginationParams, formatPagination } from '../utils/helpers.js';
import { getClient } from '../config/database.js';
import { emailService } from '../services/emailService.js';
import logger from '../utils/logger.js';

export const reservationController = {
  /**
   * Get all reservations with pagination
   */
  getAllReservations: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, member_id, book_id } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (member_id) filters.member_id = member_id;
    if (book_id) filters.book_id = book_id;

    const { reservations, total } = await reservationModel.findAll({ page, limit, offset, filters });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          reservations,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get reservation by ID
   */
  getReservationById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(formatSuccess(reservation, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Create a new reservation (member creates their own reservation)
   */
  createReservation: asyncHandler(async (req, res) => {
    // If user is a member, use their member_id, otherwise use provided member_id (librarian/admin)
    let member_id;
    if (req.user.role === 'member') {
      const member = await memberModel.findByUserId(req.user.id);
      if (!member) {
        throw new AppError('Member profile not found', HTTP_STATUS.NOT_FOUND);
      }
      member_id = member.id;
    } else {
      member_id = req.body.member_id;
      if (!member_id) {
        throw new AppError('Member ID is required', HTTP_STATUS.BAD_REQUEST);
      }
    }

    const { book_id } = req.body;

    // Check if member exists and is active
    const member = await memberModel.findById(member_id);
    if (!member) {
      throw new AppError('Member not found', HTTP_STATUS.NOT_FOUND);
    }

    if (member.status !== MEMBER_STATUS.ACTIVE) {
      throw new AppError(MESSAGES.ERROR.MEMBER_SUSPENDED, HTTP_STATUS.BAD_REQUEST);
    }

    // Check if book exists
    const book = await bookModel.findById(book_id);
    if (!book) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if member already has this book issued
    const activeTransaction = await transactionModel.findActiveByMemberAndBook(member_id, book_id);
    if (activeTransaction) {
      throw new AppError('Member already has this book issued', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if member already has a pending reservation for this book
    const existingReservation = await reservationModel.findPendingByMemberAndBook(member_id, book_id);
    if (existingReservation) {
      throw new AppError('Member already has a pending reservation for this book', HTTP_STATUS.CONFLICT);
    }

    // Create reservation and get queue position
    const reservation = await reservationModel.create({
      member_id,
      book_id,
      status: RESERVATION_STATUS.PENDING,
    });

    // Get queue position for this reservation
    const queuePosition = await reservationModel.getQueuePosition(reservation.id);
    const totalPending = await reservationModel.findByBookId(book_id, 'pending');

    logger.info(`Reservation created: Book ID ${book_id} by Member ID ${member_id} (Queue position: ${queuePosition + 1})`);

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess(
        {
          ...reservation,
          queue_position: queuePosition + 1,
          total_in_queue: totalPending.length,
        },
        'Reservation created successfully'
      )
    );
  }),

  /**
   * Get member's reservations (member can view their own)
   */
  getMemberReservations: asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status } = req.query;

    // Check if user is requesting their own reservations or is librarian/admin
    if (req.user.role === 'member') {
      const member = await memberModel.findByUserId(req.user.id);
      if (!member || member.id !== parseInt(memberId)) {
        throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
    }

    const filters = {};
    if (status) filters.status = status;

    const { reservations, total } = await reservationModel.findByMemberId(memberId, {
      page,
      limit,
      offset,
      filters,
    });

    // Enrich reservations with queue position and expiry info
    const enrichedReservations = await Promise.all(reservations.map(async (r) => {
      const reservation = { ...r };
      
      // Calculate queue position for pending reservations
      if (r.status === RESERVATION_STATUS.PENDING) {
        const queuePosition = await reservationModel.getQueuePosition(r.id);
        reservation.queue_position = queuePosition !== null ? queuePosition + 1 : null;
      }
      
      // Calculate if fulfilled reservation is expired (48 hours)
      if (r.status === RESERVATION_STATUS.FULFILLED) {
        const reservationDate = new Date(r.reservation_date);
        const expiryDate = new Date(reservationDate.getTime() + 48 * 60 * 60 * 1000);
        const isExpired = new Date() > expiryDate;
        reservation.is_expired = isExpired;
        reservation.expiry_date = expiryDate.toISOString();
        reservation.hours_remaining = isExpired ? 0 : Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60));
      }

      return reservation;
    }));

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          reservations: enrichedReservations,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Fulfill a reservation (when book becomes available)
   * Checks queue order and only fulfills if it's next in line
   */
  fulfillReservation: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get reservation with lock
      const reservationResult = await client.query(
        `SELECT r.*, m.member_id, u.username as member_name, u.email as member_email,
                b.title as book_title
         FROM reservations r
         JOIN members m ON r.member_id = m.id
         JOIN users u ON m.user_id = u.id
         JOIN books b ON r.book_id = b.id
         WHERE r.id = $1 FOR UPDATE`,
        [id]
      );

      if (reservationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const reservation = reservationResult.rows[0];

      if (reservation.status !== RESERVATION_STATUS.PENDING) {
        await client.query('ROLLBACK');
        throw new AppError('Reservation is not pending', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if this is the next reservation in queue
      const nextInQueue = await reservationModel.getNextInQueue(reservation.book_id);
      if (!nextInQueue || nextInQueue.id !== parseInt(id)) {
        await client.query('ROLLBACK');
        throw new AppError('This reservation is not next in queue. Reservations are fulfilled in order.', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if book is available (with lock)
      const bookResult = await client.query(
        'SELECT * FROM books WHERE id = $1 FOR UPDATE',
        [reservation.book_id]
      );

      if (bookResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
      }

      const book = bookResult.rows[0];

      if (book.available_quantity <= 0) {
        await client.query('ROLLBACK');
        throw new AppError('Book is not available yet', HTTP_STATUS.BAD_REQUEST);
      }

      // Update reservation to fulfilled (update reservation_date to now for expiry calculation)
      const updateResult = await client.query(
        `UPDATE reservations
         SET status = $1, reservation_date = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [RESERVATION_STATUS.FULFILLED, id]
      );

      const updatedReservation = updateResult.rows[0];

      // Reserve the book (decrement available quantity but don't issue yet)
      // Book will be held for 48 hours
      await client.query(
        'UPDATE books SET available_quantity = available_quantity - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [reservation.book_id]
      );

      await client.query('COMMIT');

      // Send email notification (non-blocking)
      const expiryDate = new Date(new Date(reservation.reservation_date).getTime() + 48 * 60 * 60 * 1000);
      emailService.sendReservationFulfillmentNotification({
        member_email: reservation.email,
        member_name: reservation.member_name,
        book_title: reservation.book_title,
        expiry_date: expiryDate,
      }).catch(err => logger.error('Failed to send reservation fulfillment email:', err));

      logger.info(`Reservation fulfilled: Reservation ID ${id} for Member ${reservation.member_name}`);

      res.status(HTTP_STATUS.OK).json(
        formatSuccess(
          {
            reservation: updatedReservation,
            expiry_date: expiryDate,
            hours_remaining: 48,
            message: 'Reservation fulfilled. Member has 48 hours to collect the book.',
          },
          'Reservation fulfilled successfully'
        )
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  /**
   * Cancel a reservation
   * Members can cancel their own reservations, librarians can cancel any
   */
  cancelReservation: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get reservation with lock
      const reservationResult = await client.query(
        `SELECT r.*, m.member_id, m.user_id, b.title as book_title
         FROM reservations r
         JOIN members m ON r.member_id = m.id
         JOIN books b ON r.book_id = b.id
         WHERE r.id = $1 FOR UPDATE`,
        [id]
      );

      if (reservationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const reservation = reservationResult.rows[0];

      // Check if user has permission (member can only cancel their own)
      if (req.user.role === 'member') {
        const member = await memberModel.findByUserId(req.user.id);
        if (!member || member.id !== reservation.member_id) {
          await client.query('ROLLBACK');
          throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        }
      }

      // Only pending or fulfilled reservations can be cancelled
      if (reservation.status === RESERVATION_STATUS.CANCELLED || reservation.status === RESERVATION_STATUS.EXPIRED) {
        await client.query('ROLLBACK');
        throw new AppError('Reservation cannot be cancelled', HTTP_STATUS.BAD_REQUEST);
      }

      // If fulfilled, release the book back to available
      if (reservation.status === RESERVATION_STATUS.FULFILLED) {
        await client.query(
          'UPDATE books SET available_quantity = available_quantity + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [reservation.book_id]
        );
      }

      // Update reservation status
      const updateResult = await client.query(
        `UPDATE reservations
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [RESERVATION_STATUS.CANCELLED, id]
      );

      const updatedReservation = updateResult.rows[0];

      await client.query('COMMIT');

      logger.info(`Reservation cancelled: Reservation ID ${id} by ${req.user.username}`);

      res.status(HTTP_STATUS.OK).json(formatSuccess(updatedReservation, 'Reservation cancelled successfully'));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  /**
   * Delete reservation
   */
  deleteReservation: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reservation = await reservationModel.findById(id);
    if (!reservation) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    await reservationModel.delete(id);

    logger.info(`Reservation deleted: Reservation ID ${id}`);

    res.status(HTTP_STATUS.OK).json(formatSuccess(null, MESSAGES.SUCCESS.DELETED));
  }),
};

