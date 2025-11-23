import express from 'express';
import { authController } from '../controllers/authController.js';
import { validateUser } from '../utils/validators.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, registerLimiter, refreshTokenLimiter } from '../middleware/rateLimiter.js';
import { sqlInjectionCheck, xssProtection } from '../middleware/security.js';

const router = express.Router();

// Apply security middleware to all routes
router.use(xssProtection);
router.use(sqlInjectionCheck);

// Public routes with rate limiting
router.post(
  '/register',
  registerLimiter,
  validateUser.register,
  validateRequest,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateUser.login,
  validateRequest,
  authController.login
);

router.post(
  '/refresh-token',
  refreshTokenLimiter,
  authController.refreshToken
);

// Protected routes
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

export default router;

