import express from 'express';
import { bookController } from '../controllers/bookController.js';
import { validateBook, validateQuery } from '../utils/validators.js';
import { authenticate, isLibrarian, isAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// Public routes (no authentication required)
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

router.get(
  '/:id',
  validateBook.id,
  validateRequest,
  bookController.getById
);

// Protected routes - Librarian/Admin only
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

