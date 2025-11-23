import express from 'express';
import { exportController } from '../controllers/exportController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { validateQuery } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ExportFilters:
 *       type: object
 *       properties:
 *         start_date:
 *           type: string
 *           format: date
 *           example: "2023-01-01"
 *         end_date:
 *           type: string
 *           format: date
 *           example: "2023-12-31"
 *         status:
 *           type: string
 *           enum: [issued, returned, overdue, active, inactive, available, unavailable]
 *         category:
 *           type: string
 *         search:
 *           type: string
 *         member_id:
 *           type: integer
 *         book_id:
 *           type: integer
 */

/**
 * @swagger
 * /export/books:
 *   get:
 *     summary: Export all books to Excel (Librarian/Admin only)
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, unavailable]
 *         description: Filter by availability status
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian/Admin access required
 */
router.get(
  '/books',
  authenticate,
  isLibrarian,
  validateQuery.filters,
  validateRequest,
  exportController.exportBooks
);

/**
 * @swagger
 * /export/members:
 *   get:
 *     summary: Export all members to Excel (Librarian/Admin only)
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by member status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian/Admin access required
 */
router.get(
  '/members',
  authenticate,
  isLibrarian,
  validateQuery.filters,
  validateRequest,
  exportController.exportMembers
);

/**
 * @swagger
 * /export/transactions:
 *   get:
 *     summary: Export transaction history to Excel (Librarian/Admin only)
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [issued, returned, overdue]
 *         description: Filter by transaction status
 *       - in: query
 *         name: member_id
 *         schema:
 *           type: integer
 *         description: Filter by member ID
 *       - in: query
 *         name: book_id
 *         schema:
 *           type: integer
 *         description: Filter by book ID
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian/Admin access required
 */
router.get(
  '/transactions',
  authenticate,
  isLibrarian,
  validateQuery.filters,
  validateRequest,
  exportController.exportTransactions
);

/**
 * @swagger
 * /export/all:
 *   get:
 *     summary: Export complete database to Excel with multiple sheets (Librarian/Admin only)
 *     tags: [Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter for transactions
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter for transactions
 *     responses:
 *       200:
 *         description: Excel file download with multiple sheets
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian/Admin access required
 */
router.get(
  '/all',
  authenticate,
  isLibrarian,
  validateQuery.filters,
  validateRequest,
  exportController.exportAll
);

export default router;

