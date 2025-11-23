import express from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { validateQuery } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All dashboard routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Get overall statistics
router.get(
  '/stats',
  validateRequest,
  dashboardController.getStats
);

// Get popular books
router.get(
  '/popular-books',
  validateQuery.filters,
  validateRequest,
  dashboardController.getPopularBooks
);

// Get active members
router.get(
  '/active-members',
  validateQuery.filters,
  validateRequest,
  dashboardController.getActiveMembers
);

// Get revenue statistics
router.get(
  '/revenue',
  validateQuery.filters,
  validateRequest,
  dashboardController.getRevenue
);

// Get popular categories
router.get(
  '/popular-categories',
  validateQuery.filters,
  validateRequest,
  dashboardController.getPopularCategories
);

export default router;

