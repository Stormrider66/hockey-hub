#!/bin/bash

# Script to set up Jest configuration for all services

SERVICES=(
  "user-service"
  "calendar-service"
  "training-service"
  "medical-service"
  "planning-service"
  "statistics-service"
  "payment-service"
  "admin-service"
  "communication-service"
)

for SERVICE in "${SERVICES[@]}"; do
  echo "Setting up Jest for $SERVICE..."
  
  SERVICE_DIR="/mnt/c/Hockey Hub/services/$SERVICE"
  
  # Create jest.config.js
  cat > "$SERVICE_DIR/jest.config.js" << 'EOF'
const baseConfig = require('../../packages/shared-lib/jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: 'SERVICE_NAME',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
EOF
  
  # Replace SERVICE_NAME with actual service name
  sed -i "s/SERVICE_NAME/$SERVICE/" "$SERVICE_DIR/jest.config.js"
  
  # Create jest.setup.ts
  cat > "$SERVICE_DIR/jest.setup.ts" << 'EOF'
// Jest setup file for SERVICE_NAME
import 'reflect-metadata';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
EOF
  
  # Replace SERVICE_NAME with actual service name
  sed -i "s/SERVICE_NAME/$SERVICE/" "$SERVICE_DIR/jest.setup.ts"
  
  # Update package.json to add test scripts if not present
  if ! grep -q '"test":' "$SERVICE_DIR/package.json"; then
    # Add test scripts to package.json
    node -e "
      const fs = require('fs');
      const path = require('path');
      const packagePath = path.join('$SERVICE_DIR', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!pkg.scripts.test) {
        pkg.scripts.test = 'jest';
        pkg.scripts['test:watch'] = 'jest --watch';
        pkg.scripts['test:coverage'] = 'jest --coverage';
        pkg.scripts['test:ci'] = 'jest --ci --coverage --maxWorkers=2';
      }
      
      if (!pkg.devDependencies) {
        pkg.devDependencies = {};
      }
      
      if (!pkg.devDependencies['@types/jest']) {
        pkg.devDependencies['@types/jest'] = '^29.5.12';
        pkg.devDependencies['jest'] = '^29.7.0';
        pkg.devDependencies['ts-jest'] = '^29.1.2';
      }
      
      fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    "
  fi
  
  echo "✓ Jest setup complete for $SERVICE"
done

echo "All services have been configured with Jest!"