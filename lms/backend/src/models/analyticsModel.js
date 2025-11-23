import { query } from '../config/database.js';

export const analyticsModel = {
  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats() {
    const sql = `
      SELECT 
        -- Book statistics
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM books WHERE available_quantity > 0) as available_books,
        (SELECT COUNT(*) FROM books WHERE available_quantity = 0) as unavailable_books,
        (SELECT SUM(quantity) FROM books) as total_copies,
        (SELECT SUM(available_quantity) FROM books) as total_available_copies,
        
        -- Member statistics
        (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
        (SELECT COUNT(*) FROM members) as total_members,
        (SELECT COUNT(*) FROM members WHERE status = 'inactive') as inactive_members,
        (SELECT COUNT(*) FROM members WHERE status = 'suspended') as suspended_members,
        
        -- Transaction statistics
        (SELECT COUNT(*) FROM transactions WHERE status = 'issued') as issued_books,
        (SELECT COUNT(*) FROM transactions WHERE status = 'overdue') as overdue_books,
        (SELECT COUNT(*) FROM transactions WHERE status = 'returned') as returned_books,
        (SELECT COUNT(*) FROM transactions WHERE issue_date = CURRENT_DATE) as issued_today,
        (SELECT COUNT(*) FROM transactions 
         WHERE issue_date >= CURRENT_DATE - INTERVAL '7 days') as issued_this_week,
        (SELECT COUNT(*) FROM transactions 
         WHERE issue_date >= DATE_TRUNC('month', CURRENT_DATE)) as issued_this_month,
        
        -- Fine statistics
        (SELECT COALESCE(SUM(fine_amount), 0) FROM transactions 
         WHERE status IN ('issued', 'overdue') AND fine_amount > 0) as pending_fines,
        (SELECT COALESCE(SUM(amount), 0) FROM fine_payments) as total_fines_collected,
        (SELECT COALESCE(SUM(amount), 0) FROM fine_payments 
         WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as fines_collected_this_month,
        
        -- Reservation statistics
        (SELECT COUNT(*) FROM reservations WHERE status = 'pending') as pending_reservations,
        (SELECT COUNT(*) FROM reservations WHERE status = 'fulfilled') as fulfilled_reservations,
        
        -- User statistics
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'librarian') as total_librarians,
        (SELECT COUNT(*) FROM users WHERE role = 'member') as total_member_users
    `;
    const result = await query(sql);
    return result.rows[0];
  },

  /**
   * Get popular books (most issued)
   */
  async getPopularBooks({ limit = 10, startDate, endDate } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`t.issue_date >= $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`t.issue_date <= $${paramCount}`);
      values.push(endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit);

    const sql = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.category,
        b.quantity,
        b.available_quantity,
        COUNT(t.id) as issue_count,
        COUNT(CASE WHEN t.status = 'issued' THEN 1 END) as currently_issued,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as currently_overdue
      FROM books b
      LEFT JOIN transactions t ON b.id = t.book_id ${whereClause}
      GROUP BY b.id, b.title, b.author, b.isbn, b.category, b.quantity, b.available_quantity
      ORDER BY issue_count DESC, b.title ASC
      LIMIT $${paramCount}
    `;

    const result = await query(sql, values);
    return result.rows;
  },

  /**
   * Get active members (most transactions)
   */
  async getActiveMembers({ limit = 10, startDate, endDate } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`t.issue_date >= $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`t.issue_date <= $${paramCount}`);
      values.push(endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit);

    const sql = `
      SELECT 
        m.id,
        m.member_id,
        u.username,
        u.email,
        m.phone,
        m.membership_date,
        m.membership_expiry,
        m.status,
        COUNT(t.id) as total_transactions,
        COUNT(CASE WHEN t.status IN ('issued', 'overdue') THEN 1 END) as active_issues,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_count,
        COALESCE(SUM(CASE WHEN t.status IN ('issued', 'overdue') THEN t.fine_amount ELSE 0 END), 0) as pending_fines,
        COALESCE(SUM(fp.amount), 0) as total_fines_paid
      FROM members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN transactions t ON m.id = t.member_id ${whereClause}
      LEFT JOIN fine_payments fp ON t.id = fp.transaction_id
      WHERE m.status = 'active'
      GROUP BY m.id, m.member_id, u.username, u.email, m.phone, 
               m.membership_date, m.membership_expiry, m.status
      ORDER BY total_transactions DESC, m.membership_date DESC
      LIMIT $${paramCount}
    `;

    const result = await query(sql, values);
    return result.rows;
  },

  /**
   * Get revenue/fine collection statistics
   */
  async getRevenueStats({ startDate, endDate } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`fp.payment_date >= $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`fp.payment_date <= $${paramCount}`);
      values.push(endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COALESCE(SUM(fp.amount), 0) as total_revenue,
        COUNT(DISTINCT fp.id) as total_payments,
        COUNT(DISTINCT fp.transaction_id) as transactions_paid,
        COALESCE(SUM(CASE WHEN fp.payment_method = 'cash' THEN fp.amount ELSE 0 END), 0) as cash_revenue,
        COALESCE(SUM(CASE WHEN fp.payment_method = 'card' THEN fp.amount ELSE 0 END), 0) as card_revenue,
        COALESCE(SUM(CASE WHEN fp.payment_method = 'online' THEN fp.amount ELSE 0 END), 0) as online_revenue,
        COALESCE(SUM(CASE WHEN fp.payment_method = 'other' THEN fp.amount ELSE 0 END), 0) as other_revenue,
        COUNT(CASE WHEN fp.payment_method = 'cash' THEN 1 END) as cash_count,
        COUNT(CASE WHEN fp.payment_method = 'card' THEN 1 END) as card_count,
        COUNT(CASE WHEN fp.payment_method = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN fp.payment_method = 'other' THEN 1 END) as other_count,
        COALESCE(AVG(fp.amount), 0) as average_payment,
        MIN(fp.payment_date) as first_payment_date,
        MAX(fp.payment_date) as last_payment_date
      FROM fine_payments fp
      ${whereClause}
    `;

    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Get popular categories
   */
  async getPopularCategories({ limit = 10 } = {}) {
    const sql = `
      SELECT 
        b.category,
        COUNT(DISTINCT b.id) as book_count,
        COUNT(t.id) as transaction_count,
        SUM(b.quantity) as total_copies,
        SUM(b.available_quantity) as available_copies
      FROM books b
      LEFT JOIN transactions t ON b.id = t.book_id
      WHERE b.category IS NOT NULL
      GROUP BY b.category
      ORDER BY transaction_count DESC, book_count DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  },

  /**
   * Get circulation report (transactions by date range)
   */
  async getCirculationReport({ startDate, endDate, groupBy = 'day' } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`t.issue_date >= $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`t.issue_date <= $${paramCount}`);
      values.push(endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Group by day, week, or month
    let dateGroup;
    switch (groupBy) {
      case 'week':
        dateGroup = `DATE_TRUNC('week', t.issue_date)`;
        break;
      case 'month':
        dateGroup = `DATE_TRUNC('month', t.issue_date)`;
        break;
      default:
        dateGroup = `DATE(t.issue_date)`;
    }

    const sql = `
      SELECT 
        ${dateGroup} as period,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN t.status = 'issued' THEN 1 END) as issued_count,
        COUNT(CASE WHEN t.status = 'returned' THEN 1 END) as returned_count,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_count,
        COUNT(DISTINCT t.member_id) as unique_members,
        COUNT(DISTINCT t.book_id) as unique_books,
        COALESCE(SUM(t.fine_amount), 0) as total_fines
      FROM transactions t
      ${whereClause}
      GROUP BY ${dateGroup}
      ORDER BY period DESC
    `;

    const result = await query(sql, values);
    return result.rows;
  },

  /**
   * Get overdue report
   */
  async getOverdueReport({ includeDetails = false } = {}) {
    const sql = `
      SELECT 
        t.id,
        t.member_id,
        t.book_id,
        t.issue_date,
        t.due_date,
        t.fine_amount,
        t.status,
        CURRENT_DATE - t.due_date as days_overdue,
        m.member_id as member_code,
        u.username as member_name,
        u.email as member_email,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn,
        COALESCE(SUM(fp.amount), 0) as paid_amount,
        t.fine_amount - COALESCE(SUM(fp.amount), 0) as remaining_fine
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      LEFT JOIN fine_payments fp ON t.id = fp.transaction_id
      WHERE t.status IN ('issued', 'overdue')
        AND t.due_date < CURRENT_DATE
        AND t.return_date IS NULL
      GROUP BY t.id, t.member_id, t.book_id, t.issue_date, t.due_date, 
               t.fine_amount, t.status, m.member_id, u.username, u.email,
               b.title, b.author, b.isbn
      ORDER BY days_overdue DESC, t.due_date ASC
    `;

    const result = await query(sql);
    return result.rows;
  },

  /**
   * Get inventory report
   */
  async getInventoryReport({ category, lowStock = false } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (category) {
      conditions.push(`b.category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (lowStock) {
      conditions.push(`b.available_quantity <= 2`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.category,
        b.publisher,
        b.publication_year,
        b.quantity,
        b.available_quantity,
        b.quantity - b.available_quantity as borrowed_count,
        CASE 
          WHEN b.available_quantity = 0 THEN 'out_of_stock'
          WHEN b.available_quantity <= 2 THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        COUNT(t.id) as total_issues,
        COUNT(CASE WHEN t.status IN ('issued', 'overdue') THEN 1 END) as current_issues
      FROM books b
      LEFT JOIN transactions t ON b.id = t.book_id
      ${whereClause}
      GROUP BY b.id, b.title, b.author, b.isbn, b.category, b.publisher,
               b.publication_year, b.quantity, b.available_quantity
      ORDER BY b.category, b.title
    `;

    const result = await query(sql, values);
    return result.rows;
  },

  /**
   * Get membership report
   */
  async getMembershipReport({ status, startDate, endDate } = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`m.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (startDate) {
      conditions.push(`m.membership_date >= $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`m.membership_date <= $${paramCount}`);
      values.push(endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        m.id,
        m.member_id,
        u.username,
        u.email,
        m.phone,
        m.address,
        m.membership_date,
        m.membership_expiry,
        m.status,
        CASE 
          WHEN m.membership_expiry < CURRENT_DATE THEN 'expired'
          WHEN m.membership_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'active'
        END as membership_status,
        COUNT(t.id) as total_transactions,
        COUNT(CASE WHEN t.status IN ('issued', 'overdue') THEN 1 END) as active_issues,
        COALESCE(SUM(CASE WHEN t.status IN ('issued', 'overdue') THEN t.fine_amount ELSE 0 END), 0) as pending_fines,
        COALESCE(SUM(fp.amount), 0) as total_fines_paid
      FROM members m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN transactions t ON m.id = t.member_id
      LEFT JOIN fine_payments fp ON t.id = fp.transaction_id
      ${whereClause}
      GROUP BY m.id, m.member_id, u.username, u.email, m.phone, m.address,
               m.membership_date, m.membership_expiry, m.status
      ORDER BY m.membership_date DESC
    `;

    const result = await query(sql, values);
    return result.rows;
  },
};

