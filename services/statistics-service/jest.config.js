const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'statistics-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@hockey-hub/shared-lib$': '<rootDir>/node_modules/@hockey-hub/shared-lib/dist',
    '^@hockey-hub/shared-lib/dist/(.*)$': '<rootDir>/node_modules/@hockey-hub/shared-lib/dist/$1',
    '^@hockey-hub/shared-lib/(.*)$': '<rootDir>/node_modules/@hockey-hub/shared-lib/$1'
  }
};
