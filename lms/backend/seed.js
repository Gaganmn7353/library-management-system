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

// 50 Random Books Data
const booksData = [
  // Fiction (15 books)
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', publisher: 'Harper Perennial', publication_year: 1960, category: 'Fiction', quantity: 10, available_quantity: 8, description: 'A gripping tale of racial injustice and childhood innocence in the American South.' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', publisher: 'Scribner', publication_year: 1925, category: 'Fiction', quantity: 8, available_quantity: 6, description: 'A classic American novel about the Jazz Age and the American Dream.' },
  { title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4', publisher: 'Signet Classics', publication_year: 1949, category: 'Fiction', quantity: 12, available_quantity: 10, description: 'A dystopian social science fiction novel about totalitarian control.' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0-14-143951-8', publisher: 'Penguin Classics', publication_year: 1813, category: 'Fiction', quantity: 15, available_quantity: 12, description: 'A romantic novel of manners written by Jane Austen.' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0', publisher: 'Little, Brown and Company', publication_year: 1951, category: 'Fiction', quantity: 9, available_quantity: 7, description: 'A controversial novel about teenage rebellion and alienation.' },
  { title: 'Lord of the Flies', author: 'William Golding', isbn: '978-0-571-05686-9', publisher: 'Faber and Faber', publication_year: 1954, category: 'Fiction', quantity: 11, available_quantity: 9, description: 'A story about a group of British boys stranded on an uninhabited island.' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0-547-92822-7', publisher: 'Houghton Mifflin', publication_year: 1937, category: 'Fiction', quantity: 14, available_quantity: 11, description: 'A fantasy novel about Bilbo Baggins and his journey.' },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '978-0-7432-4722-1', publisher: 'Simon & Schuster', publication_year: 1953, category: 'Fiction', quantity: 10, available_quantity: 8, description: 'A dystopian novel about censorship and the power of books.' },
  { title: 'Brave New World', author: 'Aldous Huxley', isbn: '978-0-06-085052-4', publisher: 'Harper Perennial', publication_year: 1932, category: 'Fiction', quantity: 9, available_quantity: 7, description: 'A dystopian novel set in a futuristic World State.' },
  { title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', isbn: '978-0-385-49078-8', publisher: 'Anchor Books', publication_year: 1985, category: 'Fiction', quantity: 13, available_quantity: 10, description: 'A dystopian novel about a totalitarian society.' },
  { title: 'The Kite Runner', author: 'Khaled Hosseini', isbn: '978-1-59448-000-3', publisher: 'Riverhead Books', publication_year: 2003, category: 'Fiction', quantity: 12, available_quantity: 9, description: 'A story of friendship, betrayal, and redemption in Afghanistan.' },
  { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-0-06-112241-5', publisher: 'HarperOne', publication_year: 1988, category: 'Fiction', quantity: 16, available_quantity: 13, description: 'A philosophical novel about following your dreams.' },
  { title: 'Life of Pi', author: 'Yann Martel', isbn: '978-0-15-602732-8', publisher: 'Harcourt', publication_year: 2001, category: 'Fiction', quantity: 11, available_quantity: 8, description: 'A fantasy adventure novel about a boy and a tiger.' },
  { title: 'The Book Thief', author: 'Markus Zusak', isbn: '978-0-375-84220-7', publisher: 'Alfred A. Knopf', publication_year: 2005, category: 'Fiction', quantity: 14, available_quantity: 11, description: 'A story set in Nazi Germany about a girl who steals books.' },
  { title: 'The Night Circus', author: 'Erin Morgenstern', isbn: '978-0-385-53463-5', publisher: 'Doubleday', publication_year: 2011, category: 'Fiction', quantity: 10, available_quantity: 7, description: 'A fantasy novel about a magical competition between two illusionists.' },

  // Non-Fiction (10 books)
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '978-0-06-231609-7', publisher: 'Harper', publication_year: 2014, category: 'Non-Fiction', quantity: 15, available_quantity: 12, description: 'An exploration of how Homo sapiens conquered the world.' },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '978-0-7352-1129-2', publisher: 'Avery', publication_year: 2018, category: 'Non-Fiction', quantity: 20, available_quantity: 18, description: 'An easy and proven way to build good habits and break bad ones.' },
  { title: 'Educated', author: 'Tara Westover', isbn: '978-0-399-59050-4', publisher: 'Random House', publication_year: 2018, category: 'Non-Fiction', quantity: 12, available_quantity: 9, description: 'A memoir about education, family, and the struggle between loyalty and independence.' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0-374-27563-1', publisher: 'Farrar, Straus and Giroux', publication_year: 2011, category: 'Non-Fiction', quantity: 13, available_quantity: 10, description: 'A book about the two systems that drive the way we think.' },
  { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', isbn: '978-1-4000-5217-2', publisher: 'Crown Publishers', publication_year: 2010, category: 'Non-Fiction', quantity: 11, available_quantity: 8, description: 'The story of how one woman\'s cells changed medical science forever.' },
  { title: 'Becoming', author: 'Michelle Obama', isbn: '978-1-5247-6313-8', publisher: 'Crown', publication_year: 2018, category: 'Non-Fiction', quantity: 18, available_quantity: 15, description: 'A memoir by the former First Lady of the United States.' },
  { title: 'Born a Crime', author: 'Trevor Noah', isbn: '978-0-399-58817-4', publisher: 'Spiegel & Grau', publication_year: 2016, category: 'Non-Fiction', quantity: 14, available_quantity: 11, description: 'Stories from a South African childhood.' },
  { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', isbn: '978-0-7432-6951-3', publisher: 'Free Press', publication_year: 1989, category: 'Non-Fiction', quantity: 16, available_quantity: 13, description: 'A business and self-help book about personal and professional effectiveness.' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '978-0-393-31755-8', publisher: 'W.W. Norton & Company', publication_year: 1997, category: 'Non-Fiction', quantity: 10, available_quantity: 7, description: 'A book about why some societies developed faster than others.' },
  { title: 'Outliers: The Story of Success', author: 'Malcolm Gladwell', isbn: '978-0-316-01792-3', publisher: 'Little, Brown and Company', publication_year: 2008, category: 'Non-Fiction', quantity: 12, available_quantity: 9, description: 'An examination of what makes high-achievers different.' },

  // Technology (10 books)
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '978-0-201-61622-4', publisher: 'Addison-Wesley', publication_year: 1999, category: 'Technology', quantity: 10, available_quantity: 7, description: 'A guide to becoming a better software developer.' },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0-13-235088-4', publisher: 'Prentice Hall', publication_year: 2008, category: 'Technology', quantity: 12, available_quantity: 9, description: 'A handbook of agile software craftsmanship.' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0-262-03384-8', publisher: 'MIT Press', publication_year: 2009, category: 'Technology', quantity: 8, available_quantity: 5, description: 'Comprehensive introduction to algorithms and data structures.' },
  { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Gang of Four', isbn: '978-0-201-63361-2', publisher: 'Addison-Wesley', publication_year: 1994, category: 'Technology', quantity: 9, available_quantity: 6, description: 'A catalog of design patterns for object-oriented programming.' },
  { title: 'You Don\'t Know JS', author: 'Kyle Simpson', isbn: '978-1-4919-0352-0', publisher: 'O\'Reilly Media', publication_year: 2015, category: 'Technology', quantity: 11, available_quantity: 8, description: 'A series of books diving deep into the core mechanisms of JavaScript.' },
  { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', isbn: '978-1-59327-584-6', publisher: 'No Starch Press', publication_year: 2018, category: 'Technology', quantity: 13, available_quantity: 10, description: 'A modern introduction to programming with JavaScript.' },
  { title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', isbn: '978-0-9847828-6-4', publisher: 'CareerCup', publication_year: 2015, category: 'Technology', quantity: 15, available_quantity: 12, description: 'A technical interview preparation guide.' },
  { title: 'System Design Interview', author: 'Alex Xu', isbn: '978-1-733-81959-0', publisher: 'Independent', publication_year: 2020, category: 'Technology', quantity: 10, available_quantity: 7, description: 'An insider\'s guide to system design interviews.' },
  { title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', isbn: '978-0-201-83595-3', publisher: 'Addison-Wesley', publication_year: 1975, category: 'Technology', quantity: 8, available_quantity: 5, description: 'Essays on software engineering and project management.' },
  { title: 'Refactoring', author: 'Martin Fowler', isbn: '978-0-201-48567-7', publisher: 'Addison-Wesley', publication_year: 1999, category: 'Technology', quantity: 11, available_quantity: 8, description: 'A guide to improving the design of existing code.' },

  // Science (5 books)
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0-553-10953-5', publisher: 'Bantam Books', publication_year: 1988, category: 'Science', quantity: 15, available_quantity: 13, description: 'A popular science book about cosmology and theoretical physics.' },
  { title: 'Cosmos', author: 'Carl Sagan', isbn: '978-0-345-33135-9', publisher: 'Random House', publication_year: 1980, category: 'Science', quantity: 12, available_quantity: 9, description: 'A popular science book about the universe and humanity\'s place in it.' },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '978-0-19-857519-1', publisher: 'Oxford University Press', publication_year: 1976, category: 'Science', quantity: 14, available_quantity: 11, description: 'A book on evolution that explains how genes drive evolution.' },
  { title: 'The Elegant Universe', author: 'Brian Greene', isbn: '978-0-393-04688-5', publisher: 'W.W. Norton & Company', publication_year: 1999, category: 'Science', quantity: 10, available_quantity: 7, description: 'An introduction to string theory and the search for the theory of everything.' },
  { title: 'The Double Helix', author: 'James D. Watson', isbn: '978-0-393-95075-5', publisher: 'W.W. Norton & Company', publication_year: 1968, category: 'Science', quantity: 9, available_quantity: 6, description: 'A personal account of the discovery of the structure of DNA.' },

  // History (5 books)
  { title: 'The Art of War', author: 'Sun Tzu', isbn: '978-0-486-42557-4', publisher: 'Dover Publications', publication_year: 1910, category: 'History', quantity: 10, available_quantity: 8, description: 'An ancient Chinese military treatise on strategy and tactics. (Reprint edition)' },
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '978-0-06-231611-0', publisher: 'Harper Perennial', publication_year: 2015, category: 'History', quantity: 13, available_quantity: 10, description: 'A brief history of how Homo sapiens conquered the world.' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '978-0-393-31755-8', publisher: 'W.W. Norton & Company', publication_year: 1997, category: 'History', quantity: 11, available_quantity: 8, description: 'A book about why some societies developed faster than others.' },
  { title: 'The Rise and Fall of the Third Reich', author: 'William L. Shirer', isbn: '978-0-671-62420-0', publisher: 'Simon & Schuster', publication_year: 1960, category: 'History', quantity: 9, available_quantity: 6, description: 'A comprehensive history of Nazi Germany.' },
  { title: 'A People\'s History of the United States', author: 'Howard Zinn', isbn: '978-0-06-083865-2', publisher: 'Harper Perennial', publication_year: 1980, category: 'History', quantity: 12, available_quantity: 9, description: 'A history of the United States from the perspective of marginalized groups.' },

  // Business (5 books)
  { title: 'Good to Great', author: 'Jim Collins', isbn: '978-0-06-662099-2', publisher: 'HarperBusiness', publication_year: 2001, category: 'Business', quantity: 14, available_quantity: 11, description: 'A business book about how good companies become great.' },
  { title: 'The Lean Startup', author: 'Eric Ries', isbn: '978-0-307-88789-4', publisher: 'Crown Business', publication_year: 2011, category: 'Business', quantity: 13, available_quantity: 10, description: 'A methodology for developing businesses and products.' },
  { title: 'Zero to One', author: 'Peter Thiel', isbn: '978-0-8041-3929-8', publisher: 'Crown Business', publication_year: 2014, category: 'Business', quantity: 11, available_quantity: 8, description: 'Notes on startups, or how to build the future.' },
  { title: 'The Innovator\'s Dilemma', author: 'Clayton M. Christensen', isbn: '978-0-87584-585-2', publisher: 'Harvard Business Review Press', publication_year: 1997, category: 'Business', quantity: 10, available_quantity: 7, description: 'A book about how successful companies can do everything right and still lose their market leadership.' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0-374-27563-1', publisher: 'Farrar, Straus and Giroux', publication_year: 2011, category: 'Business', quantity: 12, available_quantity: 9, description: 'A book about the two systems that drive the way we think.' },
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
    // 3. Create Books (50 books)
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
    console.log(`\n📊 Summary:`);
    console.log(`   - Users: 3 (admin, librarian, member)`);
    console.log(`   - Members: 3`);
    console.log(`   - Books: ${booksCreated} new books added (${booksData.length} total)`);
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
