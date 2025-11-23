import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Calculate fine
function calculateFine(dueDate, returnDate = null) {
  const today = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) { // 1 day grace period
    return 0;
  }
  
  const fine = (diffDays - 1) * 2; // $2 per day after grace period
  return Math.min(fine, 50); // Max $50
}

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const memberId = req.query.member_id || '';
    const bookId = req.query.book_id || '';

    let whereConditions = [];
    let params = [];

    if (status) {
      whereConditions.push('transactions.status = ?');
      params.push(status);
    }

    if (memberId) {
      whereConditions.push('transactions.member_id = ?');
      params.push(memberId);
    }

    if (bookId) {
      whereConditions.push('transactions.book_id = ?');
      params.push(bookId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const countSql = `SELECT COUNT(*) as total FROM transactions ${whereClause}`;
    const countResult = await db.get(countSql, params);
    const total = countResult.total;

    const sql = `
      SELECT transactions.*,
             books.title as book_title,
             books.isbn as book_isbn,
             books.author as book_author,
             members.name as member_name,
             members.member_id as member_member_id,
             members.email as member_email
      FROM transactions
      JOIN books ON transactions.book_id = books.id
      JOIN members ON transactions.member_id = members.id
      ${whereClause}
      ORDER BY transactions.issue_date DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    let transactions = await db.all(sql, params);

    // Update overdue status and fines
    const today = new Date().toISOString().split('T')[0];
    for (const transaction of transactions) {
      if (transaction.status === 'issued') {
        const dueDate = transaction.due_date;
        if (today > dueDate) {
          const fine = calculateFine(dueDate);
          if (fine > 0) {
            // Update in database
            await db.run(
              'UPDATE transactions SET status = ?, fine_amount = ? WHERE id = ?',
              ['overdue', fine, transaction.id]
            );
            // Update local object
            transaction.status = 'overdue';
            transaction.fine_amount = fine;
          }
        }
      }
    }

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue transactions
router.get('/overdue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const transactions = await db.all(`
      SELECT transactions.*,
             books.title as book_title,
             books.isbn as book_isbn,
             books.author as book_author,
             members.name as member_name,
             members.member_id as member_member_id,
             members.email as member_email
      FROM transactions
      JOIN books ON transactions.book_id = books.id
      JOIN members ON transactions.member_id = members.id
      WHERE transactions.status IN ('issued', 'overdue')
        AND transactions.due_date < ?
      ORDER BY transactions.due_date ASC
    `, [today]);

    // Calculate and update fines
    for (const transaction of transactions) {
      const fine = calculateFine(transaction.due_date);
      transaction.fine_amount = fine;
      transaction.status = 'overdue';
      
      await db.run(
        'UPDATE transactions SET status = ?, fine_amount = ? WHERE id = ?',
        ['overdue', fine, transaction.id]
      );
    }

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching overdue transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get member transactions
router.get('/member/:memberId', async (req, res) => {
  try {
    const transactions = await db.all(`
      SELECT transactions.*,
             books.title as book_title,
             books.isbn as book_isbn,
             books.author as book_author
      FROM transactions
      JOIN books ON transactions.book_id = books.id
      WHERE transactions.member_id = ?
      ORDER BY transactions.issue_date DESC
    `, [req.params.memberId]);

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Issue book
router.post('/issue', requireAuth, async (req, res) => {
  try {
    const { book_id, member_id, due_date } = req.body;

    if (!book_id || !member_id) {
      return res.status(400).json({ error: 'Book ID and member ID are required' });
    }

    // Check if book is available
    const book = await db.get('SELECT * FROM books WHERE id = ?', [book_id]);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({ error: 'Book is not available' });
    }

    // Check if member exists and is active
    const member = await db.get('SELECT * FROM members WHERE id = ?', [member_id]);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.status !== 'active') {
      return res.status(400).json({ error: 'Member is not active' });
    }

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create transaction
    const result = await db.run(
      `INSERT INTO transactions (book_id, member_id, issue_date, due_date, status, fine_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [book_id, member_id, issueDate, dueDate, 'issued', 0]
    );

    // Update available copies
    await db.run(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [book_id]
    );

    const transaction = await db.get(`
      SELECT transactions.*,
             books.title as book_title,
             books.isbn as book_isbn,
             members.name as member_name
      FROM transactions
      JOIN books ON transactions.book_id = books.id
      JOIN members ON transactions.member_id = members.id
      WHERE transactions.id = ?
    `, [result.id]);

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error issuing book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Return book
router.put('/:id/return', requireAuth, async (req, res) => {
  try {
    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status === 'returned') {
      return res.status(400).json({ error: 'Book already returned' });
    }

    const returnDate = new Date().toISOString().split('T')[0];
    const fine = calculateFine(transaction.due_date, returnDate);

    // Update transaction
    await db.run(
      `UPDATE transactions 
       SET return_date = ?, fine_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [returnDate, fine, 'returned', req.params.id]
    );

    // Update available copies
    await db.run(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [transaction.book_id]
    );

    const updatedTransaction = await db.get(`
      SELECT transactions.*,
             books.title as book_title,
             books.isbn as book_isbn,
             members.name as member_name
      FROM transactions
      JOIN books ON transactions.book_id = books.id
      JOIN members ON transactions.member_id = members.id
      WHERE transactions.id = ?
    `, [req.params.id]);

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pay fine
router.put('/:id/pay', requireAuth, async (req, res) => {
  try {
    await db.run(
      'UPDATE transactions SET paid = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );

    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    res.json(transaction);
  } catch (error) {
    console.error('Error paying fine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
