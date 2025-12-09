module.exports = {
  displayName: 'training-service-e2e',
  rootDir: '.',
  testMatch: ['<rootDir>/src/__tests__/e2e/**/*.test.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { diagnostics: false }]
  },
  moduleNameMapper: {
    '^@hockey-hub/shared-lib/middleware/authMiddleware$': '<rootDir>/../../packages/shared-lib/src/middleware/auth.middleware.ts',
    '^@hockey-hub/shared-lib/middleware/errorHandler$': '<rootDir>/../../packages/shared-lib/src/errors/ErrorHandler.ts',
    '^@hockey-hub/shared-lib/middleware$': '<rootDir>/../../packages/shared-lib/src/middleware/index.ts',
    '^@hockey-hub/shared-lib$': '<rootDir>/../../packages/shared-lib/src/index.ts'
  }
};


