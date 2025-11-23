import { query } from '../config/database.js';

export const finePaymentModel = {
  /**
   * Create a new fine payment
   */
  async create(paymentData) {
    const { transaction_id, amount, payment_method, payment_date } = paymentData;

    const sql = `
      INSERT INTO fine_payments (transaction_id, amount, payment_method, payment_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await query(sql, [
      transaction_id,
      amount,
      payment_method,
      payment_date || new Date(),
    ]);
    return result.rows[0];
  },

  /**
   * Find fine payment by ID
   */
  async findById(id) {
    const sql = `
      SELECT fp.*,
             t.member_id, t.book_id, t.fine_amount as transaction_fine_amount,
             m.member_id as member_code, u.username as member_name,
             b.title as book_title
      FROM fine_payments fp
      JOIN transactions t ON fp.transaction_id = t.id
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE fp.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Get all fine payments with pagination
   */
  async findAll({ page = 1, limit = 10, offset, filters = {} }) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.transaction_id) {
      conditions.push(`fp.transaction_id = $${paramCount}`);
      values.push(filters.transaction_id);
      paramCount++;
    }

    if (filters.payment_method) {
      conditions.push(`fp.payment_method = $${paramCount}`);
      values.push(filters.payment_method);
      paramCount++;
    }

    if (filters.start_date) {
      conditions.push(`fp.payment_date >= $${paramCount}`);
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      conditions.push(`fp.payment_date <= $${paramCount}`);
      values.push(filters.end_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, off);

    const sql = `
      SELECT fp.*,
             t.member_id, t.fine_amount as transaction_fine_amount,
             m.member_id as member_code, u.username as member_name,
             b.title as book_title
      FROM fine_payments fp
      JOIN transactions t ON fp.transaction_id = t.id
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      ${whereClause}
      ORDER BY fp.payment_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM fine_payments fp
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      payments: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Find payments by transaction ID
   */
  async findByTransactionId(transactionId) {
    const sql = `
      SELECT *
      FROM fine_payments
      WHERE transaction_id = $1
      ORDER BY payment_date ASC
    `;
    const result = await query(sql, [transactionId]);
    return result.rows;
  },

  /**
   * Get payment summary
   */
  async getSummary(filters = {}) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.start_date) {
      conditions.push(`payment_date >= $${paramCount}`);
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      conditions.push(`payment_date <= $${paramCount}`);
      values.push(filters.end_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(DISTINCT transaction_id) as total_transactions,
        COUNT(DISTINCT CASE WHEN payment_method = 'cash' THEN id END) as cash_payments,
        COUNT(DISTINCT CASE WHEN payment_method = 'card' THEN id END) as card_payments,
        COUNT(DISTINCT CASE WHEN payment_method = 'online' THEN id END) as online_payments,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0) as card_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'online' THEN amount ELSE 0 END), 0) as online_amount
      FROM fine_payments
      ${whereClause}
    `;

    const result = await query(sql, values);
    return result.rows[0];
  },
};

