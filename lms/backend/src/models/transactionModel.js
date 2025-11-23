import { query } from '../config/database.js';

export const transactionModel = {
  /**
   * Create a new transaction
   */
  async create(transactionData) {
    const {
      member_id,
      book_id,
      issue_date,
      due_date,
      status = 'issued',
    } = transactionData;

    const sql = `
      INSERT INTO transactions (member_id, book_id, issue_date, due_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(sql, [
      member_id,
      book_id,
      issue_date || new Date(),
      due_date,
      status,
    ]);
    return result.rows[0];
  },

  /**
   * Find transaction by ID
   */
  async findById(id) {
    const sql = `
      SELECT t.*,
             m.member_id, u.username as member_name, u.email as member_email,
             b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE t.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Update transaction
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const sql = `
      UPDATE transactions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Delete transaction
   */
  async delete(id) {
    const sql = 'DELETE FROM transactions WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Get all transactions with pagination
   */
  async findAll({ page = 1, limit = 10, offset, filters = {} }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.member_id) {
      conditions.push(`t.member_id = $${paramCount}`);
      values.push(filters.member_id);
      paramCount++;
    }

    if (filters.book_id) {
      conditions.push(`t.book_id = $${paramCount}`);
      values.push(filters.book_id);
      paramCount++;
    }

    if (filters.status) {
      conditions.push(`t.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const sql = `
      SELECT t.*,
             m.member_id, u.username as member_name,
             b.title as book_title, b.author as book_author
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      ${whereClause}
      ORDER BY t.issue_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      transactions: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Get transactions by member ID
   */
  async findByMemberId(memberId, status = null) {
    const conditions = ['t.member_id = $1'];
    const values = [memberId];

    if (status) {
      conditions.push('t.status = $2');
      values.push(status);
    }

    const sql = `
      SELECT t.*,
             b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.issue_date DESC
    `;
    const result = await query(sql, values);
    return result.rows;
  },

  /**
   * Get overdue transactions with pagination
   */
  async findOverdue({ page = 1, limit = 10, offset }) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const values = [limit, off];
    
    const sql = `
      SELECT t.*,
             m.member_id, u.username as member_name,
             b.title as book_title
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON t.book_id = b.id
      WHERE t.status IN ('issued', 'overdue')
        AND t.due_date < CURRENT_DATE
        AND t.return_date IS NULL
      ORDER BY t.due_date ASC
      LIMIT $1 OFFSET $2
    `;
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE t.status IN ('issued', 'overdue')
        AND t.due_date < CURRENT_DATE
        AND t.return_date IS NULL
    `;
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql),
    ]);
    
    return {
      transactions: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Find active transactions by member ID
   */
  async findActiveByMemberId(memberId) {
    const sql = `
      SELECT *
      FROM transactions
      WHERE member_id = $1 AND status IN ('issued', 'overdue')
      ORDER BY issue_date DESC
    `;
    const result = await query(sql, [memberId]);
    return result.rows;
  },

  /**
   * Find active transaction by member and book
   */
  async findActiveByMemberAndBook(memberId, bookId) {
    const sql = `
      SELECT *
      FROM transactions
      WHERE member_id = $1 AND book_id = $2 AND status IN ('issued', 'overdue')
      LIMIT 1
    `;
    const result = await query(sql, [memberId, bookId]);
    return result.rows[0] || null;
  },

  /**
   * Get member transactions with pagination
   */
  async findMemberTransactions(memberId, { page = 1, limit = 10, offset, filters = {} }) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const conditions = ['t.member_id = $1'];
    const values = [memberId];
    let paramCount = 2;

    if (filters.status) {
      conditions.push(`t.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    values.push(limit, off);

    const sql = `
      SELECT t.*,
             b.title as book_title, b.author as book_author, b.isbn as book_isbn,
             b.cover_image_url as book_cover
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      ${whereClause}
      ORDER BY t.issue_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      transactions: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Calculate total pending fine for a member
   * Includes fines from unpaid transactions (issued/overdue status)
   */
  async calculatePendingFine(memberId) {
    const sql = `
      SELECT COALESCE(SUM(t.fine_amount), 0) as total_pending_fine
      FROM transactions t
      WHERE t.member_id = $1 
        AND t.status IN ('issued', 'overdue')
        AND t.fine_amount > 0
    `;
    const result = await query(sql, [memberId]);
    return parseFloat(result.rows[0].total_pending_fine || 0);
  },

  /**
   * Update transaction status to overdue based on due date
   */
  async updateOverdueStatus(transactionId, fineAmount) {
    const sql = `
      UPDATE transactions
      SET status = 'overdue',
          fine_amount = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [fineAmount, transactionId]);
    return result.rows[0];
  },

  /**
   * Get transactions that need overdue status update
   */
  async findTransactionsNeedingOverdueUpdate() {
    const sql = `
      SELECT t.*
      FROM transactions t
      WHERE t.status = 'issued'
        AND t.due_date < CURRENT_DATE
        AND t.return_date IS NULL
    `;
    const result = await query(sql);
    return result.rows;
  },
};

