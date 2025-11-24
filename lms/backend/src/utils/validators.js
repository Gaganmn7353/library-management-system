import { body, param, query, validationResult } from 'express-validator';
import { USER_ROLES, MEMBER_STATUS, TRANSACTION_STATUS, RESERVATION_STATUS, PAYMENT_METHODS } from '../config/constants.js';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  next();
};

// User validation rules
export const validateUser = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .custom((value) => {
        if (value.toLowerCase().includes('admin') || value.toLowerCase().includes('librarian')) {
          throw new Error('Username cannot contain restricted words');
        }
        return true;
      }),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email must be less than 255 characters'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/^(?=.*[A-Z])/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/^(?=.*\d)/)
      .withMessage('Password must contain at least one number')
      .matches(/^(?=.*[@$!%*?&#])/)
      .withMessage('Password must contain at least one special character (@$!%*?&#)')
      .custom((value) => {
        // Check for common weak passwords
        const weakPasswords = ['password', '12345678', 'qwerty', 'abc123'];
        if (weakPasswords.includes(value.toLowerCase())) {
          throw new Error('Password is too weak. Please choose a stronger password');
        }
        // Check for repeated characters
        if (/(.)\1{3,}/.test(value)) {
          throw new Error('Password contains too many repeated characters');
        }
        return true;
      }),
    body('role')
      .optional()
      .isIn(Object.values(USER_ROLES))
      .withMessage(`Role must be one of: ${Object.values(USER_ROLES).join(', ')}`),
    handleValidationErrors,
  ],
  login: [
    body('username')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Username cannot be empty if provided'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1 })
      .withMessage('Password cannot be empty'),
    body()
      .custom((value) => {
        if (!value.username && !value.email) {
          throw new Error('Either username or email is required');
        }
        return true;
      }),
    handleValidationErrors,
  ],
  update: [
    body('email').optional().isEmail().withMessage('Please provide a valid email address'),
    body('role').optional().isIn(Object.values(USER_ROLES)).withMessage('Invalid role'),
    handleValidationErrors,
  ],
};

// Book validation rules
export const validateBook = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
    body('author').trim().notEmpty().withMessage('Author is required').isLength({ max: 255 }).withMessage('Author must be less than 255 characters'),
    body('isbn').trim().notEmpty().withMessage('ISBN is required').isLength({ max: 20 }).withMessage('ISBN must be less than 20 characters'),
    body('publisher').optional().trim().isLength({ max: 255 }).withMessage('Publisher must be less than 255 characters'),
    body('publication_year')
      .optional()
      .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid publication year'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer')
      .toInt(),
    body('available_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Available quantity must be a non-negative integer')
      .toInt(),
    body('description').optional().trim(),
    body('cover_image_url')
      .optional()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Cover image URL must be a valid HTTP/HTTPS URL'),
    handleValidationErrors,
  ],
  update: [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty').isLength({ max: 255 }).withMessage('Author must be less than 255 characters'),
    body('isbn').optional().trim().isLength({ max: 20 }).withMessage('ISBN must be less than 20 characters'),
    body('publisher').optional().trim().isLength({ max: 255 }).withMessage('Publisher must be less than 255 characters'),
    body('publication_year')
      .optional()
      .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid publication year')
      .toInt(),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Quantity must be a non-negative integer')
      .toInt(),
    body('available_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Available quantity must be a non-negative integer')
      .toInt(),
    body('description').optional().trim(),
    body('cover_image_url')
      .optional()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Cover image URL must be a valid HTTP/HTTPS URL'),
    handleValidationErrors,
  ],
  updateQuantity: [
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity is required and must be a non-negative integer')
      .toInt(),
    body('available_quantity')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Available quantity must be a non-negative integer')
      .toInt(),
    handleValidationErrors,
  ],
  id: [
    param('id').isInt({ min: 1 }).withMessage('Invalid book ID').toInt(),
    handleValidationErrors,
  ],
  category: [
    param('category').trim().notEmpty().withMessage('Category is required'),
    handleValidationErrors,
  ],
};

// Member validation rules
export const validateMember = {
  create: [
    body('user_id').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer').toInt(),
    body('member_id').optional().trim().isLength({ max: 50 }).withMessage('Member ID must be less than 50 characters'),
    body('name').optional().trim().isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
    body('email')
      .if((value, { req }) => !req.body.user_id)
      .notEmpty()
      .withMessage('Email is required when user_id is not provided')
      .bail()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim(),
    body('member_type').optional().trim().isLength({ max: 30 }),
    body('membership_date').optional().isISO8601().withMessage('Invalid membership date'),
    body('membership_expiry').optional().isISO8601().withMessage('Invalid membership expiry date'),
    body('status').optional().isIn(Object.values(MEMBER_STATUS)).withMessage('Invalid status'),
    handleValidationErrors,
  ],
  update: [
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim(),
    body('member_type').optional().trim().isLength({ max: 30 }),
    body('membership_expiry').optional().isISO8601().withMessage('Invalid membership expiry date'),
    body('status').optional().isIn(Object.values(MEMBER_STATUS)).withMessage('Invalid status'),
    handleValidationErrors,
  ],
  id: [
    param('id').isInt({ min: 1 }).withMessage('Invalid member ID'),
    handleValidationErrors,
  ],
};

