const baseConfig = require('../../packages/shared-lib/jest.config.base');

const ignoreE2E = process.env.RUN_PLANNING_E2E === 'true' ? [] : ['<rootDir>/src/__tests__/e2e/'];

module.exports = {
  ...baseConfig,
  displayName: 'planning-service',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.e2e.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testPathIgnorePatterns: [
    ...baseConfig.testPathIgnorePatterns || [],
    ...ignoreE2E,
  ],
  moduleNameMapper: {
    // Map 'dist/*' imports explicitly to source first so they win over generic mappings
    '^@hockey-hub/shared-lib/dist/utils/Logger$': '<rootDir>/../../packages/shared-lib/src/utils/Logger.ts',
    '^@hockey-hub/shared-lib/dist/types/pagination$': '<rootDir>/../../packages/shared-lib/src/types/pagination.ts',
    '^@hockey-hub/shared-lib/dist/(.*)$': '<rootDir>/../../packages/shared-lib/src/$1',
    // Base mappings
    '^@hockey-hub/shared-lib$': '<rootDir>/../../packages/shared-lib/src',
    '^@hockey-hub/shared-lib/middleware$': '<rootDir>/../../packages/shared-lib/src/middleware/index.ts',
    '^@hockey-hub/shared-lib/middleware/(.*)$': '<rootDir>/../../packages/shared-lib/src/middleware/$1'
  }
};
