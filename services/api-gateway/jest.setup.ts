// Jest setup file for API Gateway
import 'reflect-metadata';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';