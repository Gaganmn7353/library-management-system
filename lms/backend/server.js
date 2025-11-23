import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import db from './db.js';
import authRoutes from './routes/auth.js';
import booksRoutes from './routes/books.js';
import membersRoutes from './routes/members.js';
import transactionsRoutes from './routes/transactions.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Library Management System API is running' });
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalBooks = await db.get('SELECT COUNT(*) as count FROM books');
    const availableBooks = await db.get('SELECT SUM(available_copies) as count FROM books');
    const totalMembers = await db.get('SELECT COUNT(*) as count FROM members');
    const activeMembers = await db.get('SELECT COUNT(*) as count FROM members WHERE status = "active"');
    const issuedBooks = await db.get('SELECT COUNT(*) as count FROM transactions WHERE status IN ("issued", "overdue")');
    const today = new Date().toISOString().split('T')[0];
    const overdueBooks = await db.get('SELECT COUNT(*) as count FROM transactions WHERE (status = "overdue" OR (status = "issued" AND due_date < ?))', [today]);
    const totalFines = await db.get('SELECT COALESCE(SUM(fine_amount), 0) as total FROM transactions WHERE paid = 0 AND fine_amount > 0');

    res.json({
      total_books: totalBooks.count,
      available_books: availableBooks.count || 0,
      issued_books: issuedBooks.count,
      total_members: totalMembers.count,
      active_members: activeMembers.count,
      overdue_books: overdueBooks.count,
      total_fines: totalFines.total
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
