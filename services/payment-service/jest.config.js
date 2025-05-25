module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: ['**/test/**/*.test.ts', '**/src/workers/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@hockey-hub/types$': '<rootDir>/test/__mocks__/hockey-hub-types.ts',
    '^typeorm$': '<rootDir>/../../node_modules/typeorm',
    '^uuid$': '<rootDir>/test/__mocks__/uuid.ts',
    'data-source$': '<rootDir>/test/__mocks__/ormDataSource.ts',
  },
  clearMocks: true,
  verbose: true,
  timers: 'legacy',
}; 