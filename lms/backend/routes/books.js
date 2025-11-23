import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all books with pagination and search
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.q || '';
    const filter = req.query.filter || 'all'; // title, author, subject, all
    const subject = req.query.subject || '';
    const year = req.query.year || '';
    const sort = req.query.sort || 'title'; // title, author, year, popularity
    const order = req.query.order || 'ASC'; // ASC, DESC

    let whereConditions = [];
    let params = [];

    if (search) {
      if (filter === 'title') {
        whereConditions.push('title LIKE ?');
        params.push(`%${search}%`);
      } else if (filter === 'author') {
        whereConditions.push('author LIKE ?');
        params.push(`%${search}%`);
      } else if (filter === 'subject') {
        whereConditions.push('subject LIKE ?');
        params.push(`%${search}%`);
      } else {
        whereConditions.push('(title LIKE ? OR author LIKE ? OR isbn LIKE ? OR subject LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
    }

    if (subject) {
      whereConditions.push('subject = ?');
      params.push(subject);
    }

    if (year) {
      whereConditions.push('publication_year = ?');
      params.push(year);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    let orderClause = '';
    if (sort === 'title') {
      orderClause = `ORDER BY title ${order}`;
    } else if (sort === 'author') {
      orderClause = `ORDER BY author ${order}`;
    } else if (sort === 'year') {
      orderClause = `ORDER BY publication_year ${order}`;
    } else if (sort === 'popularity') {
      orderClause = `ORDER BY (SELECT COUNT(*) FROM transactions WHERE transactions.book_id = books.id) ${order}`;
    } else {
      orderClause = 'ORDER BY title ASC';
    }

    const countSql = `SELECT COUNT(*) as total FROM books ${whereClause}`;
    const countResult = await db.get(countSql, params);
    const total = countResult.total;

    const sql = `
      SELECT books.*, 
             (SELECT COUNT(*) FROM transactions WHERE transactions.book_id = books.id) as issue_count
      FROM books 
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const books = await db.all(sql, params);

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await db.get('SELECT * FROM books WHERE id = ?', [req.params.id]);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get issue count
    const issueCount = await db.get(
      'SELECT COUNT(*) as count FROM transactions WHERE book_id = ?',
      [req.params.id]
    );
    book.issue_count = issueCount.count;

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search books
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const filter = req.query.filter || 'all';

    if (!q) {
      return res.json({ books: [] });
    }

    let sql = 'SELECT * FROM books WHERE ';
    let params = [];

    if (filter === 'title') {
      sql += 'title LIKE ?';
      params.push(`%${q}%`);
    } else if (filter === 'author') {
      sql += 'author LIKE ?';
      params.push(`%${q}%`);
    } else if (filter === 'subject') {
      sql += 'subject LIKE ?';
      params.push(`%${q}%`);
    } else {
      sql += '(title LIKE ? OR author LIKE ? OR isbn LIKE ? OR subject LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ' LIMIT 10';

    const books = await db.all(sql, params);
    res.json({ books });
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create book (librarian only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { isbn, title, author, subject, publisher, publication_year, total_copies, shelf_location } = req.body;

    if (!isbn || !title || !author || !subject) {
      return res.status(400).json({ error: 'ISBN, title, author, and subject are required' });
    }

    const result = await db.run(
      `INSERT INTO books (isbn, title, author, subject, publisher, publication_year, total_copies, available_copies, shelf_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isbn, title, author, subject, publisher || null, publication_year || null, total_copies || 1, total_copies || 1, shelf_location || null]
    );

    const book = await db.get('SELECT * FROM books WHERE id = ?', [result.id]);
    res.status(201).json(book);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'ISBN already exists' });
    }
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update book (librarian only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { isbn, title, author, subject, publisher, publication_year, total_copies, available_copies, shelf_location } = req.body;

    const existingBook = await db.get('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Calculate available copies adjustment
    const newTotalCopies = total_copies !== undefined ? total_copies : existingBook.total_copies;
    const currentIssued = existingBook.total_copies - existingBook.available_copies;
    const newAvailableCopies = Math.max(0, newTotalCopies - currentIssued);

    await db.run(
      `UPDATE books 
       SET isbn = ?, title = ?, author = ?, subject = ?, publisher = ?, publication_year = ?, 
           total_copies = ?, available_copies = ?, shelf_location = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        isbn || existingBook.isbn,
        title || existingBook.title,
        author || existingBook.author,
        subject || existingBook.subject,
        publisher !== undefined ? publisher : existingBook.publisher,
        publication_year !== undefined ? publication_year : existingBook.publication_year,
        newTotalCopies,
        available_copies !== undefined ? available_copies : newAvailableCopies,
        shelf_location !== undefined ? shelf_location : existingBook.shelf_location,
        req.params.id
      ]
    );

    const book = await db.get('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete book (librarian only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const book = await db.get('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if book has active transactions
    const activeTransactions = await db.get(
      'SELECT COUNT(*) as count FROM transactions WHERE book_id = ? AND status IN ("issued", "overdue")',
      [req.params.id]
    );

    if (activeTransactions.count > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active transactions' });
    }

    await db.run('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
