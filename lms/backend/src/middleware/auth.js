import { verifyToken } from '../utils/helpers.js';
import { tokenBlacklist } from '../utils/tokenBlacklist.js';
import { USER_ROLES, HTTP_STATUS, MESSAGES } from '../config/constants.js';
import { AppError, asyncHandler } from './errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware - Verify JWT token
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if token is blacklisted
  if (tokenBlacklist.isBlacklisted(token)) {
    logger.warn(`Blacklisted token attempt: ${token.substring(0, 10)}...`);
    throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user info to request
    req.user = decoded;
    req.token = token; // Store token for potential logout
    next();
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    
    throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }
});

/**
 * Authorization middleware - Check user roles
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return asyncHandler((req, res, next) => {
    if (!req.user) {
      throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} (${req.user.role}) attempted to access unauthorized route: ${req.path}`);
      throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  });
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Check if user is librarian or admin
 */
export const isLibrarian = authorize(USER_ROLES.ADMIN, USER_ROLES.LIBRARIAN);

/**
 * Check if user owns the resource or is admin/librarian
 * @param {string} resourceUserIdField - Field name in resource that contains user ID
 */
export const isOwnerOrStaff = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Admin and librarian can access any resource
    if ([USER_ROLES.ADMIN, USER_ROLES.LIBRARIAN].includes(req.user.role)) {
      return next();
    }

    // Members can only access their own resources
    const resourceUserId = req.resource?.[resourceUserIdField] || req.params.userId;
    
    if (req.user.id !== parseInt(resourceUserId)) {
      throw new AppError(MESSAGES.ERROR.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
};

/**
 * Optional authentication - Doesn't throw error if no token
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Ignore token errors for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }
  
  next();
});

