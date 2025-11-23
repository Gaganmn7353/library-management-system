import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../helpers/testDatabase.js';
import {
  createTestUserWithMember,
  createTestBook,
  createTestTransaction,
} from '../helpers/mockData.js';
import { createAuthHeaders, calculatePendingFine } from '../helpers/testHelpers.js';

describe('Fine Calculation Integration Tests', () => {
  let librarianUser, librarianToken;
  let member1, member1Token;
  let book1;

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

    book1 = await createTestBook();
  });

  describe('Fine Calculation and Payment', () => {
    it('should calculate fine correctly for overdue book', async () => {
      // Create transaction with due date 5 days ago
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5);

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
      // Fine should be approximately 5 days * ₹5 = ₹25
      expect(parseFloat(response.body.data.fine_amount)).toBeCloseTo(25, 1);
    });

    it('should process partial fine payment', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10);

      const transaction = await createTestTransaction(member1.member.id, book1.id, {
        due_date: dueDate.toISOString().split('T')[0],
        status: 'overdue',
        fine_amount: 50.0,
      });

      // Pay partial amount
      const paymentResponse = await request(app)
        .post('/api/fines/pay')
        .set(createAuthHeaders(member1Token))
        .send({
          transaction_id: transaction.id,
          amount: 30.0,
          payment_method: 'cash',
        })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // Check remaining fine
      const finesResponse = await request(app)
        .get(`/api/fines/member/${member1.member.id}`)
        .set(createAuthHeaders(member1Token))
        .expect(200);

      // Pending fine should be approximately ₹20
      expect(parseFloat(finesResponse.body.data.pending_fine)).toBeCloseTo(20, 1);
    });

    it('should prevent book issue when pending fine exceeds limit', async () => {
      // Create transaction with high fine
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 120); // 120 days overdue = ₹600

      await createTestTransaction(member1.member.id, book1.id, {
        due_date: dueDate.toISOString().split('T')[0],
        status: 'overdue',
        fine_amount: 600.0,
      });

      // Try to issue new book
      const newBook = await createTestBook();
      const response = await request(app)
        .post('/api/transactions/issue')
        .set(createAuthHeaders(librarianToken))
        .send({
          member_id: member1.member.id,
          book_id: newBook.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('fines');
    });
  });
});

