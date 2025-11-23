import { query } from '../config/database.js';

export const reservationModel = {
  /**
   * Create a new reservation
   */
  async create(reservationData) {
    const { member_id, book_id, status = 'pending' } = reservationData;

    const sql = `
      INSERT INTO reservations (member_id, book_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await query(sql, [member_id, book_id, status]);
    return result.rows[0];
  },

  /**
   * Find reservation by ID
   */
  async findById(id) {
    const sql = `
      SELECT r.*,
             m.member_id, u.username as member_name, u.email as member_email,
             b.title as book_title, b.author as book_author, b.isbn as book_isbn
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON r.book_id = b.id
      WHERE r.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Update reservation
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
      UPDATE reservations
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  },

  /**
   * Delete reservation
   */
  async delete(id) {
    const sql = 'DELETE FROM reservations WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  },

  /**
   * Get all reservations with pagination
   */
  async findAll({ page = 1, limit = 10, offset, filters = {} }) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.member_id) {
      conditions.push(`r.member_id = $${paramCount}`);
      values.push(filters.member_id);
      paramCount++;
    }

    if (filters.book_id) {
      conditions.push(`r.book_id = $${paramCount}`);
      values.push(filters.book_id);
      paramCount++;
    }

    if (filters.status) {
      conditions.push(`r.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, off);

    const sql = `
      SELECT r.*,
             m.member_id, u.username as member_name,
             b.title as book_title, b.author as book_author
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON r.book_id = b.id
      ${whereClause}
      ORDER BY r.reservation_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM reservations r
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      reservations: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Find pending reservation by member and book
   */
  async findPendingByMemberAndBook(memberId, bookId) {
    const sql = `
      SELECT *
      FROM reservations
      WHERE member_id = $1 AND book_id = $2 AND status = 'pending'
      LIMIT 1
    `;
    const result = await query(sql, [memberId, bookId]);
    return result.rows[0] || null;
  },

  /**
   * Get reservations by member ID with pagination
   */
  async findByMemberId(memberId, { page = 1, limit = 10, offset, filters = {} } = {}) {
    const off = offset !== undefined ? offset : (page - 1) * limit;
    const conditions = ['r.member_id = $1'];
    const values = [memberId];
    let paramCount = 2;

    if (filters.status) {
      conditions.push(`r.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    values.push(limit, off);

    const sql = `
      SELECT r.*, 
             b.title as book_title, b.author as book_author, b.isbn as book_isbn,
             b.available_quantity, b.quantity
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      ${whereClause}
      ORDER BY r.reservation_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM reservations r
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(sql, values),
      query(countSql, values.slice(0, -2)),
    ]);

    return {
      reservations: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Get queue position for a reservation
   */
  async getQueuePosition(reservationId) {
    const reservation = await this.findById(reservationId);
    if (!reservation || reservation.status !== 'pending') {
      return null;
    }

    const sql = `
      SELECT COUNT(*) as position
      FROM reservations
      WHERE book_id = $1
        AND status = 'pending'
        AND reservation_date < (
          SELECT reservation_date
          FROM reservations
          WHERE id = $2
        )
    `;
    const result = await query(sql, [reservation.book_id, reservationId]);
    return parseInt(result.rows[0].position, 10);
  },

  /**
   * Get reservations by book ID (queue order)
   */
  async findByBookId(bookId, status = 'pending') {
    const conditions = ['r.book_id = $1'];
    const values = [bookId];
    
    if (status) {
      conditions.push(`r.status = $2`);
      values.push(status);
    }

    const sql = `
      SELECT r.*, 
             m.member_id, u.username as member_name, u.email as member_email,
             ROW_NUMBER() OVER (ORDER BY r.reservation_date ASC) as queue_position
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.reservation_date ASC
    `;
    const result = await query(sql, values);
    return result.rows;
  },

  /**
   * Get next reservation in queue for a book
   */
  async getNextInQueue(bookId) {
    const sql = `
      SELECT r.*, m.member_id, u.username as member_name, u.email as member_email
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE r.book_id = $1 AND r.status = 'pending'
      ORDER BY r.reservation_date ASC
      LIMIT 1
    `;
    const result = await query(sql, [bookId]);
    return result.rows[0] || null;
  },

  /**
   * Get expired fulfilled reservations (not collected within 48 hours)
   */
  async findExpiredFulfilled() {
    const sql = `
      SELECT r.*, 
             m.member_id, u.username as member_name, u.email as member_email,
             b.title as book_title
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      JOIN users u ON m.user_id = u.id
      JOIN books b ON r.book_id = b.id
      WHERE r.status = 'fulfilled'
        AND r.reservation_date < NOW() - INTERVAL '48 hours'
    `;
    const result = await query(sql);
    return result.rows;
  },

  /**
   * Update expired reservations to expired status and release books
   */
  async expireReservations() {
    const { getClient } = await import('../config/database.js');
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Find expired fulfilled reservations
      const expiredResult = await client.query(
        `SELECT r.*, b.id as book_id
         FROM reservations r
         JOIN books b ON r.book_id = b.id
         WHERE r.status = 'fulfilled'
           AND r.reservation_date < NOW() - INTERVAL '48 hours'
         FOR UPDATE`
      );

      const expiredReservations = expiredResult.rows;

      // Update status to expired and release books
      for (const reservation of expiredReservations) {
        await client.query(
          `UPDATE reservations SET status = 'expired' WHERE id = $1`,
          [reservation.id]
        );
        
        // Release the book back to available
        await client.query(
          `UPDATE books SET available_quantity = available_quantity + 1 WHERE id = $1`,
          [reservation.book_id]
        );
      }

      await client.query('COMMIT');
      
      return expiredReservations;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

