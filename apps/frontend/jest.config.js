module.exports = {
  setupFiles: ['<rootDir>/jest.localstorage.js'],
  preset: 'ts-jest',
  testEnvironment: '<rootDir>/jest.environment.js',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/components/ui/(.*)$': ['<rootDir>/src/components/ui/$1', '<rootDir>/components/ui/$1'],
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react$': '<rootDir>/node_modules/lucide-react',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
}; 