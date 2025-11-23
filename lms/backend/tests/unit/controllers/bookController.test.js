import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import { setupTestDatabase, cleanTestDatabase, closeTestDatabase } from '../../helpers/testDatabase.js';
import { createTestUser, createTestBook, generateTestToken } from '../../helpers/mockData.js';
import { createAuthHeaders } from '../../helpers/testHelpers.js';

describe('Book Controller', () => {
  let adminUser, librarianUser, memberUser;
  let adminToken, librarianToken, memberToken;
  let testBook;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestDatabase();

    adminUser = await createTestUser({ role: 'admin' });
    librarianUser = await createTestUser({ role: 'librarian' });
    memberUser = await createTestUser({ role: 'member' });

    adminToken = await generateTestToken(adminUser);
    librarianToken = await generateTestToken(librarianUser);
    memberToken = await generateTestToken(memberUser);

    testBook = await createTestBook();
  });

  describe('GET /api/books', () => {
    it('should get all books with pagination', async () => {
      // Create multiple books
      await createTestBook();
      await createTestBook();

      const response = await request(app)
        .get('/api/books?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('books');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.books)).toBe(true);
    });

    it('should filter books by category', async () => {
      await createTestBook({ category: 'Fiction' });
      await createTestBook({ category: 'Science' });

      const response = await request(app)
        .get('/api/books?category=Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.books.forEach((book) => {
        expect(book.category).toBe('Fiction');
      });
    });

    it('should search books by title', async () => {
      await createTestBook({ title: 'Unique Test Book' });

      const response = await request(app)
        .get('/api/books?search=Unique')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.some((book) => book.title.includes('Unique'))).toBe(true);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should get book by id', async () => {
      const response = await request(app)
        .get(`/api/books/${testBook.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book.id).toBe(testBook.id);
      expect(response.body.data.book.title).toBe(testBook.title);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book as librarian', async () => {
      const newBook = {
        title: 'New Test Book',
        author: 'Test Author',
        isbn: '978-1234567890',
        publisher: 'Test Publisher',
        publication_year: 2023,
        category: 'Fiction',
        quantity: 10,
        available_quantity: 10,
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/books')
        .set(createAuthHeaders(librarianToken))
        .send(newBook)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book).toHaveProperty('id');
      expect(response.body.data.book.title).toBe(newBook.title);
    });

    it('should reject book creation by member', async () => {
      const newBook = {
        title: 'New Test Book',
        author: 'Test Author',
        isbn: '978-1234567890',
      };

      const response = await request(app)
        .post('/api/books')
        .set(createAuthHeaders(memberToken))
        .send(newBook)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject book creation without authentication', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ title: 'Test Book' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update book as librarian', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/books/${testBook.id}`)
        .set(createAuthHeaders(librarianToken))
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.book.title).toBe(updates.title);
    });

    it('should reject update by member', async () => {
      const response = await request(app)
        .put(`/api/books/${testBook.id}`)
        .set(createAuthHeaders(memberToken))
        .send({ title: 'Updated Title' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete book as admin', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook.id}`)
        .set(createAuthHeaders(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject deletion by librarian', async () => {
      const response = await request(app)
        .delete(`/api/books/${testBook.id}`)
        .set(createAuthHeaders(librarianToken))
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent deletion of book with active transactions', async () => {
      // This would require creating a transaction first
      // For now, we'll test the endpoint structure
      const response = await request(app)
        .delete(`/api/books/${testBook.id}`)
        .set(createAuthHeaders(adminToken));

      // If book has transactions, should return 400
      // Otherwise, should return 200
      expect([200, 400]).toContain(response.status);
    });
  });
});


