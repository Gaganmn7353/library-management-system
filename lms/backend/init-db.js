import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'library.db');

const db = new sqlite3.Database(dbPath);

const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create Books table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isbn TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        subject TEXT NOT NULL,
        publisher TEXT,
        publication_year INTEGER,
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1,
        shelf_location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Members table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        member_type TEXT NOT NULL CHECK(member_type IN ('student', 'faculty', 'public')),
        registration_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Transactions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        fine_amount REAL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'returned', 'overdue')),
        paid BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (member_id) REFERENCES members(id)
      )
    `);

    // Create Librarians table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS librarians (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'librarian' CHECK(role IN ('admin', 'librarian')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date)`);

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    db.close();
  }
}

initDatabase().catch(console.error);