// Transaction validation rules
export const validateTransaction = {
  create: [
    body('member_id')
      .isInt({ min: 1 })
      .withMessage('Member ID is required and must be a positive integer')
      .toInt(),
    body('book_id')
      .isInt({ min: 1 })
      .withMessage('Book ID is required and must be a positive integer')
      .toInt(),
    body('issue_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid issue date format. Use ISO 8601 format (YYYY-MM-DD)'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid due date format. Use ISO 8601 format (YYYY-MM-DD)'),
    body('status')
      .optional()
      .isIn(Object.values(TRANSACTION_STATUS))
      .withMessage(`Status must be one of: ${Object.values(TRANSACTION_STATUS).join(', ')}`),
    handleValidationErrors,
  ],
  update: [
    body('return_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid return date format. Use ISO 8601 format (YYYY-MM-DD)'),
    body('fine_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Fine amount must be a non-negative number')
      .toFloat(),
    body('status')
      .optional()
      .isIn(Object.values(TRANSACTION_STATUS))
      .withMessage(`Status must be one of: ${Object.values(TRANSACTION_STATUS).join(', ')}`),
    handleValidationErrors,
  ],
  id: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid transaction ID')
      .toInt(),
    handleValidationErrors,
  ],
  memberId: [
    param('memberId')
      .isInt({ min: 1 })
      .withMessage('Invalid member ID')
      .toInt(),
    handleValidationErrors,
  ],
};

// Reservation validation rules
export const validateReservation = {
  create: [
    body('member_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer (optional for members)')
      .toInt(),
    body('book_id')
      .isInt({ min: 1 })
      .withMessage('Book ID is required and must be a positive integer')
      .toInt(),
    body('status')
      .optional()
      .isIn(Object.values(RESERVATION_STATUS))
      .withMessage(`Status must be one of: ${Object.values(RESERVATION_STATUS).join(', ')}`),
    handleValidationErrors,
  ],
  update: [
    body('status')
      .isIn(Object.values(RESERVATION_STATUS))
      .withMessage(`Status must be one of: ${Object.values(RESERVATION_STATUS).join(', ')}`),
    handleValidationErrors,
  ],
  id: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid reservation ID')
      .toInt(),
    handleValidationErrors,
  ],
  memberId: [
    param('memberId')
      .isInt({ min: 1 })
      .withMessage('Invalid member ID')
      .toInt(),
    handleValidationErrors,
  ],
};

// Fine payment validation rules
export const validateFinePayment = {
  create: [
    body('transaction_id')
      .isInt({ min: 1 })
      .withMessage('Transaction ID is required and must be a positive integer')
      .toInt(),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0')
      .toFloat(),
    body('payment_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid payment date format. Use ISO 8601 format'),
    body('payment_method')
      .isIn(Object.values(PAYMENT_METHODS))
      .withMessage(`Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),
    handleValidationErrors,
  ],
  pay: [
    body('transaction_id')
      .isInt({ min: 1 })
      .withMessage('Transaction ID is required and must be a positive integer')
      .toInt(),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0')
      .toFloat(),
    body('payment_method')
      .isIn(Object.values(PAYMENT_METHODS))
      .withMessage(`Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),
    body('payment_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid payment date format. Use ISO 8601 format'),
    body('member_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer')
      .toInt(),
    handleValidationErrors,
  ],
  id: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid payment ID')
      .toInt(),
    handleValidationErrors,
  ],
  paymentId: [
    param('paymentId')
      .isInt({ min: 1 })
      .withMessage('Invalid payment ID')
      .toInt(),
    handleValidationErrors,
  ],
  memberId: [
    param('memberId')
      .isInt({ min: 1 })
      .withMessage('Invalid member ID')
      .toInt(),
    handleValidationErrors,
  ],
};

// Query parameter validation
export const validateQuery = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    handleValidationErrors,
  ],
  search: [
    query('q').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Search query must be between 1 and 255 characters'),
    query('search').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Search query must be between 1 and 255 characters'),
    handleValidationErrors,
  ],
  sorting: [
    query('sortBy')
      .optional()
      .isIn(['title', 'author', 'publication_year', 'created_at', 'category'])
      .withMessage('SortBy must be one of: title, author, publication_year, created_at, category'),
    query('sortOrder')
      .optional()
      .isIn(['ASC', 'DESC', 'asc', 'desc'])
      .withMessage('SortOrder must be ASC or DESC'),
    handleValidationErrors,
  ],
  filters: [
    query('category').optional().trim().isLength({ max: 100 }),
    query('author').optional().trim().isLength({ max: 255 }),
    query('publisher').optional().trim().isLength({ max: 255 }),
    query('available')
      .optional()
      .isIn(['true', 'false', '1', '0'])
      .withMessage('Available must be true or false'),
    query('publication_year_from')
      .optional()
      .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid publication year')
      .toInt(),
    query('publication_year_to')
      .optional()
      .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
      .withMessage('Invalid publication year')
      .toInt(),
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)'),
    query('start_date')
      .optional()
      .custom((value, { req }) => {
        if (req.query.end_date && value && new Date(value) > new Date(req.query.end_date)) {
          throw new Error('Start date must be before or equal to end date');
        }
        return true;
      }),
    query('group_by')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Group by must be day, week, or month'),
    query('status')
      .optional()
      .trim()
      .isLength({ max: 50 }),
    query('low_stock')
      .optional()
      .isIn(['true', 'false', '1', '0'])
      .withMessage('Low stock must be true or false'),
    query('export_csv')
      .optional()
      .isIn(['true', 'false', '1', '0'])
      .withMessage('Export CSV must be true or false'),
    query('member_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer')
      .toInt(),
    query('book_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Book ID must be a positive integer')
      .toInt(),
    handleValidationErrors,
  ],
};

