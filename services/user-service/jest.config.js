module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { diagnostics: false }
    ],
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  moduleNameMapper: {
    '^@hockey-hub/(.*)$': '<rootDir>/../../shared/$1/dist',
    '^typeorm$': '<rootDir>/../../node_modules/typeorm',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/src/workers/**/*.test.ts', '**/src/routes/__tests__/authRoutes.e2e.test.ts'],
}; 