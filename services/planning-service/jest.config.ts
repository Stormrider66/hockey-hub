import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",
  // The root directory that Jest should scan for tests and modules within
  rootDir: '.',
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    "<rootDir>/tests"
  ],
  // The test matching patterns
  testMatch: [
    "**/tests/**/*.test.ts"
  ],
  // Module file extensions for importing modules
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Setup files after the test environment has been set up
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'], // If needed later
  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$': [
        'ts-jest',
        {
          // ts-jest configuration options
          tsconfig: 'tsconfig.json' // Point to your tsconfig
        }
    ]
  },
  // Ignore node_modules except for specific ES modules if needed
  // transformIgnorePatterns: [
  //   '/node_modules/',
  //   '\\.pnp\\.[^\\\]+$'
  // ],
  // Module name mapper (if using path aliases in tsconfig)
  moduleNameMapper: {
    '^@hockey-hub/types$': '<rootDir>/tests/__mocks__/typesMock.js',
    '^typeorm$': '<rootDir>/../../node_modules/typeorm',
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
    '^winston$': '<rootDir>/tests/__mocks__/winstonMock',
  },
};

export default config; 