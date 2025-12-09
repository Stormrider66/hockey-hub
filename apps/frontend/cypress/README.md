# Hockey Hub E2E Testing with Cypress

## Overview
This directory contains end-to-end tests for the Hockey Hub application using Cypress. The tests cover critical user journeys across all user roles.

## Test Structure

```
cypress/
├── e2e/                    # E2E test specs
│   ├── auth/              # Authentication tests
│   ├── player/            # Player-specific tests
│   ├── coach/             # Coach-specific tests
│   ├── parent/            # Parent-specific tests
│   ├── medical/           # Medical staff tests
│   └── smoke/             # Critical flow tests
├── fixtures/              # Test data
├── page-objects/          # Page object models
├── support/               # Commands and utilities
└── tsconfig.json         # TypeScript config
```

## Setup

1. Install dependencies:
   ```bash
   cd apps/frontend
   pnpm install
   ```

2. Start backend services:
   ```bash
   # From project root
   docker-compose up -d
   ```

3. Start frontend:
   ```bash
   cd apps/frontend
   npm run dev
   ```

## Running Tests

### Interactive Mode (Test Runner)
```bash
npm run cypress:open
# or
./cypress-run.sh open
```

### Headless Mode (CI)
```bash
npm run cypress:run
# or
./cypress-run.sh run
```

### Run Specific Tests
```bash
# Run only authentication tests
npx cypress run --spec "cypress/e2e/auth/**/*.cy.ts"

# Run smoke tests
npx cypress run --spec "cypress/e2e/smoke/**/*.cy.ts"
```

## Test Coverage

### Authentication & Registration
- User registration with validation
- Login for all user roles
- Password reset flow
- Session management
- Token expiration handling

### Player Dashboard
- Wellness data submission
- Schedule viewing
- Training completion
- Performance metrics
- Mobile responsiveness

### Coach Dashboard
- Training session creation
- Recurring sessions
- Session management (edit/cancel)
- Attendance tracking
- Team roster management

### Parent Dashboard
- Multiple children support
- Schedule viewing and RSVP
- Medical information access
- Payment management
- Communication with coaches

### Medical Staff Dashboard
- Injury registration and tracking
- Treatment scheduling
- Return-to-play protocols
- Medical report generation
- Alert management

## Page Objects

Page objects provide a clean abstraction for interacting with pages:

```typescript
// Example usage
const loginPage = new LoginPage();
loginPage.visit();
loginPage.login(email, password);
loginPage.assertLoginSuccess();
```

## Custom Commands

Available custom Cypress commands:

- `cy.login(email, password)` - Login with session caching
- `cy.logout()` - Clear session and logout
- `cy.seedTestData(fixture)` - Seed test data
- `cy.cleanupTestData()` - Clean up after tests
- `cy.checkToast(message, type)` - Verify toast notifications
- `cy.selectDate(date)` - Select date in calendar
- `cy.mockApiResponse(method, url, response)` - Mock API responses

## Writing New Tests

1. Create a new test file in the appropriate directory
2. Use page objects for better maintainability
3. Mock API responses for isolated testing
4. Test both desktop and mobile viewports
5. Include negative test cases

Example test structure:
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup and login
    cy.login(testUsers.player.email, testUsers.player.password);
    
    // Mock API responses
    cy.mockApiResponse('GET', '**/api/endpoint', mockData);
  });
  
  it('should perform action successfully', () => {
    // Test implementation
  });
  
  it('should handle errors gracefully', () => {
    // Error case testing
  });
});
```

## Best Practices

1. **Use Page Objects**: Keep selectors and page interactions in page objects
2. **Mock External Dependencies**: Use cy.intercept() to mock API calls
3. **Test Real User Flows**: Focus on complete user journeys, not individual components
4. **Handle Async Operations**: Use proper waiting strategies (cy.wait, cy.should)
5. **Clean Up After Tests**: Use beforeEach/afterEach hooks for setup/teardown
6. **Test Different Viewports**: Ensure tests work on mobile and desktop
7. **Use Meaningful Assertions**: Check visible UI changes and data updates

## CI/CD Integration

For CI/CD pipelines, use the headless mode:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm run test:e2e
  env:
    CYPRESS_baseUrl: ${{ secrets.CYPRESS_BASE_URL }}
```

## Debugging

1. **Screenshots**: Automatically captured on failure in `cypress/screenshots/`
2. **Videos**: Enable in cypress.config.ts for debugging
3. **Console Logs**: Use `cy.log()` for debugging information
4. **Pause Execution**: Use `cy.pause()` to debug interactively
5. **Time Travel**: Use Cypress Test Runner to step through commands

## Environment Variables

Configure in cypress.config.ts or via environment:
- `CYPRESS_baseUrl`: Frontend URL (default: http://localhost:3010)
- `CYPRESS_apiUrl`: API Gateway URL (default: http://localhost:3000)

## Troubleshooting

### Tests Failing Locally
1. Ensure all services are running
2. Check console for errors
3. Verify API mocks are correct
4. Clear browser storage between tests

### Flaky Tests
1. Add explicit waits for async operations
2. Use cy.intercept() aliases with cy.wait()
3. Ensure proper test isolation
4. Check for race conditions

### Performance Issues
1. Mock heavy API calls
2. Use cy.session() for login caching
3. Parallelize tests in CI
4. Optimize selectors