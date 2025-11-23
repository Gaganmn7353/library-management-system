import { jest } from '@jest/globals';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock logger to avoid console noise during tests
jest.mock('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Suppress console errors during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

