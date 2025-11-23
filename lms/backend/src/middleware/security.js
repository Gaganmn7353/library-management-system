import { AppError, asyncHandler } from './errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';
import logger from '../utils/logger.js';

/**
 * CSRF Protection Middleware
 * For API-only applications, CSRF protection is typically handled differently
 * This is a basic implementation - for production, consider using csurf package
 */
export const csrfProtection = asyncHandler(async (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check for CSRF token in header
  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  // If using sessions, validate CSRF token
  if (req.session && sessionToken && csrfToken !== sessionToken) {
    logger.warn(`CSRF token mismatch for IP: ${req.ip}`);
    throw new AppError('Invalid CSRF token', HTTP_STATUS.FORBIDDEN);
  }

  next();
});

/**
 * SQL Injection Prevention
 * This is handled at the database level with parameterized queries
 * This middleware adds additional validation for suspicious patterns
 */
export const sqlInjectionCheck = asyncHandler(async (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/i,
  ];

  const checkValue = (value, path = '') => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          logger.warn(`Potential SQL injection attempt detected at ${path}: ${value.substring(0, 50)}`);
          throw new AppError('Invalid input detected', HTTP_STATUS.BAD_REQUEST);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          checkValue(value[key], path ? `${path}.${key}` : key);
        }
      }
    }
  };

  checkValue(req.body, 'body');
  checkValue(req.query, 'query');
  checkValue(req.params, 'params');

  next();
});

/**
 * XSS Protection Headers
 * Helmet already handles most of this, but we add custom headers if needed
 */
export const xssProtection = (req, res, next) => {
  // Additional XSS protection headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

/**
 * Request size limit check
 */
export const checkRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    throw new AppError('Request payload too large', HTTP_STATUS.PAYLOAD_TOO_LARGE || 413);
  }

  next();
};

/**
 * IP whitelist/blacklist (optional)
 */
export const ipFilter = (options = {}) => {
  const { whitelist = [], blacklist = [] } = options;

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      logger.warn(`Blocked request from blacklisted IP: ${clientIp}`);
      throw new AppError('Access denied', HTTP_STATUS.FORBIDDEN);
    }

    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      logger.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);
      throw new AppError('Access denied', HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
};

