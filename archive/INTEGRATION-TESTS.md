# Hockey Hub Integration Tests

This document describes the integration testing infrastructure for the Hockey Hub application.

## Overview

Integration tests verify that different components of the system work correctly together, including:
- API Gateway routing and authentication
- Service-to-service communication
- Database operations
- End-to-end workflows

## Test Structure

### Test Files Created

1. **API Gateway Authentication Flow** (`services/api-gateway/src/__tests__/integration/auth-flow.integration.test.ts`)
   - User registration and login through the gateway
   - JWT token validation
   - Rate limiting enforcement
   - Service-to-service communication
   - Error handling and security features

2. **User Service Authentication** (`services/user-service/src/__tests__/integration/user-auth.integration.test.ts`)
   - User registration with validation
   - Login with password verification
   - Token refresh flow
   - Account lockout after failed attempts
   - Password reset flow
   - Email verification

3. **Medical Service Injury Management** (`services/medical-service/src/__tests__/integration/injury.integration.test.ts`)
   - Injury report creation and management
   - Role-based access control
   - Treatment tracking
   - Player availability updates
   - Statistical reporting

4. **Training Service Sessions** (`services/training-service/src/__tests__/integration/session.integration.test.ts`)
   - Training session creation and scheduling
   - Participant management
   - Performance metric tracking
   - Session attendance and check-in
   - Conflict detection

5. **Calendar Service Events** (`services/calendar-service/src/__tests__/integration/event.integration.test.ts`)
   - Event creation with resource booking
   - RSVP functionality
   - Recurring events
   - Conflict detection
   - Event approval workflow

## Running Integration Tests

### Prerequisites

1. **Test Databases**: Each service needs a test database configured
2. **Environment Variables**: Set up `.env.test` files for each service
3. **Dependencies**: Install all npm packages

### Setup Test Databases

```bash
# Create all test databases
./scripts/setup-test-db.sh

# Or manually for specific service
createdb -U postgres -h localhost -p 5433 user_service_test
createdb -U postgres -h localhost -p 5435 calendar_service_test
createdb -U postgres -h localhost -p 5436 training_service_test
createdb -U postgres -h localhost -p 5437 medical_service_test
```

### Running Tests

#### All Integration Tests
```bash
# Run all integration tests with database setup
./scripts/run-integration-tests.sh --all --setup-db

# Run all without database setup
./scripts/run-integration-tests.sh --all
```

#### Specific Service Tests
```bash
# Run tests for a specific service
./scripts/run-integration-tests.sh --service user-service

# Run with database setup
./scripts/run-integration-tests.sh --service medical-service --setup-db
```

#### Manual Test Execution
```bash
# Navigate to service directory
cd services/user-service

# Run integration tests
npm test -- --testPathPattern="integration" --runInBand

# Run with coverage
npm test -- --testPathPattern="integration" --coverage --runInBand
```

## Test Configuration

### JWT Configuration
Tests use a shared JWT secret (`test-secret`) for consistency. In production, each service should have its own secret.

### Test Users
Common test users are created with specific roles and permissions:
- **Medical Staff**: Full access to medical features
- **Coach**: Team management and event creation
- **Player**: Limited to own data and team events
- **Parent**: Access to children's data
- **Physical Trainer**: Training session management
- **Club Admin**: Administrative privileges

### Database Setup
Each test suite uses the `setupTestDatabase` helper which:
- Creates a fresh database connection
- Drops and recreates schema before each test
- Seeds necessary test data
- Cleans up after tests complete

## Writing New Integration Tests

### Test Structure Template
```typescript
import { setupTestDatabase } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';

describe('Service Integration Tests', () => {
  const { getDataSource, getRepository } = setupTestDatabase('service-name', entities);
  
  beforeAll(async () => {
    // Setup Express app
    // Seed test data
  });
  
  describe('Endpoint Tests', () => {
    it('should handle successful request', async () => {
      // Create test user and token
      // Make request
      // Assert response
      // Verify database state
    });
  });
});
```

### Best Practices

1. **Test Isolation**: Each test should be independent
2. **Database State**: Always verify database changes
3. **Error Cases**: Test both success and failure scenarios
4. **Authentication**: Test with different user roles
5. **Validation**: Verify input validation works correctly
6. **Clean Up**: Ensure proper cleanup after tests

## Common Issues and Solutions

### Port Conflicts
If you get port binding errors:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Errors
- Ensure PostgreSQL is running
- Check database credentials in `.env.test`
- Verify test databases exist

### Test Timeouts
Increase timeout in Jest configuration:
```javascript
jest.setTimeout(30000); // 30 seconds
```

## Continuous Integration

### GitHub Actions Configuration
```yaml
- name: Setup Test Databases
  run: ./scripts/setup-test-db.sh

- name: Run Integration Tests
  run: ./scripts/run-integration-tests.sh --all
  env:
    NODE_ENV: test
    JWT_SECRET: test-secret
```

## Coverage Goals

- **API Gateway**: 90% coverage for authentication flows
- **User Service**: 85% coverage for auth endpoints
- **Medical Service**: 80% coverage for CRUD operations
- **Training Service**: 80% coverage for session management
- **Calendar Service**: 80% coverage for event handling

## Future Enhancements

1. **E2E Tests**: Add Cypress for full user journey testing
2. **Load Testing**: Add performance tests with k6 or Artillery
3. **Contract Testing**: Add Pact for service contract verification
4. **Chaos Testing**: Test system resilience
5. **Security Testing**: Add OWASP ZAP integration