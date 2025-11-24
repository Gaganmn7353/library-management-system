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
import exportRoutes from './routes/exportRoutes.js';
import importRoutes from './routes/importRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow multiple origins for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite default port
      'http://127.0.0.1:5173',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

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
    port: config.port,
    cors: config.cors.origin,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      auth: '/api/auth',
    },
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
app.use('/api/export', exportRoutes); // Excel export endpoints
app.use('/api/import', importRoutes); // Excel import endpoints
app.use('/api/users', userRoutes);

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

