const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'training-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@hockey-hub/shared-lib/middleware/authMiddleware$': '<rootDir>/../../packages/shared-lib/src/middleware/auth.middleware.ts',
    '^@hockey-hub/shared-lib/middleware/errorHandler$': '<rootDir>/../../packages/shared-lib/src/errors/ErrorHandler.ts',
    '^@hockey-hub/shared-lib$': '<rootDir>/jest.shared-lib-shim.ts',
    '^@hockey-hub/shared-lib/middleware$': '<rootDir>/../../packages/shared-lib/src/middleware/index.ts',
    '^@hockey-hub/shared-lib/middleware/(.*)$': '<rootDir>/../../packages/shared-lib/src/middleware/$1',
    '^express-validator$': '<rootDir>/jest.express-validator-shim.ts'
  }
};
