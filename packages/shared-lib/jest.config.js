const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'shared-lib',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts']
};