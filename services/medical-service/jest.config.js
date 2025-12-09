const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'medical-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Specific mappings first
    '^@hockey-hub/shared-lib/dto$': '<rootDir>/jest.dto-shim.js',
    '^@hockey-hub/shared-lib/src/dto/training.dto$': '<rootDir>/jest.training-stub.js',
    '^@hockey-hub/shared-lib/dist/dto/training.dto.js$': '<rootDir>/jest.training-stub.js',
    '^@hockey-hub/shared-lib$': '<rootDir>/jest.shared-lib-shim.ts',
    '^@hockey-hub/shared-lib/middleware/authMiddleware$': '<rootDir>/jest.shared-lib-shim.js',
    '^@hockey-hub/shared-lib/middleware/errorHandler$': '<rootDir>/../../packages/shared-lib/src/errors/ErrorHandler.ts',
    '^@hockey-hub/shared-lib/middleware$': '<rootDir>/../../packages/shared-lib/src/middleware/index.ts',
    '^@hockey-hub/shared-lib/middleware/(.*)$': '<rootDir>/../../packages/shared-lib/src/middleware/$1',
    ...(baseConfig.moduleNameMapper || {}),
    '^@hockey-hub/shared-lib/(.*)$': '<rootDir>/../../packages/shared-lib/src/$1',
    // Fallback
  }
};
