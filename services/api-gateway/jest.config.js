const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'api-gateway',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    ...(baseConfig.moduleNameMapper || {}),
    '^@hockey-hub/shared-lib/(.*)$': '<rootDir>/../../packages/shared-lib/src/$1',
    '^@hockey-hub/shared-lib$': '<rootDir>/../../packages/shared-lib/src'
  }
};