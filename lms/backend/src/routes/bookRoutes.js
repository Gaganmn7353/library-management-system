import express from 'express';
import { bookController } from '../controllers/bookController.js';
import { validateBook, validateQuery } from '../utils/validators.js';
import { authenticate, isLibrarian, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BookCreate:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - isbn
 *         - quantity
 *       properties:
 *         title:
 *           type: string
 *           example: The Great Gatsby
 *         author:
 *           type: string
 *           example: F. Scott Fitzgerald
 *         isbn:
 *           type: string
 *           example: 978-0-7432-7356-5
 *         publisher:
 *           type: string
 *           example: Scribner
 *         publication_year:
 *           type: integer
 *           example: 1925
 *         category:
 *           type: string
 *           example: Fiction
 *         quantity:
 *           type: integer
 *           example: 10
 *         available_quantity:
 *           type: integer
 *           example: 10
 *         description:
 *           type: string
 *           example: A classic American novel
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books with pagination and filters
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, author, publication_year]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     pagination:
 *                       type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  validateQuery.pagination,
  validateQuery.search,
  validateQuery.sorting,
  validateQuery.filters,
  validateRequest,
  bookController.getAll
);

router.get(
  '/search',
  validateQuery.pagination,
  validateQuery.search,
  validateRequest,
  bookController.search
);

router.get(
  '/categories',
  bookController.getCategories
);

router.get(
  '/category/:category',
  validateBook.category,
  validateQuery.pagination,
  validateQuery.sorting,
  validateRequest,
  bookController.getByCategory
);

router.get(
  '/available',
  validateQuery.pagination,
  validateQuery.sorting,
  validateRequest,
  bookController.getAvailable
);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  validateBook.id,
  validateRequest,
  bookController.getById
);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book (Librarian/Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookCreate'
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Librarian/Admin access required
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  isLibrarian,
  validateBook.create,
  validateRequest,
  bookController.create
);

router.put(
  '/:id',
  authenticate,
  isLibrarian,
  validateBook.id,
  validateBook.update,
  validateRequest,
  bookController.update
);

// Protected route - Librarian only (update quantity)
router.patch(
  '/:id/quantity',
  authenticate,
  isLibrarian,
  validateBook.id,
  validateBook.updateQuantity,
  validateRequest,
  bookController.updateQuantity
);

// Protected route - Admin only (delete book)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  validateBook.id,
  validateRequest,
  bookController.delete
);

export default router;

