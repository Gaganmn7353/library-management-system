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

describe('Fine Controller', () => {
  let librarianUser, librarianToken;
  let member1, member1Token;
  let book1;
  let transaction;

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

    // Create overdue transaction with fine
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 5);
    transaction = await createTestTransaction(member1.member.id, book1.id, {
      due_date: dueDate.toISOString().split('T')[0],
      status: 'overdue',
      fine_amount: 25.0,
    });
  });

  describe('GET /api/fines/member/:memberId', () => {
    it('should get member fines', async () => {
      const response = await request(app)
        .get(`/api/fines/member/${member1.member.id}`)
        .set(createAuthHeaders(member1Token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pending_fine');
      expect(response.body.data).toHaveProperty('transactions');
    });
  });

  describe('POST /api/fines/pay', () => {
    it('should process fine payment', async () => {
      const response = await request(app)
        .post('/api/fines/pay')
        .set(createAuthHeaders(member1Token))
        .send({
          transaction_id: transaction.id,
          amount: 25.0,
          payment_method: 'cash',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toHaveProperty('id');
      expect(response.body.data.payment.amount).toBe(25.0);
    });

    it('should reject payment exceeding fine amount', async () => {
      const response = await request(app)
        .post('/api/fines/pay')
        .set(createAuthHeaders(member1Token))
        .send({
          transaction_id: transaction.id,
          amount: 100.0,
          payment_method: 'cash',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/fines/history/:memberId', () => {
    it('should get fine payment history', async () => {
      // First make a payment
      await request(app)
        .post('/api/fines/pay')
        .set(createAuthHeaders(member1Token))
        .send({
          transaction_id: transaction.id,
          amount: 10.0,
          payment_method: 'cash',
        });

      const response = await request(app)
        .get(`/api/fines/history/${member1.member.id}`)
        .set(createAuthHeaders(member1Token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });
  });
});

