import express from 'express';
import { memberController } from '../controllers/memberController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { validateMember, validateQuery } from '../utils/validators.js';

const router = express.Router();

// All member routes require authentication
router.use(authenticate);

// Get all members (librarians and admins only)
router.get(
  '/',
  isLibrarian,
  validateQuery.pagination,
  validateQuery.search,
  validateQuery.filters,
  validateRequest,
  memberController.getAllMembers
);

// Get member by ID
router.get(
  '/:id',
  validateMember.id,
  validateRequest,
  memberController.getMemberById
);

// Create member (librarians and admins only)
router.post(
  '/',
  isLibrarian,
  validateMember.create,
  validateRequest,
  memberController.createMember
);

// Update member (librarians and admins only)
router.put(
  '/:id',
  isLibrarian,
  validateMember.id,
  validateMember.update,
  validateRequest,
  memberController.updateMember
);

// Delete member (librarians and admins only)
router.delete(
  '/:id',
  isLibrarian,
  validateMember.id,
  validateRequest,
  memberController.deleteMember
);

// Get member's transactions
router.get(
  '/:id/transactions',
  validateMember.id,
  validateQuery.pagination,
  validateRequest,
  memberController.getMemberTransactions
);

// Get member's reservations
router.get(
  '/:id/reservations',
  validateMember.id,
  validateRequest,
  memberController.getMemberReservations
);

export default router;

