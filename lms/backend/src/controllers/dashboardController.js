import { analyticsModel } from '../models/analyticsModel.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const dashboardController = {
  /**
   * Get overall dashboard statistics
   */
  getStats: asyncHandler(async (req, res) => {
    const stats = await analyticsModel.getDashboardStats();

    // Convert string numbers to integers/floats
    const formattedStats = {
      books: {
        total: parseInt(stats.total_books || 0, 10),
        available: parseInt(stats.available_books || 0, 10),
        unavailable: parseInt(stats.unavailable_books || 0, 10),
        total_copies: parseInt(stats.total_copies || 0, 10),
        total_available_copies: parseInt(stats.total_available_copies || 0, 10),
        borrowed: parseInt(stats.total_copies || 0, 10) - parseInt(stats.total_available_copies || 0, 10),
      },
      members: {
        total: parseInt(stats.total_members || 0, 10),
        active: parseInt(stats.active_members || 0, 10),
        inactive: parseInt(stats.inactive_members || 0, 10),
        suspended: parseInt(stats.suspended_members || 0, 10),
      },
      transactions: {
        issued: parseInt(stats.issued_books || 0, 10),
        overdue: parseInt(stats.overdue_books || 0, 10),
        returned: parseInt(stats.returned_books || 0, 10),
        issued_today: parseInt(stats.issued_today || 0, 10),
        issued_this_week: parseInt(stats.issued_this_week || 0, 10),
        issued_this_month: parseInt(stats.issued_this_month || 0, 10),
      },
      fines: {
        pending: parseFloat(stats.pending_fines || 0),
        total_collected: parseFloat(stats.total_fines_collected || 0),
        collected_this_month: parseFloat(stats.fines_collected_this_month || 0),
      },
      reservations: {
        pending: parseInt(stats.pending_reservations || 0, 10),
        fulfilled: parseInt(stats.fulfilled_reservations || 0, 10),
      },
      users: {
        admins: parseInt(stats.total_admins || 0, 10),
        librarians: parseInt(stats.total_librarians || 0, 10),
        members: parseInt(stats.total_member_users || 0, 10),
      },
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          stats: formattedStats,
          generated_at: new Date().toISOString(),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get popular books (most issued)
   */
  getPopularBooks: asyncHandler(async (req, res) => {
    const { limit = 10, start_date, end_date } = req.query;

    const books = await analyticsModel.getPopularBooks({
      limit: parseInt(limit, 10),
      startDate: start_date,
      endDate: end_date,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          books: books.map(book => ({
            ...book,
            issue_count: parseInt(book.issue_count || 0, 10),
            currently_issued: parseInt(book.currently_issued || 0, 10),
            currently_overdue: parseInt(book.currently_overdue || 0, 10),
          })),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get active members (most transactions)
   */
  getActiveMembers: asyncHandler(async (req, res) => {
    const { limit = 10, start_date, end_date } = req.query;

    const members = await analyticsModel.getActiveMembers({
      limit: parseInt(limit, 10),
      startDate: start_date,
      endDate: end_date,
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          members: members.map(member => ({
            ...member,
            total_transactions: parseInt(member.total_transactions || 0, 10),
            active_issues: parseInt(member.active_issues || 0, 10),
            overdue_count: parseInt(member.overdue_count || 0, 10),
            pending_fines: parseFloat(member.pending_fines || 0),
            total_fines_paid: parseFloat(member.total_fines_paid || 0),
          })),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get revenue/fine collection statistics
   */
  getRevenue: asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;

    const revenue = await analyticsModel.getRevenueStats({
      startDate: start_date,
      endDate: end_date,
    });

    const formattedRevenue = {
      total_revenue: parseFloat(revenue.total_revenue || 0),
      total_payments: parseInt(revenue.total_payments || 0, 10),
      transactions_paid: parseInt(revenue.transactions_paid || 0, 10),
      by_method: {
        cash: {
          amount: parseFloat(revenue.cash_revenue || 0),
          count: parseInt(revenue.cash_count || 0, 10),
        },
        card: {
          amount: parseFloat(revenue.card_revenue || 0),
          count: parseInt(revenue.card_count || 0, 10),
        },
        online: {
          amount: parseFloat(revenue.online_revenue || 0),
          count: parseInt(revenue.online_count || 0, 10),
        },
        other: {
          amount: parseFloat(revenue.other_revenue || 0),
          count: parseInt(revenue.other_count || 0, 10),
        },
      },
      average_payment: parseFloat(revenue.average_payment || 0),
      first_payment_date: revenue.first_payment_date,
      last_payment_date: revenue.last_payment_date,
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          revenue: formattedRevenue,
          period: {
            start_date: start_date || null,
            end_date: end_date || null,
          },
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get popular categories
   */
  getPopularCategories: asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const categories = await analyticsModel.getPopularCategories({
      limit: parseInt(limit, 10),
    });

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          categories: categories.map(cat => ({
            ...cat,
            book_count: parseInt(cat.book_count || 0, 10),
            transaction_count: parseInt(cat.transaction_count || 0, 10),
            total_copies: parseInt(cat.total_copies || 0, 10),
            available_copies: parseInt(cat.available_copies || 0, 10),
          })),
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),
};

