import bcrypt from 'bcrypt';
import { testQuery } from './testDatabase.js';

/**
 * Generate mock user data
 */
export const generateMockUser = (overrides = {}) => {
  return {
    username: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test@1234',
    role: 'member',
    ...overrides,
  };
};

/**
 * Generate mock book data
 */
export const generateMockBook = (overrides = {}) => {
  return {
    title: `Test Book ${Date.now()}`,
    author: 'Test Author',
    isbn: `978-${Math.floor(Math.random() * 1000000000000)}`,
    publisher: 'Test Publisher',
    publication_year: 2023,
    category: 'Fiction',
    quantity: 10,
    available_quantity: 10,
    description: 'Test book description',
    ...overrides,
  };
};

/**
 * Generate mock member data
 */
export const generateMockMember = (userId, overrides = {}) => {
  return {
    user_id: userId,
    member_id: `MEM${Date.now()}`,
    phone: '+1234567890',
    address: '123 Test Street',
    membership_date: new Date().toISOString().split('T')[0],
    membership_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    ...overrides,
  };
};

/**
 * Create a test user in the database
 */
export const createTestUser = async (userData = {}) => {
  const user = generateMockUser(userData);
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const result = await testQuery(
    `INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [user.username, user.email, hashedPassword, user.role]
  );

  return { ...result.rows[0], password: user.password };
};

/**
 * Create a test book in the database
 */
export const createTestBook = async (bookData = {}) => {
  const book = generateMockBook(bookData);

  const result = await testQuery(
    `INSERT INTO books (title, author, isbn, publisher, publication_year, category, quantity, available_quantity, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
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

  return result.rows[0];
};

/**
 * Create a test member in the database
 */
export const createTestMember = async (userId, memberData = {}) => {
  const member = generateMockMember(userId, memberData);

  const result = await testQuery(
    `INSERT INTO members (user_id, member_id, phone, address, membership_date, membership_expiry, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      member.user_id,
      member.member_id,
      member.phone,
      member.address,
      member.membership_date,
      member.membership_expiry,
      member.status,
    ]
  );

  return result.rows[0];
};

/**
 * Create a test transaction in the database
 */
export const createTestTransaction = async (memberId, bookId, transactionData = {}) => {
  const issueDate = transactionData.issue_date || new Date().toISOString().split('T')[0];
  const dueDate = transactionData.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const result = await testQuery(
    `INSERT INTO transactions (member_id, book_id, issue_date, due_date, return_date, fine_amount, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      memberId,
      bookId,
      issueDate,
      dueDate,
      transactionData.return_date || null,
      transactionData.fine_amount || 0,
      transactionData.status || 'issued',
    ]
  );

  return result.rows[0];
};

/**
 * Create a test reservation in the database
 */
export const createTestReservation = async (memberId, bookId, reservationData = {}) => {
  const result = await testQuery(
    `INSERT INTO reservations (member_id, book_id, reservation_date, status, created_at, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      memberId,
      bookId,
      reservationData.status || 'pending',
    ]
  );

  return result.rows[0];
};

/**
 * Generate JWT token for testing
 */
export const generateTestToken = async (user) => {
  // Import JWT helpers
  const { generateToken } = await import('../../src/utils/helpers.js');
  return generateToken({ id: user.id, username: user.username, email: user.email, role: user.role });
};

/**
 * Create complete test setup (user + member)
 */
export const createTestUserWithMember = async (userData = {}, memberData = {}) => {
  const user = await createTestUser(userData);
  const member = await createTestMember(user.id, memberData);
  const token = await generateTestToken(user);

  return { user, member, token };
};

