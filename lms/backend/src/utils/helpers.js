import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { DEFAULT_LOAN_PERIOD, LOAN_PERIOD_DAYS } from '../config/constants.js';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.bcrypt.saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 * @param {object} payload - Token payload (user ID, role, etc.)
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Generate JWT refresh token
 * @param {object} payload - Token payload
 * @returns {string} - Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} - Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Calculate due date based on loan period
 * @param {string} memberType - Type of member (student, faculty, etc.)
 * @param {Date} issueDate - Issue date (defaults to today)
 * @returns {Date} - Due date
 */
export const calculateDueDate = (memberType = 'member', issueDate = new Date()) => {
  const days = DEFAULT_LOAN_PERIOD[memberType.toUpperCase()] || LOAN_PERIOD_DAYS || DEFAULT_LOAN_PERIOD.MEMBER;
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
};

/**
 * Calculate fine amount based on overdue days (₹5 per day)
 * @param {Date} dueDate - Due date
 * @param {Date} returnDate - Return date (defaults to today)
 * @param {number} fineRate - Fine rate per day (defaults to ₹5.00)
 * @returns {number} - Fine amount in INR
 */
export const calculateFine = (dueDate, returnDate = new Date(), fineRate = 5.00) => {
  // Ensure dates are Date objects
  const due = new Date(dueDate);
  const returnDateObj = new Date(returnDate);
  
  // Set to start of day for accurate day calculation
  due.setHours(0, 0, 0, 0);
  returnDateObj.setHours(0, 0, 0, 0);
  
  // If returned on or before due date, no fine
  if (returnDateObj <= due) {
    return 0;
  }
  
  // Calculate days overdue
  const daysOverdue = Math.ceil((returnDateObj - due) / (1000 * 60 * 60 * 24));
  
  // Calculate fine: ₹5 per day
  return daysOverdue * fineRate;
};

/**
 * Calculate days overdue
 * @param {Date} dueDate - Due date
 * @param {Date} currentDate - Current date (defaults to today)
 * @returns {number} - Days overdue (0 if not overdue)
 */
export const calculateDaysOverdue = (dueDate, currentDate = new Date()) => {
  const due = new Date(dueDate);
  const current = new Date(currentDate);
  
  due.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  if (current <= due) {
    return 0;
  }
  
  return Math.ceil((current - due) / (1000 * 60 * 60 * 24));
};

/**
 * Format pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} - Pagination metadata
 */
export const formatPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sanitize user input
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @returns {object} - Formatted error response
 */
export const formatError = (error) => {
  return {
    message: error.message || 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };
};

/**
 * Format success response
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @returns {object} - Formatted success response
 */
export const formatSuccess = (data = null, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Extract pagination parameters from query
 * @param {object} query - Request query object
 * @returns {object} - Page and limit
 */
export const getPaginationParams = (query) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Format SQL WHERE clause for search
 * @param {string} search - Search term
 * @param {string[]} fields - Fields to search in
 * @returns {object} - SQL WHERE clause and values
 */
export const buildSearchQuery = (search, fields) => {
  if (!search || !fields.length) {
    return { where: '', values: [] };
  }
  
  const conditions = fields.map((field, index) => 
    `${field} ILIKE $${index + 1}`
  );
  
  const searchValue = `%${search}%`;
  return {
    where: `(${conditions.join(' OR ')})`,
    values: Array(fields.length).fill(searchValue),
  };
};

