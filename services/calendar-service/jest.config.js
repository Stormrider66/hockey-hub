const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'calendar-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
