const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'calendar-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Avoid picking up compiled mocks in dist
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@hockey-hub/shared-lib/middleware/authMiddleware$': '<rootDir>/../../packages/shared-lib/src/middleware/auth.middleware.ts',
    '^@hockey-hub/shared-lib/middleware/errorHandler$': '<rootDir>/../../packages/shared-lib/src/errors/ErrorHandler.ts',
    '^@hockey-hub/shared-lib/testing/(.*)$': '<rootDir>/../../packages/shared-lib/src/testing/$1',
    '^@hockey-hub/shared-lib$': '<rootDir>/jest.shared-lib-shim.ts'
  }
};
