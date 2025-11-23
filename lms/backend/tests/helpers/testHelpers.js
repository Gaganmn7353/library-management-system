import { testQuery } from './testDatabase.js';

/**
 * Wait for a specified amount of time
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get a user by email
 */
export const getUserByEmail = async (email) => {
  const result = await testQuery('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

/**
 * Get a book by ISBN
 */
export const getBookByISBN = async (isbn) => {
  const result = await testQuery('SELECT * FROM books WHERE isbn = $1', [isbn]);
  return result.rows[0] || null;
};

/**
 * Get a member by member_id
 */
export const getMemberByMemberId = async (memberId) => {
  const result = await testQuery('SELECT * FROM members WHERE member_id = $1', [memberId]);
  return result.rows[0] || null;
};

/**
 * Get active transactions for a member
 */
export const getActiveTransactions = async (memberId) => {
  const result = await testQuery(
    "SELECT * FROM transactions WHERE member_id = $1 AND status IN ('issued', 'overdue')",
    [memberId]
  );
  return result.rows;
};

/**
 * Calculate pending fine for a member
 */
export const calculatePendingFine = async (memberId) => {
  const result = await testQuery(
    `SELECT COALESCE(SUM(t.fine_amount - COALESCE(SUM(fp.amount), 0)), 0) as pending_fine
     FROM transactions t
     LEFT JOIN fine_payments fp ON t.id = fp.transaction_id
     WHERE t.member_id = $1 AND t.status IN ('issued', 'overdue')
     GROUP BY t.id`,
    [memberId]
  );

  return result.rows.reduce((sum, row) => sum + parseFloat(row.pending_fine || 0), 0);
};

/**
 * Assert response structure
 */
export const assertSuccessResponse = (response, expectedDataKeys = []) => {
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');

  if (expectedDataKeys.length > 0) {
    expectedDataKeys.forEach((key) => {
      expect(response.body.data).toHaveProperty(key);
    });
  }
};

/**
 * Assert error response structure
 */
export const assertErrorResponse = (response, expectedStatus, expectedMessage = null) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');

  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
};

/**
 * Create authenticated request headers
 */
export const createAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});


