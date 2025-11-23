import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../../helpers/testDatabase.js';
import { createTestUser, generateTestToken } from '../../helpers/mockData.js';
import { createAuthHeaders } from '../../helpers/testHelpers.js';

describe('Auth Middleware', () => {
  let testUser, testToken;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestDatabase();
    testUser = await createTestUser({ role: 'member' });
    testToken = await generateTestToken(testUser);
  });

  describe('authenticate middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeaders(testToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeaders('invalid-token'))
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('authorize middleware', () => {
    it('should allow admin to access admin routes', async () => {
      const adminUser = await createTestUser({ role: 'admin' });
      const adminToken = await generateTestToken(adminUser);

      // Test with a route that requires admin (e.g., delete book)
      const book = await createTestBook();
      const response = await request(app)
        .delete(`/api/books/${book.id}`)
        .set(createAuthHeaders(adminToken));

      // Should not return 403
      expect(response.status).not.toBe(403);
    });

    it('should reject member from accessing admin routes', async () => {
      const book = await createTestBook();
      const response = await request(app)
        .delete(`/api/books/${book.id}`)
        .set(createAuthHeaders(testToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

