import { userModel } from '../models/userModel.js';
import { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyToken, verifyRefreshToken } from '../utils/helpers.js';
import { formatSuccess } from '../utils/helpers.js';
import { tokenBlacklist } from '../utils/tokenBlacklist.js';
import config from '../config/env.js';
import { HTTP_STATUS, MESSAGES, USER_ROLES } from '../config/constants.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

export const authController = {
  /**
   * Register a new user
   */
  register: asyncHandler(async (req, res) => {
    const { username, email, password, role = USER_ROLES.MEMBER } = req.body;

    // Validate role - only allow member role for self-registration
    // Admin and librarian roles should only be assigned by existing admins
    const allowedRole = role === USER_ROLES.ADMIN || role === USER_ROLES.LIBRARIAN 
      ? USER_ROLES.MEMBER 
      : role;

    // Check if username already exists
    const existingUserByUsername = await userModel.findByUsername(username);
    if (existingUserByUsername) {
      throw new AppError('Username already exists', HTTP_STATUS.CONFLICT);
    }

    // Check if email already exists
    const existingUserByEmail = await userModel.findByEmail(email);
    if (existingUserByEmail) {
      throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    // Hash password with bcrypt (10 rounds)
    const password_hash = await hashPassword(password);

    // Create user
    const user = await userModel.create({
      username,
      email,
      password_hash,
      role: allowedRole,
    });

    // Generate tokens
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    logger.info(`New user registered: ${username} (${user.role}) - ID: ${user.id}`);

    res.status(HTTP_STATUS.CREATED).json(
      formatSuccess(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          token,
          refreshToken,
          expiresIn: config.jwt.expiresIn || '1h',
        },
        MESSAGES.SUCCESS.CREATED
      )
    );
  }),

  /**
   * Login user (supports username or email)
   */
  login: asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    // Support both username and email for login
    const identifier = username || email;
    
    if (!identifier || !password) {
      throw new AppError('Username/email and password are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Find user by username or email
    const user = await userModel.findByUsernameOrEmail(identifier);
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      logger.warn(`Failed login attempt for: ${identifier}`);
      throw new AppError(MESSAGES.ERROR.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      logger.warn(`Failed login attempt for user: ${user.username}`);
      throw new AppError(MESSAGES.ERROR.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate tokens with expiry information
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    // Get token expiry for blacklist (if needed)
    const decoded = jwt.decode(token);
    const tokenExpiry = decoded?.exp || Math.floor(Date.now() / 1000) + 3600; // Default 1 hour

    logger.info(`User logged in: ${user.username} (ID: ${user.id}, Role: ${user.role})`);

    res.json(
      formatSuccess(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          token,
          refreshToken,
          expiresIn: config.jwt.expiresIn || '1h',
        },
        MESSAGES.SUCCESS.LOGIN
      )
    );
  }),

  /**
   * Get current user profile
   */
  getProfile: asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      throw new AppError(MESSAGES.ERROR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = user;

    res.json(formatSuccess({ user: userWithoutPassword }, MESSAGES.SUCCESS.RETRIEVED));
  }),

  /**
   * Logout user (blacklist token)
   */
  logout: asyncHandler(async (req, res) => {
    const token = req.token || req.body.token;
    
    if (!token) {
      throw new AppError('Token is required', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      // Decode token to get expiry time
      const decoded = jwt.decode(token);
      
      if (decoded && decoded.exp) {
        // Add token to blacklist with its expiry time
        tokenBlacklist.add(token, decoded.exp);
        logger.info(`User logged out: ${req.user?.username || 'Unknown'} (Token blacklisted)`);
      } else {
        // If we can't decode, still blacklist it for safety
        // Use default expiry of 1 hour from now
        const defaultExpiry = Math.floor(Date.now() / 1000) + 3600;
        tokenBlacklist.add(token, defaultExpiry);
        logger.warn(`Token blacklisted without expiry info`);
      }

      res.json(formatSuccess(null, MESSAGES.SUCCESS.LOGOUT));
    } catch (error) {
      logger.error('Error during logout:', error);
      throw new AppError('Logout failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }),

  /**
   * Refresh access token
   */
  refreshToken: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Check if user still exists
      const user = await userModel.findById(decoded.id);
      if (!user) {
        throw new AppError(MESSAGES.ERROR.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }

      // Generate new access token
      const tokenPayload = { id: user.id, username: user.username, role: user.role };
      const newToken = generateToken(tokenPayload);

      logger.info(`Token refreshed for user: ${user.username}`);

      res.json(
        formatSuccess(
          {
            token: newToken,
            expiresIn: config.jwt.expiresIn || '1h',
          },
          'Token refreshed successfully'
        )
      );
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
      }
      logger.error('Token refresh error:', error);
      throw new AppError('Token refresh failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }),
};

