import express from 'express';
import { reportsController } from '../controllers/reportsController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { validateQuery } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All reports routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Get circulation report
router.get(
  '/circulation',
  validateQuery.filters,
  validateRequest,
  reportsController.getCirculationReport
);

// Get overdue report
router.get(
  '/overdue',
  validateRequest,
  reportsController.getOverdueReport
);

// Get inventory report
router.get(
  '/inventory',
  validateQuery.filters,
  validateRequest,
  reportsController.getInventoryReport
);

// Get membership report
router.get(
  '/members',
  validateQuery.filters,
  validateRequest,
  reportsController.getMembershipReport
);

export default router;

