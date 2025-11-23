import express from 'express';
import { reservationController } from '../controllers/reservationController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { validateReservation, validateQuery } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

// All reservation routes require authentication
router.use(authenticate);

// Get all reservations (librarians and admins only)
router.get(
  '/',
  isLibrarian,
  validateQuery.pagination,
  validateRequest,
  reservationController.getAllReservations
);

// Get member's reservations (member can view their own)
router.get(
  '/member/:memberId',
  validateReservation.memberId,
  validateQuery.pagination,
  validateRequest,
  reservationController.getMemberReservations
);

// Get reservation by ID
router.get(
  '/:id',
  validateReservation.id,
  validateRequest,
  reservationController.getReservationById
);

// Create reservation (members can create their own)
router.post(
  '/',
  validateReservation.create,
  validateRequest,
  reservationController.createReservation
);

// Fulfill reservation (librarians and admins only)
router.patch(
  '/:id/fulfill',
  isLibrarian,
  validateReservation.id,
  validateRequest,
  reservationController.fulfillReservation
);

// Cancel reservation (members can cancel their own, librarians can cancel any)
router.delete(
  '/:id',
  validateReservation.id,
  validateRequest,
  reservationController.cancelReservation
);

export default router;

