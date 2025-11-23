import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all members with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.q || '';
    const memberType = req.query.type || '';
    const status = req.query.status || '';

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR member_id LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (memberType) {
      whereConditions.push('member_type = ?');
      params.push(memberType);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const countSql = `SELECT COUNT(*) as total FROM members ${whereClause}`;
    const countResult = await db.get(countSql, params);
    const total = countResult.total;

    const sql = `
      SELECT * FROM members 
      ${whereClause}
      ORDER BY registration_date DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const members = await db.all(sql, params);

    res.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get member by ID
router.get('/:id', async (req, res) => {
  try {
    const member = await db.get('SELECT * FROM members WHERE id = ?', [req.params.id]);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Get transaction count
    const transactionCount = await db.get(
      'SELECT COUNT(*) as count FROM transactions WHERE member_id = ?',
      [req.params.id]
    );
    member.transaction_count = transactionCount.count;

    // Get current issued books count
    const issuedCount = await db.get(
      'SELECT COUNT(*) as count FROM transactions WHERE member_id = ? AND status IN ("issued", "overdue")',
      [req.params.id]
    );
    member.current_issued = issuedCount.count;

    res.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create member
router.post('/', async (req, res) => {
  try {
    const { member_id, name, email, phone, member_type, registration_date, status } = req.body;

    if (!member_id || !name || !email || !member_type) {
      return res.status(400).json({ error: 'Member ID, name, email, and member type are required' });
    }

    const result = await db.run(
      `INSERT INTO members (member_id, name, email, phone, member_type, registration_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        member_id,
        name,
        email,
        phone || null,
        member_type,
        registration_date || new Date().toISOString().split('T')[0],
        status || 'active'
      ]
    );

    const member = await db.get('SELECT * FROM members WHERE id = ?', [result.id]);
    res.status(201).json(member);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Member ID or email already exists' });
    }
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, member_type, status } = req.body;

    const existingMember = await db.get('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!existingMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await db.run(
      `UPDATE members 
       SET name = ?, email = ?, phone = ?, member_type = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || existingMember.name,
        email || existingMember.email,
        phone !== undefined ? phone : existingMember.phone,
        member_type || existingMember.member_type,
        status !== undefined ? status : existingMember.status,
        req.params.id
      ]
    );

    const member = await db.get('SELECT * FROM members WHERE id = ?', [req.params.id]);
    res.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete member
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const member = await db.get('SELECT * FROM members WHERE id = ?', [req.params.id]);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Check if member has active transactions
    const activeTransactions = await db.get(
      'SELECT COUNT(*) as count FROM transactions WHERE member_id = ? AND status IN ("issued", "overdue")',
      [req.params.id]
    );

    if (activeTransactions.count > 0) {
      return res.status(400).json({ error: 'Cannot delete member with active transactions' });
    }

    await db.run('DELETE FROM members WHERE id = ?', [req.params.id]);
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
