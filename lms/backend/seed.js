import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import config from './src/config/env.js';

dotenv.config();

// Create database connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
});

// Sample books data
const booksData = [
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0-06-112008-4',
    publisher: 'Harper Perennial',
    publication_year: 1960,
    category: 'Fiction',
    quantity: 10,
    available_quantity: 8,
    description: 'A gripping tale of racial injustice and childhood innocence in the American South.',
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0-7432-7356-5',
    publisher: 'Scribner',
    publication_year: 1925,
    category: 'Fiction',
    quantity: 8,
    available_quantity: 6,
    description: 'A classic American novel about the Jazz Age and the American Dream.',
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0-452-28423-4',
    publisher: 'Signet Classics',
    publication_year: 1949,
    category: 'Fiction',
    quantity: 12,
    available_quantity: 10,
    description: 'A dystopian social science fiction novel about totalitarian control.',
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0-06-231609-7',
    publisher: 'Harper',
    publication_year: 2014,
    category: 'Non-Fiction',
    quantity: 15,
    available_quantity: 12,
    description: 'An exploration of how Homo sapiens conquered the world.',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0-7352-1129-2',
    publisher: 'Avery',
    publication_year: 2018,
    category: 'Non-Fiction',
    quantity: 20,
    available_quantity: 18,
    description: 'An easy and proven way to build good habits and break bad ones.',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    isbn: '978-0-201-61622-4',
    publisher: 'Addison-Wesley',
    publication_year: 1999,
    category: 'Technology',
    quantity: 10,
    available_quantity: 7,
    description: 'A guide to becoming a better software developer.',
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0-13-235088-4',
    publisher: 'Prentice Hall',
    publication_year: 2008,
    category: 'Technology',
    quantity: 12,
    available_quantity: 9,
    description: 'A handbook of agile software craftsmanship.',
  },
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    isbn: '978-0-262-03384-8',
    publisher: 'MIT Press',
    publication_year: 2009,
    category: 'Technology',
    quantity: 8,
    available_quantity: 5,
    description: 'Comprehensive introduction to algorithms and data structures.',
  },
  {
    title: 'The Art of War',
    author: 'Sun Tzu',
    isbn: '978-0-486-42557-4',
    publisher: 'Dover Publications',
    publication_year: 1910,
    category: 'History',
    quantity: 10,
    available_quantity: 8,
    description: 'An ancient Chinese military treatise on strategy and tactics. (Reprint edition)',
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0-553-10953-5',
    publisher: 'Bantam Books',
    publication_year: 1988,
    category: 'Science',
    quantity: 15,
    available_quantity: 13,
    description: 'A popular science book about cosmology and theoretical physics.',
  },
];

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...\n');

    // Begin transaction
    await client.query('BEGIN');

    // ============================================
    // 1. Create Users
    // ============================================
    console.log('👤 Creating users...');

    // Admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@library.com']);
    
    let adminUserId;
    if (adminCheck.rows.length === 0) {
      const adminResult = await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['admin', 'admin@library.com', adminPasswordHash, 'admin']
      );
      adminUserId = adminResult.rows[0].id;
      console.log('  ✅ Created admin user (username: admin, password: admin123)');
    } else {
      adminUserId = adminCheck.rows[0].id;
      console.log('  ℹ️  Admin user already exists');
    }

    // Librarian user
    const librarianPasswordHash = await bcrypt.hash('librarian123', 10);
    const librarianCheck = await client.query('SELECT id FROM users WHERE email = $1', ['librarian@library.com']);
    
    let librarianUserId;
    if (librarianCheck.rows.length === 0) {
      const librarianResult = await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['librarian', 'librarian@library.com', librarianPasswordHash, 'librarian']
      );
      librarianUserId = librarianResult.rows[0].id;
      console.log('  ✅ Created librarian user (username: librarian, password: librarian123)');
    } else {
      librarianUserId = librarianCheck.rows[0].id;
      console.log('  ℹ️  Librarian user already exists');
    }

    // Sample member user
    const memberPasswordHash = await bcrypt.hash('member123', 10);
    const memberCheck = await client.query('SELECT id FROM users WHERE email = $1', ['member@library.com']);
    
    let memberUserId;
    if (memberCheck.rows.length === 0) {
      const memberResult = await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['member', 'member@library.com', memberPasswordHash, 'member']
      );
      memberUserId = memberResult.rows[0].id;
      console.log('  ✅ Created member user (username: member, password: member123)');
    } else {
      memberUserId = memberCheck.rows[0].id;
      console.log('  ℹ️  Member user already exists');
    }

    // ============================================
    // 2. Create Members (linked to users)
    // ============================================
    console.log('\n👥 Creating members...');

    // Admin member profile
    const adminMemberCheck = await client.query('SELECT id FROM members WHERE user_id = $1', [adminUserId]);
    if (adminMemberCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO members (user_id, member_id, phone, address, membership_date, membership_expiry, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          adminUserId,
          'ADM001',
          '+1-555-0100',
          '123 Library Street, Admin Building',
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'active',
        ]
      );
      console.log('  ✅ Created admin member profile');
    } else {
      console.log('  ℹ️  Admin member profile already exists');
    }

    // Librarian member profile
    const librarianMemberCheck = await client.query('SELECT id FROM members WHERE user_id = $1', [librarianUserId]);
    if (librarianMemberCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO members (user_id, member_id, phone, address, membership_date, membership_expiry, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          librarianUserId,
          'LIB001',
          '+1-555-0101',
          '456 Library Street, Librarian Office',
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'active',
        ]
      );
      console.log('  ✅ Created librarian member profile');
    } else {
      console.log('  ℹ️  Librarian member profile already exists');
    }

    // Sample member profile
    const memberMemberCheck = await client.query('SELECT id FROM members WHERE user_id = $1', [memberUserId]);
    if (memberMemberCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO members (user_id, member_id, phone, address, membership_date, membership_expiry, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          memberUserId,
          'MEM001',
          '+1-555-0102',
          '789 Main Street, City',
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'active',
        ]
      );
      console.log('  ✅ Created sample member profile');
    } else {
      console.log('  ℹ️  Sample member profile already exists');
    }

    // ============================================
    // 3. Create Books
    // ============================================
    console.log('\n📚 Creating books...');
    let booksCreated = 0;
    let booksSkipped = 0;

    for (const book of booksData) {
      // Check if book exists by ISBN
      const bookCheck = await client.query('SELECT id FROM books WHERE isbn = $1', [book.isbn]);
      
      if (bookCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO books (title, author, isbn, publisher, publication_year, category, quantity, available_quantity, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            book.title,
            book.author,
            book.isbn,
            book.publisher,
            book.publication_year,
            book.category,
            book.quantity,
            book.available_quantity,
            book.description,
          ]
        );
        booksCreated++;
      } else {
        booksSkipped++;
      }
    }

    console.log(`  ✅ Created ${booksCreated} new books`);
    if (booksSkipped > 0) {
      console.log(`  ℹ️  Skipped ${booksSkipped} existing books`);
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Default Login Credentials:');
    console.log('   Admin:     username: admin,     password: admin123');
    console.log('   Librarian: username: librarian, password: librarian123');
    console.log('   Member:    username: member,    password: member123');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run seed function
seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
