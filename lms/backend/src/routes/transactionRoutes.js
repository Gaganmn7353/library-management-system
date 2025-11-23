import express from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { validateTransaction, validateQuery } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All transaction routes require authentication
router.use(authenticate);

// Get all transactions (librarians and admins only)
router.get(
  '/',
  isLibrarian,
  validateQuery.pagination,
  validateRequest,
  transactionController.getAllTransactions
);

// Get overdue transactions (librarians and admins only)
router.get(
  '/overdue',
  isLibrarian,
  validateQuery.pagination,
  validateRequest,
  transactionController.getOverdueTransactions
);

// Get member transactions (member can view their own, librarian/admin can view any)
router.get(
  '/member/:memberId',
  validateTransaction.memberId,
  validateQuery.pagination,
  validateRequest,
  transactionController.getMemberTransactions
);

// Get transaction by ID
router.get(
  '/:id',
  validateTransaction.id,
  validateRequest,
  transactionController.getTransactionById
);

// Issue a book (librarians and admins only)
router.post(
  '/issue',
  isLibrarian,
  validateTransaction.create,
  validateRequest,
  transactionController.issueBook
);

// Return a book (librarians and admins only)
// Route order matters: specific routes before parameterized routes
router.post(
  '/return/:id',
  isLibrarian,
  validateTransaction.id,
  validateRequest,
  transactionController.returnBook
);

// Calculate fine for a transaction (librarians and admins only)
router.patch(
  '/:id/calculate-fine',
  isLibrarian,
  validateTransaction.id,
  validateRequest,
  transactionController.calculateFine
);

// Update transaction (librarians and admins only)
router.put(
  '/:id',
  isLibrarian,
  validateTransaction.id,
  validateTransaction.update,
  validateRequest,
  transactionController.updateTransaction
);

export default router;

