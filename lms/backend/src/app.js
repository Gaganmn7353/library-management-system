import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import config from './config/env.js';
import morganMiddleware from './middleware/morgan.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { xssProtection, checkRequestSize } from './middleware/security.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import finePaymentRoutes from './routes/finePaymentRoutes.js';
import fineRoutes from './routes/fineRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// XSS protection
app.use(xssProtection);

// Request size limit check
app.use(checkRequestSize);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting (applied to all routes)
app.use('/api', generalLimiter);

// Logging middleware
app.use(morganMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Library Management System API Documentation',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/fine-payments', finePaymentRoutes); // Legacy route for admin access
app.use('/api/fines', fineRoutes); // New route for member and admin access
app.use('/api/dashboard', dashboardRoutes); // Admin dashboard statistics
app.use('/api/reports', reportsRoutes); // Admin reports

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  try {
    const { closePool } = await import('./config/database.js');
    await closePool();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;

