import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../../helpers/testDatabase.js';
import {
  createTestUserWithMember,
  createTestBook,
  createTestReservation,
} from '../../helpers/mockData.js';
import { createAuthHeaders } from '../../helpers/testHelpers.js';

describe('Reservation Controller', () => {
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

    book1 = await createTestBook({ quantity: 0, available_quantity: 0 }); // Unavailable book
  });

  describe('POST /api/reservations', () => {
    it('should create a reservation successfully', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set(createAuthHeaders(member1Token))
        .send({
          book_id: book1.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation).toHaveProperty('id');
      expect(response.body.data.reservation.status).toBe('pending');
    });

    it('should reject reservation for available book', async () => {
      const availableBook = await createTestBook({ quantity: 5, available_quantity: 5 });

      const response = await request(app)
        .post('/api/reservations')
        .set(createAuthHeaders(member1Token))
        .send({
          book_id: availableBook.id,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reservations/member/:memberId', () => {
    it('should get member reservations', async () => {
      await createTestReservation(member1.member.id, book1.id);

      const response = await request(app)
        .get(`/api/reservations/member/${member1.member.id}`)
        .set(createAuthHeaders(member1Token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.reservations)).toBe(true);
    });
  });

  describe('PATCH /api/reservations/:id/fulfill', () => {
    it('should fulfill a reservation', async () => {
      const reservation = await createTestReservation(member1.member.id, book1.id);

      // Make book available
      await request(app)
        .patch(`/api/books/${book1.id}/quantity`)
        .set(createAuthHeaders(librarianToken))
        .send({ available_quantity: 1 });

      const response = await request(app)
        .patch(`/api/reservations/${reservation.id}/fulfill`)
        .set(createAuthHeaders(librarianToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation.status).toBe('fulfilled');
    });
  });
});

