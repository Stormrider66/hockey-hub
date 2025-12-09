const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'user-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper || {}),
    '^@hockey-hub/shared-lib/middleware$': '<rootDir>/../../packages/shared-lib/dist/middleware/index.js',
    '^@hockey-hub/shared-lib/middleware/(.*)$': '<rootDir>/../../packages/shared-lib/dist/middleware/$1',
    '^@hockey-hub/shared-lib/dto$': '<rootDir>/../../packages/shared-lib/dist/dto/index.js',
    // Use source testing helpers so createMockResponse returns jest spies in tests
    '^@hockey-hub/shared-lib/testing/(.*)$': '<rootDir>/../../packages/shared-lib/src/testing/$1',
    '^@hockey-hub/shared-lib/errors/(.*)$': '<rootDir>/../../packages/shared-lib/dist/errors/$1',
    '^\.\./logger$': '<rootDir>/jest.logger-shim.js',
    '^@hockey-hub/shared-lib/(.*)$': '<rootDir>/../../packages/shared-lib/dist/$1',
    '^@hockey-hub/shared-lib$': '<rootDir>/../../packages/shared-lib/dist/index.js'
  }
};
