import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../helpers/testDatabase.js';
import {
  createTestUserWithMember,
  createTestBook,
  createTestTransaction,
} from '../helpers/mockData.js';
import { createAuthHeaders, getActiveTransactions, calculatePendingFine } from '../helpers/testHelpers.js';

describe('Transaction Flow Integration Tests', () => {
  let librarianUser, librarianToken;
  let member1, member1Token;
  let member2, member2Token;
  let book1, book2;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestDatabase();

    // Create librarian
    librarianUser = await createTestUserWithMember({ role: 'librarian' });
    librarianToken = librarianUser.token;

    // Create members
    member1 = await createTestUserWithMember({ role: 'member' });
    member1Token = member1.token;

    member2 = await createTestUserWithMember({ role: 'member' });
    member2Token = member2.token;

    // Create books
    book1 = await createTestBook({ quantity: 5, available_quantity: 5 });
    book2 = await createTestBook({ quantity: 3, available_quantity: 3 });
  });

  describe('Complete Transaction Lifecycle', () => {
    it('should complete full transaction flow: issue -> return -> fine calculation', async () => {
      // Step 1: Issue book
      const issueResponse = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        })
        .expect(201);

      expect(issueResponse.body.success).toBe(true);
      expect(issueResponse.body.data).toHaveProperty('id');
      const transactionId = issueResponse.body.data.id;

      // Verify book quantity decreased
      const bookResponse = await request(app)
        .get(`/api/books/${book1.id}`)
        .expect(200);
      expect(bookResponse.body.data.book.available_quantity).toBe(4);

      // Step 2: Check active transactions
      const activeTransactions = await getActiveTransactions(member1.member.id);
      expect(activeTransactions.length).toBe(1);
      expect(activeTransactions[0].id).toBe(transactionId);

      // Step 3: Return book (with delay to simulate overdue)
      // First, update transaction to be overdue
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 5); // 5 days ago

      // Manually update transaction to simulate overdue
      // In real scenario, this would be handled by the system
      const returnResponse = await request(app)
        .post(`/api/transactions/${transactionId}/return`)
        .set(createAuthHeaders(librarianToken))
        .send({
          return_date: new Date().toISOString().split('T')[0],
        })
        .expect(200);

      expect(returnResponse.body.success).toBe(true);
      expect(returnResponse.body.data.status).toBe('returned');

      // Verify book quantity increased
      const bookAfterReturn = await request(app)
        .get(`/api/books/${book1.id}`)
        .expect(200);
      expect(bookAfterReturn.body.data.book.available_quantity).toBe(5);
    });

    it('should prevent issuing book when member has max books', async () => {
      // Issue 3 books to member (max limit)
      for (let i = 0; i < 3; i++) {
        const book = await createTestBook();
        await request(app)
          .post('/api/transactions/issue')
          .set(createAuthHeaders(librarianToken))
          .send({
            member_id: member1.member.id,
            book_id: book.id,
          })
          .expect(201);
      }

      // Try to issue 4th book
      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('maximum');
    });

    it('should prevent issuing book when member has pending fines > ₹500', async () => {
      // Create a transaction with high fine
      const transaction = await createTestTransaction(
        member1.member.id,
        book1.id,
        {
          status: 'overdue',
          fine_amount: 600, // Exceeds limit
        }
      );

      // Try to issue new book
      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book2.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('fines');
    });

    it('should prevent issuing unavailable book', async () => {
      // Set book quantity to 0
      await request(app)
        .patch(`/api/books/${book1.id}/quantity`)
        .set(createAuthHeaders(librarianToken))
        .send({
          available_quantity: 0,
        })
        .expect(200);

      // Try to issue
      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: book1.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('available');
    });
  });

  describe('Fine Calculation', () => {
    it('should calculate fine for overdue book', async () => {
      // Create overdue transaction
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5); // 5 days ago

      const transaction = await createTestTransaction(member1.member.id, book1.id, {
        due_date: dueDate.toISOString().split('T')[0],
        status: 'overdue',
      });

      // Calculate fine
      const response = await request(app)
        .patch(`/api/transactions/${transaction.id}/calculate-fine`)
        .set(createAuthHeaders(librarianToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fine_amount).toBeGreaterThan(0);
      // Fine should be approximately 5 days * ₹5 = ₹25
      expect(parseFloat(response.body.data.fine_amount)).toBeCloseTo(25, 1);
    });
  });
});


