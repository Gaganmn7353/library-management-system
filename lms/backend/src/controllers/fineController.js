import { finePaymentModel } from '../models/finePaymentModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { memberModel } from '../models/memberModel.js';
import { HTTP_STATUS, MESSAGES, PAYMENT_METHODS, FINE_RATE } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import { getPaginationParams, formatPagination } from '../utils/helpers.js';
import { getClient } from '../config/database.js';
import logger from '../utils/logger.js';

export const fineController = {
  /**
   * Get member's current fines (pending/unpaid fines)
   */
  getMemberFines: asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    // Check if user is requesting their own fines or is librarian/admin
    if (req.user.role === 'member') {
      const member = await memberModel.findByUserId(req.user.id);
      if (!member || member.id !== parseInt(memberId)) {
        throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
    }

    // Get all transactions with fines for this member
    const { query } = await import('../config/database.js');
    const transactionsResult = await query(
      `SELECT t.id, t.book_id, t.issue_date, t.due_date, t.return_date,
              t.fine_amount, t.status,
              b.title as book_title, b.author as book_author, b.isbn as book_isbn,
              COALESCE(SUM(fp.amount), 0) as total_paid,
              (t.fine_amount - COALESCE(SUM(fp.amount), 0)) as remaining_fine
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       LEFT JOIN fine_payments fp ON t.id = fp.transaction_id
       WHERE t.member_id = $1 
         AND (t.fine_amount > 0 OR t.status IN ('issued', 'overdue'))
       GROUP BY t.id, t.book_id, t.issue_date, t.due_date, t.return_date,
                t.fine_amount, t.status, b.title, b.author, b.isbn
       HAVING (t.fine_amount - COALESCE(SUM(fp.amount), 0)) > 0
       ORDER BY t.due_date ASC`,
      [memberId]
    );

    const fines = transactionsResult.rows;
    const totalPendingFine = fines.reduce((sum, t) => sum + parseFloat(t.remaining_fine || 0), 0);

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          fines,
          total_pending_fine: totalPendingFine,
          currency: FINE_RATE.CURRENCY,
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get member's fine payment history
   */
  getFineHistory: asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);

    // Check if user is requesting their own history or is librarian/admin
    if (req.user.role === 'member') {
      const member = await memberModel.findByUserId(req.user.id);
      if (!member || member.id !== parseInt(memberId)) {
        throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
    }

    const { query } = await import('../config/database.js');
    const off = offset !== undefined ? offset : (page - 1) * limit;

    // Get payment history
    const paymentsResult = await query(
      `SELECT fp.*,
              t.book_id, t.fine_amount as transaction_fine_amount,
              b.title as book_title, b.author as book_author,
              m.member_id as member_code
       FROM fine_payments fp
       JOIN transactions t ON fp.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       JOIN members m ON t.member_id = m.id
       WHERE t.member_id = $1
       ORDER BY fp.payment_date DESC
       LIMIT $2 OFFSET $3`,
      [memberId, limit, off]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM fine_payments fp
       JOIN transactions t ON fp.transaction_id = t.id
       WHERE t.member_id = $1`,
      [memberId]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          payments: paymentsResult.rows,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Pay fine (member can pay their own fines)
   */
  payFine: asyncHandler(async (req, res) => {
    const { transaction_id, amount, payment_method, payment_date } = req.body;
    const memberId = req.body.member_id; // Optional, defaults to authenticated member

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get transaction with lock
      const transactionResult = await client.query(
        `SELECT t.*, m.member_id, m.user_id, b.title as book_title
         FROM transactions t
         JOIN members m ON t.member_id = m.id
         JOIN books b ON t.book_id = b.id
         WHERE t.id = $1 FOR UPDATE`,
        [transaction_id]
      );

      if (transactionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new AppError('Transaction not found', HTTP_STATUS.NOT_FOUND);
      }

      const transaction = transactionResult.rows[0];

      // Check if user has permission (member can only pay their own fines)
      if (req.user.role === 'member') {
        const member = await memberModel.findByUserId(req.user.id);
        if (!member || member.id !== transaction.member_id) {
          await client.query('ROLLBACK');
          throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        }
      }

      // Validate payment method
      if (!Object.values(PAYMENT_METHODS).includes(payment_method)) {
        await client.query('ROLLBACK');
        throw new AppError('Invalid payment method', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate amount
      if (!amount || amount <= 0) {
        await client.query('ROLLBACK');
        throw new AppError('Payment amount must be greater than 0', HTTP_STATUS.BAD_REQUEST);
      }

      // Calculate remaining fine
      const paymentsResult = await client.query(
        'SELECT COALESCE(SUM(amount), 0) as total_paid FROM fine_payments WHERE transaction_id = $1',
        [transaction_id]
      );

      const totalPaid = parseFloat(paymentsResult.rows[0].total_paid || 0);
      const remainingFine = parseFloat(transaction.fine_amount || 0) - totalPaid;

      if (remainingFine <= 0) {
        await client.query('ROLLBACK');
        throw new AppError('Fine has already been paid in full', HTTP_STATUS.BAD_REQUEST);
      }

      if (amount > remainingFine) {
        await client.query('ROLLBACK');
        throw new AppError(
          `Payment amount exceeds remaining fine. Remaining: ₹${remainingFine.toFixed(2)}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Create payment record
      const paymentResult = await client.query(
        `INSERT INTO fine_payments (transaction_id, amount, payment_method, payment_date)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          transaction_id,
          amount,
          payment_method,
          payment_date || new Date(),
        ]
      );

      const payment = paymentResult.rows[0];
      const newTotalPaid = totalPaid + parseFloat(amount);
      const newRemainingFine = remainingFine - parseFloat(amount);

      await client.query('COMMIT');

      logger.info(`Fine payment: ₹${amount} (${payment_method}) for Transaction ID ${transaction_id} by Member ${transaction.member_id}`);

      res.status(HTTP_STATUS.CREATED).json(
        formatSuccess(
          {
            payment,
            transaction: {
              id: transaction.id,
              book_title: transaction.book_title,
              fine_amount: transaction.fine_amount,
              total_paid: newTotalPaid,
              remaining_fine: newRemainingFine,
              is_paid_in_full: newRemainingFine <= 0,
            },
            receipt_id: payment.id,
          },
          'Fine payment recorded successfully'
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
   * Get fine payment receipt
   */
  getReceipt: asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const payment = await finePaymentModel.findById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if user has permission (member can only view their own receipts)
    if (req.user.role === 'member') {
      const { query } = await import('../config/database.js');
      const transactionResult = await query(
        'SELECT m.user_id FROM transactions t JOIN members m ON t.member_id = m.id WHERE t.id = $1',
        [payment.transaction_id]
      );

      if (transactionResult.rows.length === 0 || transactionResult.rows[0].user_id !== req.user.id) {
        throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
    }

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          receipt: {
            payment_id: payment.id,
            transaction_id: payment.transaction_id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date,
            book_title: payment.book_title,
            member_name: payment.member_name,
            member_code: payment.member_code,
          },
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get all fine payments (librarian/admin only)
   */
  getAllFinePayments: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { transaction_id, payment_method, start_date, end_date } = req.query;

    const filters = {};
    if (transaction_id) filters.transaction_id = transaction_id;
    if (payment_method) filters.payment_method = payment_method;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const { payments, total } = await finePaymentModel.findAll({ page, limit, offset, filters });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          payments,
          pagination: formatPagination(page, limit, total),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get payment summary (librarian/admin only)
   */
  getPaymentSummary: asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const summary = await finePaymentModel.getSummary(filters);

    res.status(HTTP_STATUS.OK).json(formatSuccess(summary, MESSAGES.SUCCESS.RETRIEVED));
  }),
};

