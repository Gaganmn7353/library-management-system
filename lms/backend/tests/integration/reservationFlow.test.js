import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../helpers/testDatabase.js';
import {
  createTestUserWithMember,
  createTestBook,
  createTestReservation,
} from '../helpers/mockData.js';
import { createAuthHeaders } from '../helpers/testHelpers.js';

describe('Reservation Flow Integration Tests', () => {
  let librarianUser, librarianToken;
  let member1, member1Token;
  let member2, member2Token;
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

    member2 = await createTestUserWithMember({ role: 'member' });
    member2Token = member2.token;

    book1 = await createTestBook({ quantity: 0, available_quantity: 0 });
  });

  describe('Complete Reservation Lifecycle', () => {
    it('should handle reservation queue correctly', async () => {
      // Member 1 reserves
      const reservation1 = await request(app)
        .post('/api/reservations')
        .set(createAuthHeaders(member1Token))
        .send({ book_id: book1.id })
        .expect(201);

      // Member 2 reserves
      const reservation2 = await request(app)
        .post('/api/reservations')
        .set(createAuthHeaders(member2Token))
        .send({ book_id: book1.id })
        .expect(201);

      // Check queue positions
      const member1Reservations = await request(app)
        .get(`/api/reservations/member/${member1.member.id}`)
        .set(createAuthHeaders(member1Token))
        .expect(200);

      expect(member1Reservations.body.data.reservations[0].queue_position).toBe(1);

      const member2Reservations = await request(app)
        .get(`/api/reservations/member/${member2.member.id}`)
        .set(createAuthHeaders(member2Token))
        .expect(200);

      expect(member2Reservations.body.data.reservations[0].queue_position).toBe(2);

      // Make book available
      await request(app)
        .patch(`/api/books/${book1.id}/quantity`)
        .set(createAuthHeaders(librarianToken))
        .send({ available_quantity: 1 });

      // Fulfill first reservation
      await request(app)
        .patch(`/api/reservations/${reservation1.body.data.reservation.id}/fulfill`)
        .set(createAuthHeaders(librarianToken))
        .expect(200);

      // Check that second reservation moved to position 1
      const updatedReservations = await request(app)
        .get(`/api/reservations/member/${member2.member.id}`)
        .set(createAuthHeaders(member2Token))
        .expect(200);

      expect(updatedReservations.body.data.reservations[0].queue_position).toBe(1);
    });

    it('should cancel reservation successfully', async () => {
      const reservation = await request(app)
        .post('/api/reservations')
        .set(createAuthHeaders(member1Token))
        .send({ book_id: book1.id })
        .expect(201);

      const cancelResponse = await request(app)
        .delete(`/api/reservations/${reservation.body.data.reservation.id}`)
        .set(createAuthHeaders(member1Token))
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
    });
  });
});

