# Hockey Hub - Testing Strategy

## Table of Contents

1. [Overview](#overview)
2. [Testing Principles](#testing-principles)
3. [Testing Levels](#testing-levels)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [End-to-End Testing](#end-to-end-testing)
   - [Performance Testing](#performance-testing)
   - [Security Testing](#security-testing)
4. [Test Environments](#test-environments)
5. [Test Data Management](#test-data-management)
6. [Testing Tools & Frameworks](#testing-tools--frameworks)
7. [Mocking Strategy](#mocking-strategy)
8. [Component-Specific Testing](#component-specific-testing)
   - [Frontend Component Testing](#frontend-component-testing)
   - [API Testing](#api-testing)
   - [Database Testing](#database-testing)
   - [Async Process Testing](#async-process-testing)
9. [Accessibility Testing](#accessibility-testing)
10. [Test Automation](#test-automation)
11. [Continuous Integration Testing](#continuous-integration-testing)
12. [Test Coverage Goals](#test-coverage-goals)
13. [Testing Team Structure](#testing-team-structure)
14. [Bug Tracking & Reporting](#bug-tracking--reporting)
15. [Testing Documentation](#testing-documentation)

## Overview

This document outlines the comprehensive testing strategy for the Hockey Hub platform. It defines the approach, tools, frameworks, and processes that will be used to ensure the quality, reliability, and performance of the system. The strategy covers all types of testing from unit to end-to-end, defines roles and responsibilities, and establishes quality metrics and goals.

The Hockey Hub platform uses a microservice architecture with multiple independent services, each requiring different testing approaches. This strategy ensures consistent testing practices across all components while accommodating the specific needs of each service.

## Testing Principles

The Hockey Hub testing approach is guided by the following core principles:

1. **Shift Left**: Testing begins early in the development lifecycle to catch issues before they become costly.
2. **Test Pyramid**: Follow the test pyramid approach with many unit tests, fewer integration tests, and even fewer E2E tests.
3. **Automation First**: Automate tests wherever possible for consistent and repeatable validation.
4. **Isolation**: Tests should be independent and not affect each other.
5. **Data Independence**: Tests should create and manage their own test data.
6. **Quick Feedback**: Fast test execution to provide rapid feedback to developers.
7. **Continuous Testing**: Tests run automatically as part of the CI/CD pipeline.
8. **Coverage-Driven**: Test coverage metrics guide testing efforts.
9. **Behavior-Driven**: Focus on testing behavior rather than implementation details where appropriate.
10. **Accessibility by Design**: Accessibility testing is integrated into the testing process, not added later.

## Testing Levels

### Unit Testing

Unit tests verify the smallest testable parts of the application in isolation.

#### Approach

- Tests focus on individual functions, methods, and classes
- External dependencies are mocked
- Emphasis on code coverage and boundary conditions
- Each unit test should be fast (<100ms) and independent

#### Framework & Tools

- **Backend**: Jest with TypeScript
- **Frontend**: Jest with React Testing Library
- **Coverage**: Istanbul (built into Jest)

#### Implementation Standards

```typescript
// Example unit test for a service function
import { UserService } from '../userService';
import { mockUserRepository } from '../../test/mocks';

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    // Fresh mock for each test
    jest.clearAllMocks();
    userService = new UserService(mockUserRepository);
  });
  
  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockUser = { id: userId, name: 'Test User' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
    
    it('should throw not found error when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockUserRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow('User not found');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });
});
```

### Integration Testing

Integration tests verify that different components work together correctly.

#### Approach

- Focus on testing service boundaries and interactions
- Test APIs, database interactions, and service communications
- Use test containers for dependent services (database, message queue)
- Isolate tests from external systems where possible

#### Framework & Tools

- **API Testing**: Supertest with Jest
- **Database Testing**: TypeORM with test database
- **Message Queue Testing**: In-memory implementation for tests
- **Test Containers**: Docker with Testcontainers library

#### Implementation Standards

```typescript
// Example integration test for an API endpoint
import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, teardownTestDatabase } from '../../test/helpers/database';
import { generateTestToken } from '../../test/helpers/auth';

describe('User API', () => {
  let testDb;
  let authToken;
  
  beforeAll(async () => {
    // Setup test database with Docker container
    testDb = await setupTestDatabase();
    
    // Create test data
    await testDb.runMigrations();
    await testDb.query(`
      INSERT INTO users (id, email, first_name, last_name, password_hash)
      VALUES ('test-user-id', 'test@example.com', 'Test', 'User', '$2b$10$...')
    `);
    
    // Generate auth token for tests
    authToken = generateTestToken({ userId: 'test-user-id', roles: ['player'] });
  });
  
  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });
  
  describe('GET /api/v1/users/:id', () => {
    it('should return user when authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/test-user-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
    });
    
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/test-user-id');
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});
```

### End-to-End Testing

E2E tests validate complete user flows through the entire system.

#### Approach

- Test real user scenarios and workflows
- Use headless browser for frontend tests
- Test against a staging-like environment
- Focus on critical user journeys

#### Framework & Tools

- **Test Framework**: Cypress
- **API Testing**: Cypress API commands
- **Visual Testing**: Cypress Image Snapshot
- **Authentication**: Custom Cypress commands for auth flows

#### Implementation Standards

```typescript
// Example Cypress E2E test
describe('Team Management Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('coach@example.com', 'password123');
  });
  
  it('should allow coach to create a new team', () => {
    // Navigate to teams page
    cy.visit('/teams');
    
    // Click create team button
    cy.findByRole('button', { name: /create team/i }).click();
    
    // Fill team form
    cy.findByLabelText(/team name/i).type('Test Team');
    cy.findByLabelText(/category/i).select('Junior');
    cy.findByLabelText(/season/i).type('2025-2026');
    
    // Submit form
    cy.findByRole('button', { name: /save/i }).click();
    
    // Verify team was created
    cy.url().should('include', '/teams/');
    cy.findByText('Test Team').should('be.visible');
    cy.findByText('Junior').should('be.visible');
    cy.findByText('2025-2026').should('be.visible');
    
    // Verify API called correctly
    cy.wait('@createTeam').then((interception) => {
      expect(interception.request.body).to.deep.include({
        name: 'Test Team',
        category: 'Junior',
        season: '2025-2026'
      });
    });
  });
  
  it('should allow adding members to team', () => {
    // Navigate to team details
    cy.visit('/teams');
    cy.findByText('Test Team').click();
    
    // Add team member
    cy.findByRole('button', { name: /add member/i }).click();
    cy.findByLabelText(/search user/i).type('player');
    cy.findByText('Player One').click();
    cy.findByLabelText(/role/i).select('player');
    cy.findByRole('button', { name: /add/i }).click();
    
    // Verify member added
    cy.findByText('Player One').should('be.visible');
    cy.findByText('player').should('be.visible');
  });
});
```

### Performance Testing

Performance tests evaluate system responsiveness, scalability, and stability under load.

#### Approach

- Load testing of critical endpoints and user flows
- Stress testing to find breaking points
- Endurance testing for stability over time
- Performance profiling to identify bottlenecks

#### Framework & Tools

- **Load Testing**: k6 for HTTP endpoints
- **API Performance**: Artillery for API benchmarking
- **Frontend Performance**: Lighthouse for web performance
- **Monitoring**: Prometheus and Grafana during tests

#### Implementation Standards

```javascript
// Example k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must finish within 500ms
    'http_req_duration{name:getTeams}': ['p(95)<300'],
    'http_req_duration{name:getEvents}': ['p(95)<400'],
    http_req_failed: ['rate<0.01'],    // http errors should be less than 1%
  },
};

// Simulate user behavior
export default function() {
  const baseUrl = __ENV.BASE_URL || 'https://staging-api.hockeyhub.com';
  
  // Get auth token
  const loginRes = http.post(`${baseUrl}/auth/login`, {
    email: 'perftest@example.com',
    password: 'password123'
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200 && r.json('data.accessToken') !== undefined,
  });
  
  const authToken = loginRes.json('data.accessToken');
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  // Get teams
  const teamsRes = http.get(
    `${baseUrl}/teams`, 
    params,
    { tags: { name: 'getTeams' }}
  );
  
  check(teamsRes, {
    'teams retrieved': (r) => r.status === 200,
    'teams count correct': (r) => r.json('data').length > 0,
  });
  
  // Get calendar events
  const eventsRes = http.get(
    `${baseUrl}/events?start=2023-01-01&end=2023-01-31`, 
    params,
    { tags: { name: 'getEvents' }}
  );
  
  check(eventsRes, {
    'events retrieved': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}
```

### Security Testing

Security tests identify vulnerabilities and ensure data protection.

#### Approach

- Static Application Security Testing (SAST)
- Dynamic Application Security Testing (DAST)
- Dependency vulnerability scanning
- Regular penetration testing
- Compliance verification

#### Framework & Tools

- **SAST**: SonarQube and ESLint security rules
- **DAST**: OWASP ZAP
- **Dependency Scanning**: NPM Audit and Snyk
- **Secrets Scanning**: git-secrets
- **Container Scanning**: Trivy for Docker images

#### Implementation Standards

```yaml
# Example GitHub workflow for security scanning
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Run every Monday at 2 AM
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Snyk - Check for vulnerabilities
        uses: snyk/actions@master
        with:
          command: test
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  
  secrets-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: GitGuardian scan
        uses: gitguardian/ggshield-action@master
        env:
          GITHUB_PUSH_BEFORE_SHA: ${{ github.event.before }}
          GITHUB_PUSH_BASE_SHA: ${{ github.event.base }}
          GITHUB_PULL_BASE_SHA: ${{ github.event.pull_request.base.sha }}
          GITHUB_DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
          GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
  
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging-api.hockeyhub.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

## Test Environments

Different testing activities require appropriately configured environments:

### Local Development Environment

- Docker Compose for local service dependencies
- In-memory databases for unit tests
- Mocked external services
- Hot reloading for quick test-debug cycles

### Continuous Integration Environment

- Ephemeral containerized environment for each build
- Test-specific databases and dependencies
- Isolated from other test runs
- Emphasis on speed and independence

### Testing Environment

- Cloud-based environment similar to staging
- Refreshed with anonymized data periodically
- Full service mesh with all components
- Monitoring enabled for test observation

### Performance Testing Environment

- Production-like environment in scale and configuration
- Isolated to prevent impact on other environments
- Realistic data volumes
- Complete monitoring stack

## Test Data Management

Consistent test data management is critical for reliable tests:

### Test Data Creation Strategies

1. **Builders & Factories**
   - Builder pattern for complex test objects
   - Factory functions for common entities
   - Randomized unique values for identifiers

```typescript
// Example test data builder
class UserBuilder {
  private user: Partial<User> = {
    id: undefined,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    preferredLanguage: 'en',
    status: 'active',
  };
  
  withId(id: string): UserBuilder {
    this.user.id = id;
    return this;
  }
  
  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }
  
  withName(firstName: string, lastName: string): UserBuilder {
    this.user.firstName = firstName;
    this.user.lastName = lastName;
    return this;
  }
  
  withRole(role: string): UserBuilder {
    this.user.roles = [...(this.user.roles || []), role];
    return this;
  }
  
  asPlayer(): UserBuilder {
    return this.withRole('player');
  }
  
  asCoach(): UserBuilder {
    return this.withRole('coach');
  }
  
  build(): User {
    // Generate unique ID if not provided
    if (!this.user.id) {
      this.user.id = `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    
    return this.user as User;
  }
}

// Usage
const testUser = new UserBuilder()
  .withName('John', 'Doe')
  .withEmail('john.doe@example.com')
  .asCoach()
  .build();
```

2. **Test Database Seeding**
   - Scripted database seeding for integration tests
   - Consistent starting state for each test suite
   - Transactions for test isolation

```typescript
// Example database seeding utility
export async function seedTestDatabase(connection: Connection): Promise<void> {
  // Use a transaction to ensure all or nothing
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // Clear existing data
    await queryRunner.query('DELETE FROM team_members');
    await queryRunner.query('DELETE FROM teams');
    await queryRunner.query('DELETE FROM user_roles');
    await queryRunner.query('DELETE FROM users');
    
    // Create test organizations
    await queryRunner.query(`
      INSERT INTO organizations (id, name, contact_email)
      VALUES 
        ('org-1', 'Test Organization', 'org@example.com'),
        ('org-2', 'Another Org', 'another@example.com')
    `);
    
    // Create test users
    await queryRunner.query(`
      INSERT INTO users (id, email, first_name, last_name, password_hash, organization_id)
      VALUES
        ('user-1', 'coach@example.com', 'Coach', 'User', '$2b$10$...', 'org-1'),
        ('user-2', 'player@example.com', 'Player', 'One', '$2b$10$...', 'org-1')
    `);
    
    // Create roles
    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES
        ('user-1', 'coach'),
        ('user-2', 'player')
    `);
    
    // Create teams
    await queryRunner.query(`
      INSERT INTO teams (id, name, organization_id)
      VALUES
        ('team-1', 'Test Team', 'org-1')
    `);
    
    // Add team members
    await queryRunner.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES
        ('team-1', 'user-1', 'coach'),
        ('team-1', 'user-2', 'player')
    `);
    
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

3. **Test Data Isolation**
   - Prefixed identifiers for test data
   - Cleanup routines after tests
   - Independent data per test suite

### Database Testing Approaches

1. **In-Memory Database**
   - Used for unit and fast integration tests
   - SQLite in-memory for schema validation
   - No persistence between test runs

2. **Test Containers**
   - Docker containers for databases
   - Real PostgreSQL for accurate behavior
   - Created and destroyed with test suite
   - Schema applied via migrations

```typescript
// Example test database setup with Testcontainers
import { PostgreSqlContainer } from 'testcontainers';
import { createConnection } from 'typeorm';

export async function setupTestDatabase() {
  // Start PostgreSQL container
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_password')
    .start();
  
  // Create TypeORM connection
  const connection = await createConnection({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
    synchronize: false,
  });
  
  return {
    connection,
    container,
    async runMigrations() {
      return connection.runMigrations();
    },
    async query(sql: string) {
      return connection.query(sql);
    },
    async close() {
      await connection.close();
      await container.stop();
    }
  };
}
```

3. **Dedicated Test Database**
   - Persistent test database for E2E tests
   - Refreshed on test cycle start
   - Not shared with other environments

## Testing Tools & Frameworks

The Hockey Hub platform uses the following tools and frameworks for testing:

### Backend Testing

| Tool/Framework | Purpose | Usage |
|----------------|---------|-------|
| Jest | Test runner and assertion library | Unit and integration tests |
| Supertest | HTTP testing | API integration tests |
| TypeORM Testing | Database testing | Repository and entity tests |
| Testcontainers | Service dependencies | Integration tests |
| Winston | Test logging | Debugging failed tests |
| Sinon | Mocking and stubbing | Isolating units for testing |

### Frontend Testing

| Tool/Framework | Purpose | Usage |
|----------------|---------|-------|
| Jest | Test runner | Unit testing |
| React Testing Library | Component testing | Testing UI components |
| Mock Service Worker | API mocking | Frontend unit tests |
| Cypress | End-to-end testing | User flow validation |
| Storybook | Component development | Visual testing environment |
| Testing Library User Event | User interaction simulation | Component interaction tests |

### Performance and Security Testing

| Tool/Framework | Purpose | Usage |
|----------------|---------|-------|
| k6 | Load testing | API performance |
| Lighthouse | Frontend performance | Web vitals measurement |
| OWASP ZAP | Security scanning | Vulnerability detection |
| SonarQube | Static code analysis | Code quality and security |
| npm audit / Snyk | Dependency scanning | Vulnerability detection |

### Test Management and Reporting

| Tool/Framework | Purpose | Usage |
|----------------|---------|-------|
| Jest JUnit | Test reporting | CI integration |
| Allure | Test reporting | Detailed test results |
| GitHub | Issue tracking | Bug management |
| GitHub Actions | CI/CD | Automated test execution |

## Mocking Strategy

Mocking isolates code under test from its dependencies. Hockey Hub uses the following mocking strategy:

### Service Mocking

Mock external services and dependencies to isolate the system under test:

```typescript
// Example of service mocking
import { UserRepository } from '../repositories/userRepository';

// Create mock repository
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Configure mock for specific test
mockUserRepository.findById.mockResolvedValue({
  id: 'test-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
});
```

### HTTP/API Mocking

Mock HTTP requests to external services:

```typescript
// Example of API mocking with MSW for frontend tests
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Define handlers
const handlers = [
  rest.get('*/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'test-id') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            id: 'test-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          }
        })
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        })
      );
    }
  }),
  
  rest.post('*/api/users', (req, res, ctx) => {
    const { email } = req.body as any;
    
    if (email === 'exists@example.com') {
      return res(
        ctx.status(409),
        ctx.json({
          success: false,
          error: {
            message: 'User already exists',
            code: 'USER_EXISTS'
          }
        })
      );
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: 'new-id',
          ...req.body
        }
      })
    );
  })
];

// Setup server
const server = setupServer(...handlers);

// Use in tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Database Mocking

Mock database repositories to isolate from persistence layer:

```typescript
// Example repository mocking
import { TeamRepository } from '../repositories/teamRepository';
import { Team } from '../entities/team';

class MockTeamRepository implements TeamRepository {
  private teams: Team[] = [];
  
  async findById(id: string): Promise<Team | null> {
    const team = this.teams.find(t => t.id === id);
    return team ? { ...team } : null;
  }
  
  async findByOrganization(organizationId: string): Promise<Team[]> {
    return this.teams
      .filter(t => t.organizationId === organizationId)
      .map(t => ({ ...t }));
  }
  
  async create(team: Partial<Team>): Promise<Team> {
    const newTeam = {
      id: team.id || `team-${Date.now()}`,
      name: team.name || 'Default Team',
      organizationId: team.organizationId || 'org-1',
      category: team.category || 'default',
      season: team.season || '2023-2024',
      status: team.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Team;
    
    this.teams.push(newTeam);
    return { ...newTeam };
  }
  
  async update(id: string, data: Partial<Team>): Promise<Team> {
    const index = this.teams.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Team not found');
    }
    
    this.teams[index] = {
      ...this.teams[index],
      ...data,
      updatedAt: new Date()
    };
    
    return { ...this.teams[index] };
  }
  
  async delete(id: string): Promise<void> {
    const index = this.teams.findIndex(t => t.id === id);
    if (index !== -1) {
      this.teams.splice(index, 1);
    }
  }
  
  // Helper methods for tests
  _setTeams(teams: Team[]): void {
    this.teams = [...teams];
  }
  
  _getTeams(): Team[] {
    return [...this.teams];
  }
}

// Usage in tests
const mockTeamRepository = new MockTeamRepository();
mockTeamRepository._setTeams([
  {
    id: 'team-1',
    name: 'Test Team',
    organizationId: 'org-1',
    category: 'Junior',
    season: '2023-2024',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```

### Mock Data Generation

Generate consistent mock data for tests:

```typescript
// Example mock data generation utility
export const mockData = {
  users: {
    coach: {
      id: 'coach-1',
      email: 'coach@example.com',
      firstName: 'Coach',
      lastName: 'User',
      roles: ['coach'],
      organizationId: 'org-1'
    },
    player: {
      id: 'player-1',
      email: 'player@example.com',
      firstName: 'Player',
      lastName: 'One',
      roles: ['player'],
      organizationId: 'org-1'
    },
    admin: {
      id: 'admin-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
      organizationId: 'org-1'
    }
  },
  
  teams: {
    juniorTeam: {
      id: 'team-1',
      name: 'Junior Tigers',
      category: 'Junior',
      season: '2023-2024',
      organizationId: 'org-1',
      status: 'active'
    },
    seniorTeam: {
      id: 'team-2',
      name: 'Senior Lions',
      category: 'Senior',
      season: '2023-2024',
      organizationId: 'org-1',
      status: 'active'
    }
  },
  
  // Generate a valid JWT token for testing
  generateToken: (payload: any): string => {
    // This would be a utility to generate JWT tokens for testing
    // Implementation depends on the project's JWT library
    return 'mock.jwt.token';
  }
};
```

## Component-Specific Testing

Different components of the Hockey Hub platform require specialized testing approaches:

### Frontend Component Testing

Testing React components with React Testing Library focuses on testing component behavior from the user's perspective rather than implementation details.

#### Component Test Approach

1. **User-Centric Testing**: Test what the user sees and interacts with
2. **Query Priority**: Follow the RTL recommended query priority (getByRole, getByLabelText, etc.)
3. **Event Simulation**: Use fireEvent or userEvent to simulate user interactions
4. **Accessibility Testing**: Test components for accessibility during component tests
5. **Snapshots**: Use sparingly, only for stable UI components

#### Component Testing Example

```tsx
// Example component test
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamForm } from '../TeamForm';
import { mockTeam } from '../../test/mockData';

describe('TeamForm', () => {
  const mockSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders empty form when no initial data provided', () => {
    // Arrange
    render(<TeamForm onSubmit={mockSubmit} />);
    
    // Assert
    expect(screen.getByLabelText(/team name/i)).toHaveValue('');
    expect(screen.getByLabelText(/category/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
  
  it('renders form with initial values when data provided', () => {
    // Arrange
    render(<TeamForm initialData={mockTeam} onSubmit={mockSubmit} />);
    
    // Assert
    expect(screen.getByLabelText(/team name/i)).toHaveValue(mockTeam.name);
    expect(screen.getByLabelText(/category/i)).toHaveValue(mockTeam.category);
  });
  
  it('calls onSubmit with form data when submitted', async () => {
    // Arrange
    render(<TeamForm onSubmit={mockSubmit} />);
    
    // Act - Fill form
    fireEvent.change(screen.getByLabelText(/team name/i), {
      target: { value: 'New Team' }
    });
    
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'Junior' }
    });
    
    fireEvent.change(screen.getByLabelText(/season/i), {
      target: { value: '2025-2026' }
    });
    
    // Act - Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Team',
        category: 'Junior',
        season: '2025-2026'
      }));
    });
  });
  
  it('displays validation errors for required fields', async () => {
    // Arrange
    render(<TeamForm onSubmit={mockSubmit} />);
    
    // Act - Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/team name is required/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
  
  it('supports error state from parent component', () => {
    // Arrange
    render(
      <TeamForm 
        onSubmit={mockSubmit} 
        error="Failed to save team due to server error" 
      />
    );
    
    // Assert
    expect(screen.getByText(/failed to save team/i)).toBeInTheDocument();
  });
});