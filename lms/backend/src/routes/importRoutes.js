import express from 'express';
import { importController } from '../controllers/importController.js';
import { authenticate, isLibrarian } from '../middleware/auth.js';
import { upload, handleUploadError, checkFileUpload } from '../middleware/upload.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ImportResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             success:
 *               type: integer
 *             failed:
 *               type: integer
 *             skipped:
 *               type: integer
 *             updated:
 *               type: integer
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   row:
 *                     type: integer
 *                   data:
 *                     type: object
 *                   errors:
 *                     type: array
 *                     items:
 *                       type: string
 */

/**
 * @swagger
 * /import/books/template:
 *   get:
 *     summary: Download Excel template for book import (Librarian/Admin only)
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel template file download
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
  '/books/template',
  authenticate,
  isLibrarian,
  importController.downloadBookTemplate
);

/**
 * @swagger
 * /import/books:
 *   post:
 *     summary: Import books from Excel file (Librarian/Admin only)
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Excel file (.xlsx or .xls) with book data
 *       - in: formData
 *         name: duplicateAction
 *         type: string
 *         enum: [skip, update]
 *         default: skip
 *         description: Action to take for duplicate ISBNs (skip or update)
 *     responses:
 *       200:
 *         description: Import completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResponse'
 *       400:
 *         description: Validation error or import failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian/Admin access required
 *       500:
 *         description: Internal server error
 */
router.post(
  '/books',
  authenticate,
  isLibrarian,
  upload.single('file'),
  handleUploadError,
  checkFileUpload,
  importController.importBooks
);

export default router;

