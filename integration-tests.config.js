/**
 * Integration Test Configuration
 * 
 * This file provides configuration and helper scripts for running integration tests
 * across all services in the Hockey Hub application.
 */

module.exports = {
  // Test database configuration
  databases: {
    user: {
      port: 5433,
      name: 'user_service_test',
    },
    calendar: {
      port: 5435,
      name: 'calendar_service_test',
    },
    training: {
      port: 5436,
      name: 'training_service_test',
    },
    medical: {
      port: 5437,
      name: 'medical_service_test',
    },
    communication: {
      port: 5434,
      name: 'communication_service_test',
    },
    planning: {
      port: 5438,
      name: 'planning_service_test',
    },
    statistics: {
      port: 5439,
      name: 'statistics_service_test',
    },
    payment: {
      port: 5440,
      name: 'payment_service_test',
    },
    admin: {
      port: 5441,
      name: 'admin_service_test',
    },
  },

  // Service ports for integration testing
  services: {
    'api-gateway': 3000,
    'user-service': 3001,
    'communication-service': 3002,
    'calendar-service': 3003,
    'training-service': 3004,
    'medical-service': 3005,
    'planning-service': 3006,
    'statistics-service': 3007,
    'payment-service': 3008,
    'admin-service': 3009,
  },

  // JWT configuration for tests
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h',
  },

  // Test timeouts
  timeouts: {
    setup: 30000, // 30 seconds for database setup
    test: 10000, // 10 seconds per test
    teardown: 10000, // 10 seconds for cleanup
  },

  // Integration test patterns
  testPatterns: {
    integration: '**/*.integration.test.ts',
    e2e: '**/*.e2e.test.ts',
  },

  // Environment variables for testing
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    DB_HOST: 'localhost',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  },
};