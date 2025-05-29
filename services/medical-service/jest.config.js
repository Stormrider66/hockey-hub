module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': ['ts-jest', { diagnostics: false }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@aws-sdk)/)'
  ],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
  },
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,js}'],
}; 