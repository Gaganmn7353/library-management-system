import express from 'express';
import { finePaymentController } from '../controllers/finePaymentController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { validateFinePayment, validateQuery } from '../utils/validators.js';

const router = express.Router();

// All fine payment routes require authentication
router.use(authenticate);

// Get all fine payments (librarians and admins only)
router.get(
  '/',
  isLibrarian,
  validateQuery.pagination,
  finePaymentController.getAllFinePayments
);

// Get payment summary (librarians and admins only)
router.get(
  '/summary',
  isLibrarian,
  finePaymentController.getPaymentSummary
);

// Get fine payment by ID
router.get(
  '/:id',
  isLibrarian,
  validateFinePayment.id,
  finePaymentController.getFinePaymentById
);

// Get payments for a transaction
router.get(
  '/transaction/:transaction_id',
  isLibrarian,
  finePaymentController.getTransactionPayments
);

// Create fine payment (librarians and admins only)
router.post(
  '/',
  isLibrarian,
  validateFinePayment.create,
  finePaymentController.createFinePayment
);

export default router;

