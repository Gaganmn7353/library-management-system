import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const librarian = await db.get(
      'SELECT * FROM librarians WHERE username = ?',
      [username]
    );

    if (!librarian) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, librarian.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.librarianId = librarian.id;
    req.session.username = librarian.username;
    req.session.role = librarian.role;

    res.json({
      message: 'Login successful',
      user: {
        id: librarian.id,
        username: librarian.username,
        name: librarian.name,
        email: librarian.email,
        role: librarian.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Verify session
router.get('/verify', (req, res) => {
  if (req.session && req.session.librarianId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.librarianId,
        username: req.session.username,
        role: req.session.role
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
