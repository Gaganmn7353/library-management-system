import app from './src/app.js';
import config from './src/config/env.js';
import logger from './src/utils/logger.js';

const PORT = config.port;

// Create logs directory if it doesn't exist (for Winston)
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

// Start server - listen on all interfaces (0.0.0.0) for better connectivity
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
  logger.info(`🌐 Network: http://0.0.0.0:${PORT}/api`);
  logger.info(`✅ Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use. Please change PORT in .env or stop the other process.`);
    process.exit(1);
  } else {
    logger.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

export default server;
