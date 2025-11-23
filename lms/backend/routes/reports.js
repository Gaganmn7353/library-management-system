import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Popular books
router.get('/popular-books', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const books = await db.all(`
      SELECT books.*,
             COUNT(transactions.id) as issue_count
      FROM books
      LEFT JOIN transactions ON books.id = transactions.book_id
      GROUP BY books.id
      ORDER BY issue_count DESC
      LIMIT ?
    `, [limit]);

    res.json({ books });
  } catch (error) {
    console.error('Error fetching popular books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Overdue summary
router.get('/overdue-summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const overdueCount = await db.get(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE status = 'overdue' OR (status = 'issued' AND due_date < ?)
    `, [today]);

    const totalFines = await db.get(`
      SELECT COALESCE(SUM(fine_amount), 0) as total
      FROM transactions
      WHERE (status = 'overdue' OR (status = 'issued' AND due_date < ?))
        AND paid = 0
    `, [today]);

    const paidFines = await db.get(`
      SELECT COALESCE(SUM(fine_amount), 0) as total
      FROM transactions
      WHERE paid = 1
    `);

    res.json({
      overdue_count: overdueCount.count,
      total_outstanding_fines: totalFines.total,
      total_paid_fines: paidFines.total
    });
  } catch (error) {
    console.error('Error fetching overdue summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Member activity
router.get('/member-activity', async (req, res) => {
  try {
    const activeMembers = await db.get(`
      SELECT COUNT(*) as count
      FROM members
      WHERE status = 'active'
    `);

    const inactiveMembers = await db.get(`
      SELECT COUNT(*) as count
      FROM members
      WHERE status = 'inactive'
    `);

    const membersByType = await db.all(`
      SELECT member_type, COUNT(*) as count
      FROM members
      GROUP BY member_type
    `);

    const recentTransactions = await db.get(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE issue_date >= date('now', '-30 days')
    `);

    res.json({
      active_members: activeMembers.count,
      inactive_members: inactiveMembers.count,
      members_by_type: membersByType,
      recent_transactions: recentTransactions.count
    });
  } catch (error) {
    console.error('Error fetching member activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Monthly trends
router.get('/monthly-trends', async (req, res) => {
  try {
    const months = await db.all(`
      SELECT 
        strftime('%Y-%m', issue_date) as month,
        COUNT(*) as issue_count,
        SUM(CASE WHEN return_date IS NOT NULL THEN 1 ELSE 0 END) as return_count
      FROM transactions
      WHERE issue_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', issue_date)
      ORDER BY month ASC
    `);

    res.json({ months });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Category distribution
router.get('/category-distribution', async (req, res) => {
  try {
    const categories = await db.all(`
      SELECT 
        books.subject,
        COUNT(transactions.id) as transaction_count
      FROM books
      LEFT JOIN transactions ON books.id = transactions.book_id
      GROUP BY books.subject
      ORDER BY transaction_count DESC
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fine collection over time
router.get('/fine-collection', async (req, res) => {
  try {
    const fines = await db.all(`
      SELECT 
        strftime('%Y-%m', return_date) as month,
        SUM(fine_amount) as total_fines,
        SUM(CASE WHEN paid = 1 THEN fine_amount ELSE 0 END) as paid_fines
      FROM transactions
      WHERE return_date IS NOT NULL AND fine_amount > 0
      GROUP BY strftime('%Y-%m', return_date)
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({ fines });
  } catch (error) {
    console.error('Error fetching fine collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
