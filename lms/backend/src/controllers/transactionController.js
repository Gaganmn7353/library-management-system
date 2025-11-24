import { transactionModel } from '../models/transactionModel.js';
import { bookModel } from '../models/bookModel.js';
import { memberModel } from '../models/memberModel.js';
import { finePaymentModel } from '../models/finePaymentModel.js';
import { HTTP_STATUS, MESSAGES, TRANSACTION_STATUS, MEMBER_STATUS, MAX_BOOKS_PER_MEMBER, MAX_PENDING_FINE, LOAN_PERIOD_DAYS, FINE_RATE } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import { getPaginationParams, formatPagination, calculateDueDate, calculateFine, calculateDaysOverdue } from '../utils/helpers.js';
import { getClient } from '../config/database.js';
import { emailService } from '../services/emailService.js';
import logger from '../utils/logger.js';

export const transactionController = {
  /**
   * Get all transactions with pagination
   */
  getAllTransactions: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status, member_id, book_id, overdue } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (member_id) filters.member_id = member_id;
    if (book_id) filters.book_id = book_id;
    if (overdue === 'true') filters.overdue = true;

    const { transactions, total } = await transactionModel.findAll({ page, limit, offset, filters });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          transactions,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get transaction by ID
   */
  getTransactionById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const transaction = await transactionModel.findById(id);

    if (!transaction) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(formatSuccess(transaction, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Issue a book to a member
   * Uses database transaction to ensure data consistency
   */
  issueBook: asyncHandler(async (req, res) => {
    const { member_id, book_id, issue_date, due_date } = req.body;

    // Get database client for transaction
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if member exists and is active
      const memberResult = await client.query(
        'SELECT m.*, u.email, u.username FROM members m JOIN users u ON m.user_id = u.id WHERE m.id = $1',
        [member_id]
      );
      
      if (memberResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Member not found', HTTP_STATUS.NOT_FOUND);
      }

      const member = memberResult.rows[0];

      if (member.status !== MEMBER_STATUS.ACTIVE) {
        await client.query('ROLLBACK');
        throw new AppError(MESSAGES.ERROR.MEMBER_SUSPENDED, HTTP_STATUS.BAD_REQUEST);
      }

      // Check if membership is still valid
      const today = new Date();
      if (new Date(member.membership_expiry) < today) {
        await client.query('ROLLBACK');
        throw new AppError(MESSAGES.ERROR.MEMBERSHIP_EXPIRED, HTTP_STATUS.BAD_REQUEST);
      }

      // Check if member has reached max books limit
      const activeTransactionsResult = await client.query(
        'SELECT COUNT(*) as count FROM transactions WHERE member_id = $1 AND status IN ($2, $3)',
        [member_id, TRANSACTION_STATUS.ISSUED, TRANSACTION_STATUS.OVERDUE]
      );

      if (parseInt(activeTransactionsResult.rows[0].count, 10) >= MAX_BOOKS_PER_MEMBER) {
        await client.query('ROLLBACK');
        throw new AppError(`Maximum ${MAX_BOOKS_PER_MEMBER} books allowed at a time`, HTTP_STATUS.BAD_REQUEST);
      }

      // Check if member already has this book
      const existingTransactionResult = await client.query(
        'SELECT id FROM transactions WHERE member_id = $1 AND book_id = $2 AND status IN ($3, $4) LIMIT 1',
        [member_id, book_id, TRANSACTION_STATUS.ISSUED, TRANSACTION_STATUS.OVERDUE]
      );

      if (existingTransactionResult.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new AppError('Member already has this book issued', HTTP_STATUS.BAD_REQUEST);
      }

      // Check pending fines (including unpaid fines from previous transactions)
      const pendingFineResult = await client.query(
        `SELECT COALESCE(SUM(t.fine_amount), 0) as total_pending_fine
         FROM transactions t
         LEFT JOIN fine_payments fp ON t.id = fp.transaction_id
         WHERE t.member_id = $1 
           AND t.status IN ($2, $3)
           AND (t.fine_amount > 0 AND fp.id IS NULL OR t.fine_amount > 0)`,
        [member_id, TRANSACTION_STATUS.ISSUED, TRANSACTION_STATUS.OVERDUE]
      );

      const totalPendingFine = parseFloat(pendingFineResult.rows[0].total_pending_fine || 0);
      if (totalPendingFine >= MAX_PENDING_FINE) {
        await client.query('ROLLBACK');
        throw new AppError(`Cannot issue book. Member has pending fines of ₹${totalPendingFine.toFixed(2)}. Maximum allowed: ₹${MAX_PENDING_FINE.toFixed(2)}`, HTTP_STATUS.BAD_REQUEST);
      }

      // Check if book exists and is available (with row lock)
      const bookResult = await client.query(
        'SELECT * FROM books WHERE id = $1 FOR UPDATE',
        [book_id]
      );

      if (bookResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
      }

      const book = bookResult.rows[0];

      // Support both available_quantity (new) and available_copies (legacy)
      const availableCount = book.available_quantity !== undefined ? book.available_quantity : (book.available_copies || 0);
      if (availableCount <= 0) {
        await client.query('ROLLBACK');
        throw new AppError(MESSAGES.ERROR.BOOK_NOT_AVAILABLE, HTTP_STATUS.BAD_REQUEST);
      }

      // Set dates - support both issue_date and due_date from frontend
      const issueDate = issue_date ? new Date(issue_date) : new Date();
      let finalDueDate;
      if (due_date) {
        finalDueDate = new Date(due_date);
      } else {
        finalDueDate = new Date(issueDate);
        finalDueDate.setDate(finalDueDate.getDate() + LOAN_PERIOD_DAYS);
      }

      // Create transaction
      const transactionResult = await client.query(
        `INSERT INTO transactions (member_id, book_id, issue_date, due_date, status, fine_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          member_id,
          book_id,
          issueDate.toISOString().split('T')[0],
          finalDueDate.toISOString().split('T')[0],
          TRANSACTION_STATUS.ISSUED,
          0,
        ]
      );

      const transaction = transactionResult.rows[0];

      // Update book available quantity - support both available_quantity and available_copies
      await client.query(
        `UPDATE books 
         SET available_quantity = COALESCE(available_quantity, available_copies, 0) - 1,
             available_copies = COALESCE(available_copies, available_quantity, 0) - 1,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [book_id]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Send email notification (non-blocking)
      emailService.sendIssueConfirmation({
        member_email: member.email,
        member_name: member.username,
        book_title: book.title,
        issue_date: transaction.issue_date,
        due_date: transaction.due_date,
      }).catch(err => logger.error('Failed to send issue confirmation email:', err));

      logger.info(`Book issued: Book ID ${book_id} to Member ID ${member_id} (Transaction ID: ${transaction.id})`);

      res.status(HTTP_STATUS.CREATED).json(
        formatSuccess(
          {
            transaction,
            book: { title: book.title, author: book.author },
            member: { name: member.username, member_id: member.member_id },
          },
          'Book issued successfully'
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
   * Return a book
   * Uses database transaction to ensure data consistency
   */
  returnBook: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { return_date } = req.body;

    // Get database client for transaction
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Find transaction with row lock
      const transactionResult = await client.query(
        `SELECT t.*, m.member_id, u.email, u.username, b.title as book_title
         FROM transactions t
         JOIN members m ON t.member_id = m.id
         JOIN users u ON m.user_id = u.id
         JOIN books b ON t.book_id = b.id
         WHERE t.id = $1 FOR UPDATE`,
        [id]
      );

      if (transactionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const transaction = transactionResult.rows[0];

      if (transaction.status === TRANSACTION_STATUS.RETURNED) {
        await client.query('ROLLBACK');
        throw new AppError('Book has already been returned', HTTP_STATUS.BAD_REQUEST);
      }

      // Calculate fine if overdue
      const returnDate = return_date ? new Date(return_date) : new Date();
      const dueDate = new Date(transaction.due_date);
      const fineAmount = calculateFine(dueDate, returnDate);
      const daysOverdue = calculateDaysOverdue(dueDate, returnDate);

      // Update transaction
      const updateResult = await client.query(
        `UPDATE transactions
         SET return_date = $1,
             status = $2,
             fine_amount = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [
          returnDate.toISOString().split('T')[0],
          TRANSACTION_STATUS.RETURNED,
          fineAmount,
          id,
        ]
      );

      const updatedTransaction = updateResult.rows[0];

      // Update book available quantity (with row lock)
      await client.query(
        'UPDATE books SET available_quantity = available_quantity + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [transaction.book_id]
      );

      // Commit transaction
      await client.query('COMMIT');

      // Send email notification (non-blocking)
      emailService.sendReturnConfirmation({
        member_email: transaction.email,
        member_name: transaction.username,
        book_title: transaction.book_title,
        return_date: updatedTransaction.return_date,
        fine_amount: fineAmount,
      }).catch(err => logger.error('Failed to send return confirmation email:', err));

      logger.info(`Book returned: Transaction ID ${id} (Fine: ₹${fineAmount.toFixed(2)}, Days overdue: ${daysOverdue})`);

      res.status(HTTP_STATUS.OK).json(
        formatSuccess(
          {
            transaction: updatedTransaction,
            fine_amount: fineAmount,
            days_overdue: daysOverdue,
          },
          'Book returned successfully'
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
   * Update transaction
   */
  updateTransaction: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const transaction = await transactionModel.findById(id);
    if (!transaction) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const updatedTransaction = await transactionModel.update(id, updateData);

    logger.info(`Transaction updated: ${id}`);

    res.status(HTTP_STATUS.OK).json(formatSuccess(updatedTransaction, MESSAGES.SUCCESS.UPDATED));
  }),

  /**
   * Get overdue transactions
   */
  getOverdueTransactions: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { transactions, total } = await transactionModel.findOverdue({ page, limit, offset });

    // Calculate days overdue and update fine amounts
    const transactionsWithDetails = transactions.map(t => {
      const daysOverdue = calculateDaysOverdue(t.due_date);
      const calculatedFine = calculateFine(new Date(t.due_date));
      return {
        ...t,
        days_overdue: daysOverdue,
        calculated_fine: calculatedFine,
      };
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          transactions: transactionsWithDetails,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get member's transactions (accessible by member for their own transactions)
   */
  getMemberTransactions: asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);
    const { status } = req.query;

    // Check if user is requesting their own transactions or is librarian/admin
    if (req.user.role === 'member') {
      // Member can only view their own transactions
      // We need to get member_id from user_id
      const member = await memberModel.findByUserId(req.user.id);
      if (!member || member.id !== parseInt(memberId)) {
        throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
    }

    const filters = {};
    if (status) filters.status = status;

    const { transactions, total } = await transactionModel.findMemberTransactions(memberId, {
      page,
      limit,
      offset,
      filters,
    });

    // Calculate overdue status and fines for active transactions
    const enrichedTransactions = transactions.map(t => {
      if (t.status === TRANSACTION_STATUS.ISSUED && !t.return_date) {
        const daysOverdue = calculateDaysOverdue(t.due_date);
        const calculatedFine = daysOverdue > 0 ? calculateFine(new Date(t.due_date)) : 0;
        return {
          ...t,
          days_overdue: daysOverdue,
          is_overdue: daysOverdue > 0,
          calculated_fine: calculatedFine,
        };
      }
      return t;
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          transactions: enrichedTransactions,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Calculate and update fine for a transaction
   */
  calculateFine: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transaction = await transactionModel.findById(id);
    if (!transaction) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (transaction.status === TRANSACTION_STATUS.RETURNED) {
      throw new AppError('Cannot calculate fine for returned book', HTTP_STATUS.BAD_REQUEST);
    }

    const dueDate = new Date(transaction.due_date);
    const currentDate = new Date();
    const daysOverdue = calculateDaysOverdue(dueDate, currentDate);
    const fineAmount = calculateFine(dueDate, currentDate);

    // Update transaction status and fine if overdue
    let updatedTransaction = transaction;
    if (daysOverdue > 0 && transaction.status !== TRANSACTION_STATUS.OVERDUE) {
      updatedTransaction = await transactionModel.updateOverdueStatus(id, fineAmount);

      // Send overdue notification email (non-blocking)
      const member = await memberModel.findById(transaction.member_id);
      if (member) {
        const { query } = await import('../config/database.js');
        const userResult = await query('SELECT email, username FROM users WHERE id = $1', [member.user_id]);
        if (userResult.rows[0]) {
          emailService.sendOverdueNotification({
            member_email: userResult.rows[0].email,
            member_name: userResult.rows[0].username,
            book_title: transaction.book_title || 'Book',
            due_date: transaction.due_date,
            fine_amount: fineAmount,
            days_overdue: daysOverdue,
          }).catch(err => logger.error('Failed to send overdue notification email:', err));
        }
      }
    } else if (fineAmount > 0 && transaction.fine_amount !== fineAmount) {
      // Update fine amount even if status is already overdue
      updatedTransaction = await transactionModel.update(id, { fine_amount: fineAmount });
    }

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          transaction: updatedTransaction,
          days_overdue: daysOverdue,
          fine_amount: fineAmount,
          fine_rate_per_day: FINE_RATE.DEFAULT,
          currency: FINE_RATE.CURRENCY,
        },
        'Fine calculated successfully'
      )
    );
  }),
};

