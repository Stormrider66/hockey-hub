// @ts-nocheck
/// <reference types="jest" />
// Jest setup file for planning-service
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
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Ensure EventBus.getInstance exists as a jest.fn when tests auto-mock the module.
// Several planning-service unit tests do: `jest.mock('@hockey-hub/shared-lib/dist/events/EventBus')`
// and then expect to configure `EventBus.getInstance.mockReturnValue(...)`.
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus', () => {
  class EventBus {
    static getInstance = jest.fn();
    publish = jest.fn();
    subscribe = jest.fn();
    on = jest.fn();
    emit = jest.fn();
  }
  return { EventBus };
});