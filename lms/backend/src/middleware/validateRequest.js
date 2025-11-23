import { validationResult } from 'express-validator';
import { HTTP_STATUS } from '../config/constants.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to validate request using express-validator
 * Should be used after validation rules
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value,
    }));

    throw new AppError(
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      true, // isOperational
      errorMessages
    );
  }
  
  next();
};

/**
 * Sanitize request body to prevent XSS attacks
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      sanitized[key] = sanitizeObject(value);
    }
  }
  return sanitized;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate request ID parameter
 */
export const validateId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !/^\d+$/.test(id)) {
    throw new AppError('Invalid ID parameter', HTTP_STATUS.BAD_REQUEST);
  }
  
  req.params.id = parseInt(id, 10);
  next();
};

