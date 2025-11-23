import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../../helpers/testDatabase.js';
import {
  createTestUserWithMember,
  createTestBook,
  createTestTransaction,
} from '../../helpers/mockData.js';
import { createAuthHeaders } from '../../helpers/testHelpers.js';

describe('Transaction Controller', () => {
  let librarianUser, librarianToken;
  let member1, member1Token;
  let book1, book2;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestDatabase();

    librarianUser = await createTestUserWithMember({ role: 'librarian' });
    librarianToken = librarianUser.token;

    member1 = await createTestUserWithMember({ role: 'member' });
    member1Token = member1.token;

    book1 = await createTestBook({ quantity: 5, available_quantity: 5 });
    book2 = await createTestBook({ quantity: 3, available_quantity: 3 });
  });

  describe('POST /api/transactions/issue', () => {
    it('should issue a book successfully', async () => {
      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('issued');
      expect(response.body.data).toHaveProperty('due_date');
    });

    it('should reject issue by non-librarian', async () => {
      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(member1Token))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject issue when book is unavailable', async () => {
      // Set available quantity to 0
      await request(app)
        .patch(`/api/books/${book1.id}/quantity`)
        .set(createAuthHeaders(librarianToken))
        .send({ available_quantity: 0 });

      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/transactions/:id/return', () => {
    it('should return a book successfully', async () => {
      // First issue a book
      const issueResponse = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        });

      const transactionId = issueResponse.body.data.id;

      // Then return it
      const response = await request(app)
        .post(`/api/transactions/${transactionId}/return`)
        .set(createAuthHeaders(librarianToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('returned');
      expect(response.body.data).toHaveProperty('return_date');
    });

    it('should reject return of already returned book', async () => {
      const transaction = await createTestTransaction(member1.member.id, book1.id, {
        status: 'returned',
        return_date: new Date().toISOString().split('T')[0],
      });

      const response = await request(app)
        .post(`/api/transactions/${transaction.id}/return`)
        .set(createAuthHeaders(librarianToken))
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transactions/overdue', () => {
    it('should get overdue transactions', async () => {
      // Create overdue transaction
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);
      await createTestTransaction(member1.member.id, book1.id, {
        due_date: dueDate.toISOString().split('T')[0],
        status: 'overdue',
      });

      const response = await request(app)
        .get('/api/transactions/overdue')
        .set(createAuthHeaders(librarianToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
    });
  });
});

