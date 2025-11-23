import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * General rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false, // Count successful requests too
  skipFailedRequests: false, // Count failed requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.',
    });
  },
});

/**
 * Strict rate limiter for registration
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
      success: false,
      message: 'Too many registration attempts, please try again after 1 hour.',
    });
  },
});

/**
 * Rate limiter for password reset (if implemented)
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for refresh token endpoint
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 refresh token requests per 15 minutes
  message: {
    success: false,
    message: 'Too many token refresh attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

