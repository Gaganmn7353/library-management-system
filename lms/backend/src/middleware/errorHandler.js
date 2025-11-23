import logger from '../utils/logger.js';
import { HTTP_STATUS, MESSAGES } from '../config/constants.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, isOperational = true, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors; // For validation errors array
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Convert error to AppError
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Handle duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.detail?.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, HTTP_STATUS.CONFLICT);
};

/**
 * Handle validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', HTTP_STATUS.UNAUTHORIZED);

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  const response = {
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  };
  
  if (err.errors) {
    response.errors = err.errors;
  }
  
  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response = {
      success: false,
      message: err.message,
    };
    
    // Include validation errors if present
    if (err.errors) {
      response.errors = err.errors;
    }
    
    res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ERROR.SERVER_ERROR,
    });
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // PostgreSQL error codes
    if (err.code === '23505') error = handleDuplicateFieldsDB(err);
    if (err.code === '23503') {
      error = new AppError('Referenced resource does not exist', HTTP_STATUS.BAD_REQUEST);
    }
    if (err.code === '23502') {
      error = new AppError('Required field is missing', HTTP_STATUS.BAD_REQUEST);
    }
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    HTTP_STATUS.NOT_FOUND
  );
  next(err);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

