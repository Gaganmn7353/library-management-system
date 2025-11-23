import { finePaymentModel } from '../models/finePaymentModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { HTTP_STATUS, MESSAGES, PAYMENT_METHODS } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import { getPaginationParams, formatPagination } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const finePaymentController = {
  /**
   * Get all fine payments with pagination
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
   * Get fine payment by ID
   */
  getFinePaymentById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payment = await finePaymentModel.findById(id);

    if (!payment) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(formatSuccess(payment, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Create a new fine payment
   */
  createFinePayment: asyncHandler(async (req, res) => {
    const { transaction_id, amount, payment_method, payment_date } = req.body;

    // Check if transaction exists
    const transaction = await transactionModel.findById(transaction_id);
    if (!transaction) {
      throw new AppError('Transaction not found', HTTP_STATUS.NOT_FOUND);
    }

    // Validate payment method
    if (!Object.values(PAYMENT_METHODS).includes(payment_method)) {
      throw new AppError('Invalid payment method', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate amount
    if (amount <= 0) {
      throw new AppError('Payment amount must be greater than 0', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if payment exceeds fine amount
    const existingPayments = await finePaymentModel.findByTransactionId(transaction_id);
    const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remainingFine = parseFloat(transaction.fine_amount) - totalPaid;

    if (amount > remainingFine) {
      throw new AppError(`Payment amount exceeds remaining fine. Remaining: $${remainingFine.toFixed(2)}`, HTTP_STATUS.BAD_REQUEST);
    }

    const payment = await finePaymentModel.create({
      transaction_id,
      amount,
      payment_method,
      payment_date: payment_date || new Date().toISOString(),
    });

    logger.info(`Fine payment created: ${amount} for Transaction ID ${transaction_id}`);

    res.status(HTTP_STATUS.CREATED).json(formatSuccess(payment, 'Fine payment recorded successfully'));
  }),

  /**
   * Get payments for a specific transaction
   */
  getTransactionPayments: asyncHandler(async (req, res) => {
    const { transaction_id } = req.params;

    const transaction = await transactionModel.findById(transaction_id);
    if (!transaction) {
      throw new AppError('Transaction not found', HTTP_STATUS.NOT_FOUND);
    }

    const payments = await finePaymentModel.findByTransactionId(transaction_id);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remainingFine = parseFloat(transaction.fine_amount) - totalPaid;

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          payments,
          transaction: {
            id: transaction.id,
            fine_amount: transaction.fine_amount,
            total_paid: totalPaid,
            remaining_fine: remainingFine,
          },
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get payment summary (total collected, by method, etc.)
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

