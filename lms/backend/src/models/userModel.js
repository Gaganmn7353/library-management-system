import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export const userModel = {
  /**
   * Create a new user
   */
  async create(userData) {
    const { username, email, password_hash, role = 'member', status = 'active', updated_by = null } = userData;
    const sql = `
      INSERT INTO users (username, email, password_hash, role, status, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role, status, last_login, updated_by, created_at, updated_at
    `;
    const result = await query(sql, [username, email, password_hash, role, status, updated_by]);
    return result.rows[0];
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    const sql = 'SELECT id, username, email, role, status, last_login, updated_by, created_at, updated_at FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Find user by username
   */
  async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = $1';
    const result = await query(sql, [username]);
    return result.rows[0];
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
  },

  /**
   * Find user by username or email
   */
  async findByUsernameOrEmail(usernameOrEmail) {
    const sql = 'SELECT * FROM users WHERE username = $1 OR email = $1';
    const result = await query(sql, [usernameOrEmail]);
    return result.rows[0];
  },

  /**
   * Update user
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
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, status, last_login, updated_by, created_at, updated_at
    `;
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Delete user
   */
  async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Get all users with pagination
   */
  async findAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.role) {
      conditions.push(`role = $${paramCount}`);
      values.push(filters.role);
      paramCount++;
    }

    if (filters.search) {
      conditions.push(`(username ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const sql = `
      SELECT id, username, email, role, status, last_login, updated_by, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit,
    };
  },
};

