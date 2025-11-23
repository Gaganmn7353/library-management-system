import express from 'express';
import { fineController } from '../controllers/fineController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { validateFinePayment, validateQuery } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All fine routes require authentication
router.use(authenticate);

// Get member's fines (member can view their own)
router.get(
  '/member/:memberId',
  validateFinePayment.memberId,
  validateRequest,
  fineController.getMemberFines
);

// Get member's fine payment history
router.get(
  '/history/:memberId',
  validateFinePayment.memberId,
  validateQuery.pagination,
  validateRequest,
  fineController.getFineHistory
);

// Pay fine (member can pay their own fines)
router.post(
  '/pay',
  validateFinePayment.pay,
  validateRequest,
  fineController.payFine
);

// Get fine payment receipt (member can view their own)
router.get(
  '/receipt/:paymentId',
  validateFinePayment.paymentId,
  validateRequest,
  fineController.getReceipt
);

// Admin/Librarian routes
router.get(
  '/',
  isLibrarian,
  validateQuery.pagination,
  validateRequest,
  fineController.getAllFinePayments
);

router.get(
  '/summary',
  isLibrarian,
  validateRequest,
  fineController.getPaymentSummary
);

export default router;

