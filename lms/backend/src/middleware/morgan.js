import morgan from 'morgan';
import logger from '../utils/logger.js';

// Create a custom morgan token for request ID (if you implement request IDs)
morgan.token('request-id', (req) => req.id || '-');

// Create a stream object with a 'write' function that will be used by `morgan`
const stream = {
  write: (message) => {
    // Use Winston logger here
    logger.http(message.trim());
  },
};

// Skip logging for health checks in production
const skip = (req, res) => {
  return process.env.NODE_ENV === 'production' && req.url === '/api/health';
};

// Build the morgan middleware
const morganMiddleware = morgan(
  // Define message format string (this is the default one).
  // The message format is made from tokens, and each token is
  // defined inside the Morgan library.
  // You can create custom tokens to show what do you want from a request.
  ':method :url :status :res[content-length] - :response-time ms',
  // Options: in this case, I overwrote the stream and the skip logic.
  // See the methods above.
  { stream, skip }
);

export default morganMiddleware;

