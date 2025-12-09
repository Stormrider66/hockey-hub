const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'frontend',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/optimizations/',
    '<rootDir>/src/__tests__/integration/',
    '<rootDir>/.next/',
    '.*\\.e2e\\.test\\.(t|j)sx?$',
  ],
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
    '<rootDir>/app/**/*.test.{ts,tsx}',
    '<rootDir>/app/**/*.spec.{ts,tsx}',
  ],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',

    // Handle module aliases
    '^@/i18n$': '<rootDir>/src/lib/i18n-client.ts',
    '^@/test-utils$': '<rootDir>/src/testing/test-utils.tsx',
    '^@/testing/test-utils$': '<rootDir>/src/testing/test-utils.tsx',
    '^@/testing/mocks/(.*)$': '<rootDir>/src/testing/mocks/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/contexts/ChatSocketContext$': '<rootDir>/src/contexts/MockChatSocketContext.tsx',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/utils/dynamicImports$': '<rootDir>/src/testing/mocks/dynamicImports.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/ui/select$': '<rootDir>/src/testing/mocks/select.tsx',
    '^\.\/select$': '<rootDir>/src/testing/mocks/select.tsx',
    '^@hockey-hub/shared-lib/middleware(?:/.*)?$': '<rootDir>/src/testing/mocks/shared-lib-middleware.ts',
    '^@hockey-hub/shared-lib$': '<rootDir>/src/testing/mocks/shared-lib-index.ts',
    '^@hockey-hub/shared-lib/(.*)$': '<rootDir>/src/testing/mocks/shared-lib-index.ts',
    '^msw/node$': '<rootDir>/src/testing/mocks/msw-node.ts',
    '^msw(?:/.*)?$': '<rootDir>/src/testing/mocks/msw.ts',
    '^@mswjs/interceptors(.*)$': '<rootDir>/src/testing/mocks/mswjs-interceptors.ts',
    '^react-router-dom$': '<rootDir>/src/testing/mocks/react-router-dom.tsx',
    '^vitest$': '<rootDir>/src/testing/mocks/vitest.ts',
    '^jose$': '<rootDir>/src/testing/mocks/jose.ts',
    // '^next/navigation$': '<rootDir>/src/testing/mocks/next-navigation.ts', // Removed - causing issues in dev mode
    '^@hockey-hub/translations$': '<rootDir>/src/testing/mocks/translations.ts',
    '^@hockey-hub/translations(?:/.*)?$': '<rootDir>/src/testing/mocks/translations.ts',
    '^packages/translations(?:/.*)?$': '<rootDir>/src/testing/mocks/translations.ts'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/test/**',
    '!app/**/layout.tsx',
    '!app/**/page.tsx',
    '!app/**/providers.tsx',
    '!app/**/loading.tsx',
    '!app/**/error.tsx',
    '!app/**/not-found.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['json', 'lcov', 'text', 'text-summary', 'html'],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);