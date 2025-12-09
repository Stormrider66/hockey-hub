const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'communication-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Avoid masking issues locally; enable hard exit only in CI
  forceExit: process.env.CI === 'true',
  detectOpenHandles: process.env.JEST_DETECT_OPEN_HANDLES === 'true',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@hockey-hub/shared-lib/middleware/authMiddleware$': '<rootDir>/../../packages/shared-lib/src/middleware/auth.middleware.ts',
    '^@hockey-hub/shared-lib/middleware/errorHandler$': '<rootDir>/../../packages/shared-lib/src/errors/ErrorHandler.ts',
    '^express-validator$': '<rootDir>/jest.express-validator-shim.ts',
    '^@hockey-hub/shared-lib$': '<rootDir>/jest.shared-lib-shim.ts'
  }
};
