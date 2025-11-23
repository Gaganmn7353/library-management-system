import ExcelJS from 'exceljs';
import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Generate Excel file from data
 */
const generateExcel = async (data, headers, sheetName = 'Sheet1') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set column headers with styling
  worksheet.columns = headers.map((header) => ({
    header: header.label,
    key: header.key,
    width: header.width || 15,
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  data.forEach((row) => {
    const worksheetRow = worksheet.addRow(row);
    worksheetRow.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Export all books to Excel
 */
export const exportBooks = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;

    let sql = `
      SELECT 
        id,
        title,
        author,
        isbn,
        publisher,
        publication_year,
        category,
        quantity,
        available_quantity,
        description,
        created_at,
        updated_at
      FROM books
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      sql += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      sql += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR isbn ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status === 'available') {
      sql += ` AND available_quantity > 0`;
    } else if (status === 'unavailable') {
      sql += ` AND available_quantity = 0`;
    }

    sql += ` ORDER BY title ASC`;

    const result = await query(sql, params);
    const books = result.rows;

    // Define headers
    const headers = [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'title', label: 'Title', width: 30 },
      { key: 'author', label: 'Author', width: 25 },
      { key: 'isbn', label: 'ISBN', width: 20 },
      { key: 'publisher', label: 'Publisher', width: 25 },
      { key: 'publication_year', label: 'Year', width: 12 },
      { key: 'category', label: 'Category', width: 15 },
      { key: 'quantity', label: 'Total Qty', width: 12 },
      { key: 'available_quantity', label: 'Available', width: 12 },
      { key: 'description', label: 'Description', width: 40 },
      { key: 'created_at', label: 'Created At', width: 20 },
      { key: 'updated_at', label: 'Updated At', width: 20 },
    ];

    // Generate Excel
    const buffer = await generateExcel(books, headers, 'Books');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `books_export_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.send(buffer);

    logger.info(`Books export generated: ${books.length} records`);
  } catch (error) {
    logger.error('Error exporting books:', error);
    next(new AppError('Failed to export books', 500));
  }
};

/**
 * Export all members to Excel
 */
export const exportMembers = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.member_id,
        u.username,
        u.email,
        u.role,
        m.phone,
        m.address,
        m.membership_date,
        m.membership_expiry,
        m.status,
        m.created_at,
        m.updated_at
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      sql += ` AND m.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      sql += ` AND (
        u.username ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        m.member_id ILIKE $${paramCount} OR
        m.phone ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY m.membership_date DESC`;

    const result = await query(sql, params);
    const members = result.rows;

    // Define headers
    const headers = [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'member_id', label: 'Member ID', width: 15 },
      { key: 'username', label: 'Username', width: 20 },
      { key: 'email', label: 'Email', width: 30 },
      { key: 'role', label: 'Role', width: 12 },
      { key: 'phone', label: 'Phone', width: 15 },
      { key: 'address', label: 'Address', width: 40 },
      { key: 'membership_date', label: 'Membership Date', width: 18 },
      { key: 'membership_expiry', label: 'Expiry Date', width: 18 },
      { key: 'status', label: 'Status', width: 12 },
      { key: 'created_at', label: 'Created At', width: 20 },
      { key: 'updated_at', label: 'Updated At', width: 20 },
    ];

    // Generate Excel
    const buffer = await generateExcel(members, headers, 'Members');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `members_export_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.send(buffer);

    logger.info(`Members export generated: ${members.length} records`);
  } catch (error) {
    logger.error('Error exporting members:', error);
    next(new AppError('Failed to export members', 500));
  }
};

/**
 * Export transactions to Excel
 */
export const exportTransactions = async (req, res, next) => {
  try {
    const { start_date, end_date, status, member_id, book_id } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.member_id,
        m.member_id as member_code,
        u.username as member_name,
        u.email as member_email,
        t.book_id,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn,
        t.issue_date,
        t.due_date,
        t.return_date,
        t.fine_amount,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      sql += ` AND t.issue_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      sql += ` AND t.issue_date <= $${paramCount}`;
      params.push(end_date);
    }

    if (status) {
      paramCount++;
      sql += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (member_id) {
      paramCount++;
      sql += ` AND t.member_id = $${paramCount}`;
      params.push(parseInt(member_id));
    }

    if (book_id) {
      paramCount++;
      sql += ` AND t.book_id = $${paramCount}`;
      params.push(parseInt(book_id));
    }

    sql += ` ORDER BY t.issue_date DESC`;

    const result = await query(sql, params);
    const transactions = result.rows;

    // Define headers
    const headers = [
      { key: 'id', label: 'ID', width: 10 },
      { key: 'member_id', label: 'Member ID', width: 12 },
      { key: 'member_code', label: 'Member Code', width: 15 },
      { key: 'member_name', label: 'Member Name', width: 20 },
      { key: 'member_email', label: 'Member Email', width: 30 },
      { key: 'book_id', label: 'Book ID', width: 12 },
      { key: 'book_title', label: 'Book Title', width: 30 },
      { key: 'book_author', label: 'Author', width: 25 },
      { key: 'book_isbn', label: 'ISBN', width: 20 },
      { key: 'issue_date', label: 'Issue Date', width: 15 },
      { key: 'due_date', label: 'Due Date', width: 15 },
      { key: 'return_date', label: 'Return Date', width: 15 },
      { key: 'fine_amount', label: 'Fine Amount', width: 15 },
      { key: 'status', label: 'Status', width: 12 },
      { key: 'created_at', label: 'Created At', width: 20 },
      { key: 'updated_at', label: 'Updated At', width: 20 },
    ];

    // Generate Excel
    const buffer = await generateExcel(transactions, headers, 'Transactions');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `transactions_export_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.send(buffer);

    logger.info(`Transactions export generated: ${transactions.length} records`);
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    next(new AppError('Failed to export transactions', 500));
  }
};

/**
 * Export complete database to Excel (multiple sheets)
 */
export const exportAll = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Library Management System';
    workbook.created = new Date();

    // Export Books
    const booksResult = await query(`
      SELECT 
        id, title, author, isbn, publisher, publication_year,
        category, quantity, available_quantity, description,
        created_at, updated_at
      FROM books
      ORDER BY title ASC
    `);

    const booksSheet = workbook.addWorksheet('Books');
    booksSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Author', key: 'author', width: 25 },
      { header: 'ISBN', key: 'isbn', width: 20 },
      { header: 'Publisher', key: 'publisher', width: 25 },
      { header: 'Year', key: 'publication_year', width: 12 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Total Qty', key: 'quantity', width: 12 },
      { header: 'Available', key: 'available_quantity', width: 12 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 },
    ];
    booksSheet.addRows(booksResult.rows);
    booksSheet.getRow(1).font = { bold: true };
    booksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Export Members
    const membersResult = await query(`
      SELECT 
        m.id, m.member_id, u.username, u.email, u.role,
        m.phone, m.address, m.membership_date, m.membership_expiry,
        m.status, m.created_at, m.updated_at
      FROM members m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.membership_date DESC
    `);

    const membersSheet = workbook.addWorksheet('Members');
    membersSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Member ID', key: 'member_id', width: 15 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Membership Date', key: 'membership_date', width: 18 },
      { header: 'Expiry Date', key: 'membership_expiry', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 },
    ];
    membersSheet.addRows(membersResult.rows);
    membersSheet.getRow(1).font = { bold: true };
    membersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Export Transactions
    let transactionsSql = `
      SELECT 
        t.id, t.member_id, m.member_id as member_code,
        u.username as member_name, u.email as member_email,
        t.book_id, b.title as book_title, b.author as book_author,
        b.isbn as book_isbn, t.issue_date, t.due_date,
        t.return_date, t.fine_amount, t.status,
        t.created_at, t.updated_at
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      transactionsSql += ` AND t.issue_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      transactionsSql += ` AND t.issue_date <= $${paramCount}`;
      params.push(end_date);
    }

    transactionsSql += ` ORDER BY t.issue_date DESC`;

    const transactionsResult = await query(transactionsSql, params);

    const transactionsSheet = workbook.addWorksheet('Transactions');
    transactionsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Member ID', key: 'member_id', width: 12 },
      { header: 'Member Code', key: 'member_code', width: 15 },
      { header: 'Member Name', key: 'member_name', width: 20 },
      { header: 'Member Email', key: 'member_email', width: 30 },
      { header: 'Book ID', key: 'book_id', width: 12 },
      { header: 'Book Title', key: 'book_title', width: 30 },
      { header: 'Author', key: 'book_author', width: 25 },
      { header: 'ISBN', key: 'book_isbn', width: 20 },
      { header: 'Issue Date', key: 'issue_date', width: 15 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Return Date', key: 'return_date', width: 15 },
      { header: 'Fine Amount', key: 'fine_amount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 },
    ];
    transactionsSheet.addRows(transactionsResult.rows);
    transactionsSheet.getRow(1).font = { bold: true };
    transactionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Export Reservations
    const reservationsResult = await query(`
      SELECT 
        r.id, r.member_id, m.member_id as member_code,
        u.username as member_name, b.title as book_title,
        b.author as book_author, r.reservation_date,
        r.status, r.created_at, r.updated_at
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON r.book_id = b.id
      ORDER BY r.reservation_date DESC
    `);

    const reservationsSheet = workbook.addWorksheet('Reservations');
    reservationsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Member ID', key: 'member_id', width: 12 },
      { header: 'Member Code', key: 'member_code', width: 15 },
      { header: 'Member Name', key: 'member_name', width: 20 },
      { header: 'Book Title', key: 'book_title', width: 30 },
      { header: 'Author', key: 'book_author', width: 25 },
      { header: 'Reservation Date', key: 'reservation_date', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 },
    ];
    reservationsSheet.addRows(reservationsResult.rows);
    reservationsSheet.getRow(1).font = { bold: true };
    reservationsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Export Fine Payments
    const finePaymentsResult = await query(`
      SELECT 
        fp.id, fp.transaction_id, t.member_id,
        m.member_id as member_code, u.username as member_name,
        b.title as book_title, fp.amount, fp.payment_method,
        fp.payment_date, fp.created_at
      FROM fine_payments fp
      JOIN transactions t ON fp.transaction_id = t.id
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      ORDER BY fp.payment_date DESC
    `);

    const finePaymentsSheet = workbook.addWorksheet('Fine Payments');
    finePaymentsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Transaction ID', key: 'transaction_id', width: 15 },
      { header: 'Member ID', key: 'member_id', width: 12 },
      { header: 'Member Code', key: 'member_code', width: 15 },
      { header: 'Member Name', key: 'member_name', width: 20 },
      { header: 'Book Title', key: 'book_title', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Payment Date', key: 'payment_date', width: 18 },
      { header: 'Created At', key: 'created_at', width: 20 },
    ];
    finePaymentsSheet.addRows(finePaymentsResult.rows);
    finePaymentsSheet.getRow(1).font = { bold: true };
    finePaymentsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `complete_export_${timestamp}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.send(buffer);

    logger.info('Complete database export generated');
  } catch (error) {
    logger.error('Error exporting complete database:', error);
    next(new AppError('Failed to export database', 500));
  }
};

export const exportController = {
  exportBooks,
  exportMembers,
  exportTransactions,
  exportAll,
};

