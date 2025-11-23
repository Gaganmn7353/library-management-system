import { query } from '../config/database.js';

export const memberModel = {
  /**
   * Create a new member
   */
  async create(memberData) {
    const {
      user_id,
      member_id,
      phone,
      address,
      membership_date,
      membership_expiry,
      status = 'active',
    } = memberData;

    const sql = `
      INSERT INTO members (user_id, member_id, phone, address, membership_date, membership_expiry, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await query(sql, [
      user_id,
      member_id,
      phone,
      address,
      membership_date || new Date(),
      membership_expiry,
      status,
    ]);
    return result.rows[0];
  },

  /**
   * Find member by ID
   */
  async findById(id) {
    const sql = `
      SELECT m.*, u.username, u.email, u.role
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Find member by user ID
   */
  async findByUserId(userId) {
    const sql = `
      SELECT m.*, u.username, u.email, u.role
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $1
    `;
    const result = await query(sql, [userId]);
    return result.rows[0];
  },

  /**
   * Find member by member_id
   */
  async findByMemberId(memberId) {
    const sql = `
      SELECT m.*, u.username, u.email, u.role
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.member_id = $1
    `;
    const result = await query(sql, [memberId]);
    return result.rows[0];
  },

  /**
   * Update member
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== 'id' && key !== 'user_id') {
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
      UPDATE members
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Delete member
   */
  async delete(id) {
    const sql = 'DELETE FROM members WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Get all members with pagination
   */
  async findAll({ page = 1, limit = 10, offset, filters = {} }) {
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      conditions.push(`m.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    if (filters.search) {
      conditions.push(`(m.member_id ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const off = offset !== undefined ? offset : (page - 1) * limit;
    values.push(limit, off);

    const sql = `
      SELECT m.*, u.username, u.email, u.role
      FROM members m
      JOIN users u ON m.user_id = u.id
      ${whereClause}
      ORDER BY m.membership_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM members m
      JOIN users u ON m.user_id = u.id
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      members: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Check if member is active
   */
  async isActive(id) {
    const sql = 'SELECT status, membership_expiry FROM members WHERE id = $1';
    const result = await query(sql, [id]);
    if (!result.rows[0]) return false;
    const { status, membership_expiry } = result.rows[0];
    return status === 'active' && new Date(membership_expiry) >= new Date();
  },

  /**
   * Get member's transactions
   */
  async getTransactions(memberId, { page = 1, limit = 10, offset }) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const values = [memberId, limit, off];
    
    const sql = `
      SELECT t.*, b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.member_id = $1
      ORDER BY t.issue_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countSql = `
      SELECT COUNT(*) as total
      FROM transactions
      WHERE member_id = $1
    `;
    
    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, [memberId]),
    ]);
    
    return {
      transactions: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Get member's reservations
   */
  async getReservations(memberId) {
    const sql = `
      SELECT r.*, b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.member_id = $1
      ORDER BY r.reservation_date DESC
    `;
    const result = await query(sql, [memberId]);
    return result.rows;
  },

  /**
   * Get active transactions for a member
   */
  async getActiveTransactions(memberId) {
    const sql = `
      SELECT *
      FROM transactions
      WHERE member_id = $1 AND status IN ('issued', 'overdue')
    `;
    const result = await query(sql, [memberId]);
    return result.rows;
  },
};

