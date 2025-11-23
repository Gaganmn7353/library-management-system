import { analyticsModel } from '../models/analyticsModel.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { formatSuccess } from '../utils/helpers.js';
import { arrayToCSV, generateCSVFilename, formatDateForCSV, formatCurrencyForCSV } from '../utils/csvExporter.js';
import logger from '../utils/logger.js';

export const reportsController = {
  /**
   * Get circulation report
   */
  getCirculationReport: asyncHandler(async (req, res) => {
    const { start_date, end_date, group_by = 'day', export_csv = false } = req.query;

    const report = await analyticsModel.getCirculationReport({
      startDate: start_date,
      endDate: end_date,
      groupBy: group_by,
    });

    // Format dates
    const formattedReport = report.map(item => ({
      ...item,
      period: item.period ? new Date(item.period).toISOString().split('T')[0] : null,
      total_transactions: parseInt(item.total_transactions || 0, 10),
      issued_count: parseInt(item.issued_count || 0, 10),
      returned_count: parseInt(item.returned_count || 0, 10),
      overdue_count: parseInt(item.overdue_count || 0, 10),
      unique_members: parseInt(item.unique_members || 0, 10),
      unique_books: parseInt(item.unique_books || 0, 10),
      total_fines: parseFloat(item.total_fines || 0),
    }));

    // Export as CSV if requested
    if (export_csv === 'true' || export_csv === true) {
      const csv = arrayToCSV(formattedReport, [
        ['period', 'Period'],
        ['total_transactions', 'Total Transactions'],
        ['issued_count', 'Issued'],
        ['returned_count', 'Returned'],
        ['overdue_count', 'Overdue'],
        ['unique_members', 'Unique Members'],
        ['unique_books', 'Unique Books'],
        ['total_fines', 'Total Fines'],
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${generateCSVFilename('circulation_report')}"`);
      return res.send(csv);
    }

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          report: formattedReport,
          summary: {
            total_periods: formattedReport.length,
            total_transactions: formattedReport.reduce((sum, r) => sum + r.total_transactions, 0),
            total_fines: formattedReport.reduce((sum, r) => sum + r.total_fines, 0),
          },
          filters: {
            start_date: start_date || null,
            end_date: end_date || null,
            group_by: group_by,
          },
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get overdue report
   */
  getOverdueReport: asyncHandler(async (req, res) => {
    const { export_csv = false } = req.query;

    const report = await analyticsModel.getOverdueReport({ includeDetails: true });

    // Format report
    const formattedReport = report.map(item => ({
      transaction_id: item.id,
      member_code: item.member_code,
      member_name: item.member_name,
      member_email: item.member_email,
      book_title: item.book_title,
      book_author: item.book_author,
      book_isbn: item.book_isbn,
      issue_date: formatDateForCSV(item.issue_date),
      due_date: formatDateForCSV(item.due_date),
      days_overdue: parseInt(item.days_overdue || 0, 10),
      fine_amount: parseFloat(item.fine_amount || 0),
      paid_amount: parseFloat(item.paid_amount || 0),
      remaining_fine: parseFloat(item.remaining_fine || 0),
    }));

    // Export as CSV if requested
    if (export_csv === 'true' || export_csv === true) {
      const csv = arrayToCSV(formattedReport, [
        ['transaction_id', 'Transaction ID'],
        ['member_code', 'Member Code'],
        ['member_name', 'Member Name'],
        ['member_email', 'Email'],
        ['book_title', 'Book Title'],
        ['book_author', 'Author'],
        ['book_isbn', 'ISBN'],
        ['issue_date', 'Issue Date'],
        ['due_date', 'Due Date'],
        ['days_overdue', 'Days Overdue'],
        ['fine_amount', 'Fine Amount'],
        ['paid_amount', 'Paid Amount'],
        ['remaining_fine', 'Remaining Fine'],
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${generateCSVFilename('overdue_report')}"`);
      return res.send(csv);
    }

    const summary = {
      total_overdue: formattedReport.length,
      total_fine_amount: formattedReport.reduce((sum, r) => sum + r.fine_amount, 0),
      total_paid: formattedReport.reduce((sum, r) => sum + r.paid_amount, 0),
      total_remaining: formattedReport.reduce((sum, r) => sum + r.remaining_fine, 0),
      average_days_overdue: formattedReport.length > 0
        ? Math.round(formattedReport.reduce((sum, r) => sum + r.days_overdue, 0) / formattedReport.length)
        : 0,
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          report: formattedReport,
          summary,
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get inventory report
   */
  getInventoryReport: asyncHandler(async (req, res) => {
    const { category, low_stock = false, export_csv = false } = req.query;

    const report = await analyticsModel.getInventoryReport({
      category: category,
      lowStock: low_stock === 'true' || low_stock === true,
    });

    // Format report
    const formattedReport = report.map(item => ({
      book_id: item.id,
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      category: item.category,
      publisher: item.publisher,
      publication_year: item.publication_year,
      quantity: parseInt(item.quantity || 0, 10),
      available_quantity: parseInt(item.available_quantity || 0, 10),
      borrowed_count: parseInt(item.borrowed_count || 0, 10),
      stock_status: item.stock_status,
      total_issues: parseInt(item.total_issues || 0, 10),
      current_issues: parseInt(item.current_issues || 0, 10),
    }));

    // Export as CSV if requested
    if (export_csv === 'true' || export_csv === true) {
      const csv = arrayToCSV(formattedReport, [
        ['book_id', 'Book ID'],
        ['title', 'Title'],
        ['author', 'Author'],
        ['isbn', 'ISBN'],
        ['category', 'Category'],
        ['publisher', 'Publisher'],
        ['publication_year', 'Publication Year'],
        ['quantity', 'Total Quantity'],
        ['available_quantity', 'Available Quantity'],
        ['borrowed_count', 'Borrowed'],
        ['stock_status', 'Stock Status'],
        ['total_issues', 'Total Issues'],
        ['current_issues', 'Current Issues'],
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${generateCSVFilename('inventory_report')}"`);
      return res.send(csv);
    }

    const summary = {
      total_books: formattedReport.length,
      total_copies: formattedReport.reduce((sum, r) => sum + r.quantity, 0),
      total_available: formattedReport.reduce((sum, r) => sum + r.available_quantity, 0),
      total_borrowed: formattedReport.reduce((sum, r) => sum + r.borrowed_count, 0),
      out_of_stock: formattedReport.filter(r => r.stock_status === 'out_of_stock').length,
      low_stock: formattedReport.filter(r => r.stock_status === 'low_stock').length,
      in_stock: formattedReport.filter(r => r.stock_status === 'in_stock').length,
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          report: formattedReport,
          summary,
          filters: {
            category: category || null,
            low_stock_only: low_stock === 'true' || low_stock === true,
          },
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),

  /**
   * Get membership report
   */
  getMembershipReport: asyncHandler(async (req, res) => {
    const { status, start_date, end_date, export_csv = false } = req.query;

    const report = await analyticsModel.getMembershipReport({
      status: status,
      startDate: start_date,
      endDate: end_date,
    });

    // Format report
    const formattedReport = report.map(item => ({
      member_id: item.id,
      member_code: item.member_id,
      username: item.username,
      email: item.email,
      phone: item.phone,
      address: item.address,
      membership_date: formatDateForCSV(item.membership_date),
      membership_expiry: formatDateForCSV(item.membership_expiry),
      status: item.status,
      membership_status: item.membership_status,
      total_transactions: parseInt(item.total_transactions || 0, 10),
      active_issues: parseInt(item.active_issues || 0, 10),
      pending_fines: parseFloat(item.pending_fines || 0),
      total_fines_paid: parseFloat(item.total_fines_paid || 0),
    }));

    // Export as CSV if requested
    if (export_csv === 'true' || export_csv === true) {
      const csv = arrayToCSV(formattedReport, [
        ['member_id', 'Member ID'],
        ['member_code', 'Member Code'],
        ['username', 'Username'],
        ['email', 'Email'],
        ['phone', 'Phone'],
        ['address', 'Address'],
        ['membership_date', 'Membership Date'],
        ['membership_expiry', 'Membership Expiry'],
        ['status', 'Status'],
        ['membership_status', 'Membership Status'],
        ['total_transactions', 'Total Transactions'],
        ['active_issues', 'Active Issues'],
        ['pending_fines', 'Pending Fines'],
        ['total_fines_paid', 'Total Fines Paid'],
      ]);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${generateCSVFilename('membership_report')}"`);
      return res.send(csv);
    }

    const summary = {
      total_members: formattedReport.length,
      by_status: {
        active: formattedReport.filter(r => r.status === 'active').length,
        inactive: formattedReport.filter(r => r.status === 'inactive').length,
        suspended: formattedReport.filter(r => r.status === 'suspended').length,
      },
      by_membership_status: {
        active: formattedReport.filter(r => r.membership_status === 'active').length,
        expired: formattedReport.filter(r => r.membership_status === 'expired').length,
        expiring_soon: formattedReport.filter(r => r.membership_status === 'expiring_soon').length,
      },
      total_pending_fines: formattedReport.reduce((sum, r) => sum + r.pending_fines, 0),
      total_fines_paid: formattedReport.reduce((sum, r) => sum + r.total_fines_paid, 0),
    };

    res.status(HTTP_STATUS.OK).json(
      formatSuccess(
        {
          report: formattedReport,
          summary,
          filters: {
            status: status || null,
            start_date: start_date || null,
            end_date: end_date || null,
          },
        },
        MESSAGES.SUCCESS.RETRIEVED
      )
    );
  }),
};

