# Testing Guide

This comprehensive guide covers testing strategies, frameworks, and best practices for the Hockey Hub project.

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Types and Strategy](#test-types-and-strategy)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Frontend Testing](#frontend-testing)
6. [API Testing](#api-testing)
7. [Database Testing](#database-testing)
8. [E2E Testing](#e2e-testing)
9. [Test Utilities](#test-utilities)
10. [Performance Testing](#performance-testing)
11. [CI/CD Integration](#cicd-integration)

## Testing Overview

### Testing Philosophy
Hockey Hub follows a comprehensive testing strategy:
- **Test Pyramid**: More unit tests, fewer integration tests, minimal E2E tests
- **Test-Driven Development (TDD)**: Write tests before implementation when possible
- **Behavior-Driven Development (BDD)**: Focus on business requirements
- **Continuous Testing**: Tests run automatically on every commit

### Test Framework Stack
- **Unit Tests**: Jest + TypeScript
- **Frontend Tests**: React Testing Library + Jest
- **Integration Tests**: Jest + Supertest
- **E2E Tests**: Cypress
- **API Tests**: Jest + Supertest
- **Performance Tests**: Artillery.js

### Coverage Goals
- **Unit Tests**: 80% minimum, 90% target
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user journeys
- **Regression Tests**: All bug fixes must include tests

## Test Types and Strategy

### 1. Unit Tests (70% of tests)
- Test individual functions and classes
- Mock all external dependencies
- Fast execution (< 1ms per test)
- High coverage of business logic

### 2. Integration Tests (20% of tests)
- Test service interactions
- Use real databases (test environment)
- Test API endpoints end-to-end
- Validate data persistence

### 3. E2E Tests (10% of tests)
- Test complete user workflows
- Use real browser automation
- Test critical business paths
- Validate UI/UX behavior

## Unit Testing

### Basic Unit Test Structure
```typescript
// src/services/__tests__/playerService.test.ts
import { PlayerService } from '../playerService';
import { PlayerRepository } from '../repositories/playerRepository';
import { NotFoundError } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../repositories/playerRepository');

describe('PlayerService', () => {
  let playerService: PlayerService;
  let mockPlayerRepository: jest.Mocked<PlayerRepository>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock repository
    mockPlayerRepository = new PlayerRepository() as jest.Mocked<PlayerRepository>;
    
    // Inject mock into service
    playerService = new PlayerService(mockPlayerRepository);
  });

  describe('getPlayerById', () => {
    it('should return player when found', async () => {
      // Arrange
      const playerId = 'player-123';
      const expectedPlayer = {
        id: playerId,
        firstName: 'Connor',
        lastName: 'McDavid',
        position: 'CENTER',
      };
      
      mockPlayerRepository.findById.mockResolvedValue(expectedPlayer as any);

      // Act
      const result = await playerService.getPlayerById(playerId);

      // Assert
      expect(result).toEqual(expectedPlayer);
      expect(mockPlayerRepository.findById).toHaveBeenCalledWith(playerId);
      expect(mockPlayerRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when player not found', async () => {
      // Arrange
      const playerId = 'nonexistent-player';
      mockPlayerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(playerService.getPlayerById(playerId))
        .rejects
        .toThrow(NotFoundError);
      
      expect(mockPlayerRepository.findById).toHaveBeenCalledWith(playerId);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const playerId = 'player-123';
      const dbError = new Error('Database connection failed');
      mockPlayerRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(playerService.getPlayerById(playerId))
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('createPlayer', () => {
    it('should create player with valid data', async () => {
      // Arrange
      const playerData = {
        firstName: 'Sidney',
        lastName: 'Crosby',
        email: 'sidney@penguins.com',
        position: 'CENTER',
        jerseyNumber: 87,
      };

      const createdPlayer = {
        id: 'player-456',
        ...playerData,
        createdAt: new Date(),
      };

      mockPlayerRepository.create.mockResolvedValue(createdPlayer as any);

      // Act
      const result = await playerService.createPlayer(playerData);

      // Assert
      expect(result).toEqual(createdPlayer);
      expect(mockPlayerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(playerData)
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        firstName: 'Sidney',
        // Missing required fields
      };

      // Act & Assert
      await expect(playerService.createPlayer(invalidData as any))
        .rejects
        .toThrow('Validation failed');
    });
  });
});
```

### Testing Async Code
```typescript
describe('Async Operations', () => {
  it('should handle promises correctly', async () => {
    const result = await playerService.getPlayerStats('player-123');
    expect(result).toBeDefined();
  });

  it('should handle promise rejections', async () => {
    mockPlayerRepository.findById.mockRejectedValue(new Error('DB Error'));
    
    await expect(playerService.getPlayerById('invalid'))
      .rejects
      .toThrow('DB Error');
  });

  it('should test with fake timers', () => {
    jest.useFakeTimers();
    
    const callback = jest.fn();
    scheduleCallback(callback, 1000);
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalled();
    
    jest.useRealTimers();
  });
});
```

### Testing with Custom Matchers
```typescript
// Create custom matchers for better assertions
expect.extend({
  toBeValidPlayer(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.firstName === 'string' &&
      typeof received.lastName === 'string' &&
      ['GOALIE', 'DEFENSE', 'FORWARD'].includes(received.position);

    return {
      message: () => `Expected ${received} to be a valid player`,
      pass,
    };
  },
});

// Usage
it('should return valid player', async () => {
  const player = await playerService.getPlayerById('123');
  expect(player).toBeValidPlayer();
});
```

## Integration Testing

### API Integration Tests
```typescript
// src/routes/__tests__/playerRoutes.integration.test.ts
import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, teardownTestDatabase } from '../../test-utils';

describe('Player Routes Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user and get auth token
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    
    authToken = response.body.token;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Clean data before each test
    await cleanTestData();
  });

  describe('GET /api/players', () => {
    it('should return list of players', async () => {
      // Arrange
      await createTestPlayer({
        firstName: 'Connor',
        lastName: 'McDavid',
        position: 'CENTER',
      });

      // Act
      const response = await request(app)
        .get('/api/players')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        firstName: 'Connor',
        lastName: 'McDavid',
        position: 'CENTER',
      });
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/players')
        .expect(401);
    });

    it('should support pagination', async () => {
      // Create multiple test players
      await Promise.all([
        createTestPlayer({ firstName: 'Player', lastName: '1' }),
        createTestPlayer({ firstName: 'Player', lastName: '2' }),
        createTestPlayer({ firstName: 'Player', lastName: '3' }),
      ]);

      const response = await request(app)
        .get('/api/players?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(3);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.hasNext).toBe(true);
    });

    it('should support filtering', async () => {
      await Promise.all([
        createTestPlayer({ position: 'GOALIE' }),
        createTestPlayer({ position: 'DEFENSE' }),
        createTestPlayer({ position: 'FORWARD' }),
      ]);

      const response = await request(app)
        .get('/api/players?position=GOALIE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].position).toBe('GOALIE');
    });
  });

  describe('POST /api/players', () => {
    it('should create new player', async () => {
      const playerData = {
        firstName: 'Sidney',
        lastName: 'Crosby',
        email: 'sidney@penguins.com',
        position: 'CENTER',
        jerseyNumber: 87,
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${authToken}`)
        .send(playerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(playerData);
      expect(response.body.data.id).toBeDefined();

      // Verify player was saved to database
      const savedPlayer = await getPlayerById(response.body.data.id);
      expect(savedPlayer).toMatchObject(playerData);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: 'Sidney',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('lastName is required');
    });

    it('should prevent duplicate jersey numbers', async () => {
      const playerData = {
        firstName: 'Connor',
        lastName: 'McDavid',
        jerseyNumber: 97,
        teamId: 'team-123',
      };

      // Create first player
      await createTestPlayer(playerData);

      // Try to create second player with same jersey number
      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...playerData,
          firstName: 'Sidney',
          lastName: 'Crosby',
        })
        .expect(409);

      expect(response.body.error.code).toBe('JERSEY_NUMBER_TAKEN');
    });
  });

  describe('PUT /api/players/:id', () => {
    it('should update existing player', async () => {
      const player = await createTestPlayer({
        firstName: 'Connor',
        lastName: 'McDavid',
      });

      const updateData = {
        firstName: 'Connor',
        lastName: 'McDavid-Updated',
        position: 'CENTER',
      };

      const response = await request(app)
        .put(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.lastName).toBe('McDavid-Updated');

      // Verify database was updated
      const updatedPlayer = await getPlayerById(player.id);
      expect(updatedPlayer.lastName).toBe('McDavid-Updated');
    });

    it('should return 404 for non-existent player', async () => {
      await request(app)
        .put('/api/players/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('should soft delete player', async () => {
      const player = await createTestPlayer({
        firstName: 'Connor',
        lastName: 'McDavid',
      });

      await request(app)
        .delete(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify player is soft deleted
      const deletedPlayer = await getPlayerById(player.id);
      expect(deletedPlayer.deletedAt).toBeDefined();
    });
  });
});
```

### Database Integration Tests
```typescript
// src/__tests__/database/playerRepository.integration.test.ts
import { PlayerRepository } from '../repositories/playerRepository';
import { setupTestDatabase, teardownTestDatabase } from '../test-utils';

describe('PlayerRepository Integration', () => {
  let playerRepository: PlayerRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    playerRepository = new PlayerRepository();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanTestData();
  });

  describe('findById', () => {
    it('should retrieve player by id', async () => {
      const playerData = {
        firstName: 'Connor',
        lastName: 'McDavid',
        position: 'CENTER',
      };

      const createdPlayer = await playerRepository.create(playerData);
      const foundPlayer = await playerRepository.findById(createdPlayer.id);

      expect(foundPlayer).toMatchObject(playerData);
      expect(foundPlayer.id).toBe(createdPlayer.id);
    });

    it('should return null for non-existent player', async () => {
      const result = await playerRepository.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByTeamId', () => {
    it('should return players for specific team', async () => {
      const teamId = 'team-123';

      await Promise.all([
        playerRepository.create({ teamId, firstName: 'Player', lastName: '1' }),
        playerRepository.create({ teamId, firstName: 'Player', lastName: '2' }),
        playerRepository.create({ teamId: 'other-team', firstName: 'Player', lastName: '3' }),
      ]);

      const teamPlayers = await playerRepository.findByTeamId(teamId);

      expect(teamPlayers).toHaveLength(2);
      expect(teamPlayers.every(p => p.teamId === teamId)).toBe(true);
    });
  });

  describe('search', () => {
    it('should search players by name', async () => {
      await Promise.all([
        playerRepository.create({ firstName: 'Connor', lastName: 'McDavid' }),
        playerRepository.create({ firstName: 'Sidney', lastName: 'Crosby' }),
        playerRepository.create({ firstName: 'Alexander', lastName: 'Ovechkin' }),
      ]);

      const searchResults = await playerRepository.search('Connor');

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].firstName).toBe('Connor');
    });

    it('should search case-insensitively', async () => {
      await playerRepository.create({ firstName: 'Connor', lastName: 'McDavid' });

      const results = await playerRepository.search('connor');
      expect(results).toHaveLength(1);
    });
  });

  describe('transaction support', () => {
    it('should support database transactions', async () => {
      await playerRepository.transaction(async (manager) => {
        await manager.save(Player, { firstName: 'Player', lastName: '1' });
        await manager.save(Player, { firstName: 'Player', lastName: '2' });
      });

      const players = await playerRepository.findAll();
      expect(players).toHaveLength(2);
    });

    it('should rollback on transaction error', async () => {
      try {
        await playerRepository.transaction(async (manager) => {
          await manager.save(Player, { firstName: 'Player', lastName: '1' });
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }

      const players = await playerRepository.findAll();
      expect(players).toHaveLength(0);
    });
  });
});
```

## Frontend Testing

### Component Testing
```typescript
// src/components/__tests__/PlayerCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerCard } from '../PlayerCard';
import { renderWithProviders } from '../../test-utils';

const mockPlayer = {
  id: 'player-123',
  firstName: 'Connor',
  lastName: 'McDavid',
  position: 'CENTER',
  jerseyNumber: 97,
  statistics: {
    goals: 50,
    assists: 65,
    points: 115,
  },
};

describe('PlayerCard', () => {
  it('should render player information', () => {
    render(<PlayerCard player={mockPlayer} />);

    expect(screen.getByText('Connor McDavid')).toBeInTheDocument();
    expect(screen.getByText('#97')).toBeInTheDocument();
    expect(screen.getByText('CENTER')).toBeInTheDocument();
    expect(screen.getByText('50 Goals')).toBeInTheDocument();
    expect(screen.getByText('65 Assists')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = jest.fn();
    const user = userEvent.setup();

    render(<PlayerCard player={mockPlayer} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockPlayer);
  });

  it('should not show edit button when onEdit is not provided', () => {
    render(<PlayerCard player={mockPlayer} />);

    const editButton = screen.queryByRole('button', { name: /edit/i });
    expect(editButton).not.toBeInTheDocument();
  });

  it('should handle missing statistics gracefully', () => {
    const playerWithoutStats = { ...mockPlayer, statistics: undefined };

    render(<PlayerCard player={playerWithoutStats} />);

    expect(screen.getByText('Connor McDavid')).toBeInTheDocument();
    expect(screen.getByText('No statistics available')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PlayerCard player={mockPlayer} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### Redux Testing
```typescript
// src/store/__tests__/playerSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import { playerApi } from '../api/playerApi';
import { playerSlice } from '../slices/playerSlice';

describe('Player Redux Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        player: playerSlice.reducer,
        [playerApi.reducerPath]: playerApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(playerApi.middleware),
    });
  });

  it('should handle player selection', () => {
    const player = mockPlayer;

    store.dispatch(playerSlice.actions.selectPlayer(player));

    const state = store.getState();
    expect(state.player.selectedPlayer).toEqual(player);
  });

  it('should handle API loading states', async () => {
    const promise = store.dispatch(
      playerApi.endpoints.getPlayers.initiate({})
    );

    // Check loading state
    let state = store.getState();
    expect(state[playerApi.reducerPath].queries).toMatchObject({
      'getPlayers({})': {
        status: 'pending',
      },
    });

    await promise;

    // Check success state
    state = store.getState();
    expect(state[playerApi.reducerPath].queries).toMatchObject({
      'getPlayers({})': {
        status: 'fulfilled',
      },
    });
  });
});
```

### Hook Testing
```typescript
// src/hooks/__tests__/usePlayerStats.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { usePlayerStats } from '../usePlayerStats';
import { createWrapper } from '../../test-utils';

// Mock the API
jest.mock('../api/playerApi', () => ({
  useGetPlayerStatsQuery: jest.fn(),
}));

describe('usePlayerStats', () => {
  it('should return player statistics', async () => {
    const mockStats = {
      goals: 50,
      assists: 65,
      gamesPlayed: 82,
    };

    (useGetPlayerStatsQuery as jest.Mock).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => usePlayerStats('player-123'),
      { wrapper: createWrapper() }
    );

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state', () => {
    (useGetPlayerStatsQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(
      () => usePlayerStats('player-123'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBeUndefined();
  });

  it('should handle error state', () => {
    const mockError = { message: 'Failed to fetch stats' };

    (useGetPlayerStatsQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(
      () => usePlayerStats('player-123'),
      { wrapper: createWrapper() }
    );

    expect(result.current.error).toEqual(mockError);
    expect(result.current.stats).toBeUndefined();
  });
});
```

## API Testing

### API Contract Tests
```typescript
// src/__tests__/api/playerApi.contract.test.ts
import { playerApiSchema } from '../schemas/playerApiSchema';
import { validateApiResponse } from '../test-utils/schemaValidation';

describe('Player API Contract Tests', () => {
  it('should conform to API schema for GET /players', async () => {
    const response = await fetch('/api/players');
    const data = await response.json();

    expect(validateApiResponse(data, playerApiSchema.getPlayers)).toBe(true);
  });

  it('should return proper error format for validation errors', async () => {
    const response = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalidField: 'value' }),
    });

    const data = await response.json();

    expect(data).toMatchObject({
      success: false,
      error: {
        code: expect.any(String),
        message: expect.any(String),
        details: expect.any(Array),
      },
    });
  });
});
```

### Performance Testing
```typescript
// src/__tests__/performance/playerApi.performance.test.ts
describe('Player API Performance', () => {
  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now();

    const response = await request(app)
      .get('/api/players?limit=100')
      .expect(200);

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(500); // 500ms limit
    expect(response.body.data).toHaveLength(100);
  });

  it('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill(null).map(() =>
      request(app).get('/api/players')
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should paginate large datasets efficiently', async () => {
    // Create large dataset
    await createManyTestPlayers(1000);

    const startTime = Date.now();

    const response = await request(app)
      .get('/api/players?page=10&limit=50')
      .expect(200);

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(200);
    expect(response.body.data).toHaveLength(50);
    expect(response.body.meta.page).toBe(10);
  });
});
```

## Database Testing

### Repository Testing
```typescript
// src/repositories/__tests__/playerRepository.test.ts
import { PlayerRepository } from '../playerRepository';
import { TestDatabaseFactory } from '../../test-utils/database';

describe('PlayerRepository', () => {
  let repository: PlayerRepository;
  let testDb: TestDatabaseFactory;

  beforeAll(async () => {
    testDb = new TestDatabaseFactory();
    await testDb.setup();
    repository = new PlayerRepository(testDb.connection);
  });

  afterAll(async () => {
    await testDb.teardown();
  });

  beforeEach(async () => {
    await testDb.clean();
  });

  describe('caching behavior', () => {
    it('should cache query results', async () => {
      const player = await repository.create(mockPlayerData);

      // First query - hits database
      const result1 = await repository.findById(player.id);
      
      // Second query - hits cache
      const result2 = await repository.findById(player.id);

      expect(result1).toEqual(result2);
      
      // Verify cache hit by checking query count
      const queryCount = testDb.getQueryCount();
      expect(queryCount).toBe(2); // CREATE + SELECT (cache hit on second)
    });

    it('should invalidate cache on updates', async () => {
      const player = await repository.create(mockPlayerData);
      
      // Cache the result
      await repository.findById(player.id);
      
      // Update should invalidate cache
      await repository.update(player.id, { firstName: 'Updated' });
      
      // Next query should hit database
      const updated = await repository.findById(player.id);
      expect(updated.firstName).toBe('Updated');
    });
  });

  describe('transaction handling', () => {
    it('should rollback on error', async () => {
      const initialCount = await repository.count();

      try {
        await repository.transaction(async (manager) => {
          await manager.save(Player, mockPlayerData);
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected
      }

      const finalCount = await repository.count();
      expect(finalCount).toBe(initialCount);
    });
  });
});
```

### Migration Testing
```typescript
// src/migrations/__tests__/migration.test.ts
import { MigrationExecutor } from '../../test-utils/migrationExecutor';

describe('Database Migrations', () => {
  let migrator: MigrationExecutor;

  beforeEach(() => {
    migrator = new MigrationExecutor();
  });

  afterEach(async () => {
    await migrator.cleanup();
  });

  it('should run all migrations successfully', async () => {
    await migrator.runAllMigrations();
    
    const tables = await migrator.getTables();
    expect(tables).toContain('players');
    expect(tables).toContain('teams');
    expect(tables).toContain('games');
  });

  it('should rollback migrations correctly', async () => {
    await migrator.runAllMigrations();
    await migrator.rollbackAllMigrations();
    
    const tables = await migrator.getTables();
    expect(tables).toHaveLength(0);
  });

  it('should handle migration dependencies', async () => {
    // Test that migrations run in correct order
    await migrator.runMigrations(['CreateTeams', 'CreatePlayers']);
    
    const playerTable = await migrator.getTableSchema('players');
    expect(playerTable.foreignKeys).toContainEqual(
      expect.objectContaining({
        referencedTableName: 'teams'
      })
    );
  });
});
```

## E2E Testing

### Cypress E2E Tests
```typescript
// cypress/e2e/player-management.cy.ts
describe('Player Management', () => {
  beforeEach(() => {
    // Login as coach
    cy.login('coach@example.com', 'password123');
    cy.visit('/players');
  });

  it('should display list of players', () => {
    cy.get('[data-testid="player-list"]').should('be.visible');
    cy.get('[data-testid="player-card"]').should('have.length.at.least', 1);
  });

  it('should create new player', () => {
    cy.get('[data-testid="add-player-button"]').click();
    
    // Fill out form
    cy.get('[data-testid="first-name-input"]').type('Connor');
    cy.get('[data-testid="last-name-input"]').type('McDavid');
    cy.get('[data-testid="position-select"]').select('CENTER');
    cy.get('[data-testid="jersey-number-input"]').type('97');
    
    // Submit form
    cy.get('[data-testid="submit-button"]').click();
    
    // Verify player was created
    cy.get('[data-testid="success-message"]').should('contain', 'Player created successfully');
    cy.get('[data-testid="player-list"]').should('contain', 'Connor McDavid');
  });

  it('should edit existing player', () => {
    // Find and click edit button for first player
    cy.get('[data-testid="player-card"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });
    
    // Update player name
    cy.get('[data-testid="first-name-input"]').clear().type('Sidney');
    cy.get('[data-testid="last-name-input"]').clear().type('Crosby');
    
    // Save changes
    cy.get('[data-testid="save-button"]').click();
    
    // Verify changes were saved
    cy.get('[data-testid="success-message"]').should('contain', 'Player updated successfully');
    cy.get('[data-testid="player-list"]').should('contain', 'Sidney Crosby');
  });

  it('should delete player', () => {
    const playerName = 'Test Player';
    
    // Create test player first
    cy.createTestPlayer({ firstName: 'Test', lastName: 'Player' });
    
    // Find and delete the player
    cy.get('[data-testid="player-card"]').contains(playerName).within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete"]').click();
    
    // Verify player was deleted
    cy.get('[data-testid="success-message"]').should('contain', 'Player deleted successfully');
    cy.get('[data-testid="player-list"]').should('not.contain', playerName);
  });

  it('should validate form inputs', () => {
    cy.get('[data-testid="add-player-button"]').click();
    
    // Try to submit empty form
    cy.get('[data-testid="submit-button"]').click();
    
    // Check validation messages
    cy.get('[data-testid="first-name-error"]').should('contain', 'First name is required');
    cy.get('[data-testid="last-name-error"]').should('contain', 'Last name is required');
    cy.get('[data-testid="position-error"]').should('contain', 'Position is required');
  });

  it('should search players', () => {
    cy.get('[data-testid="search-input"]').type('McDavid');
    cy.get('[data-testid="search-button"]').click();
    
    cy.get('[data-testid="player-card"]').should('have.length', 1);
    cy.get('[data-testid="player-card"]').should('contain', 'McDavid');
  });

  it('should filter players by position', () => {
    cy.get('[data-testid="position-filter"]').select('GOALIE');
    
    cy.get('[data-testid="player-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'GOALIE');
    });
  });
});
```

### Custom Cypress Commands
```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTestPlayer(playerData: any): Chainable<void>;
      cleanTestData(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
  });
});

Cypress.Commands.add('createTestPlayer', (playerData: any) => {
  cy.request({
    method: 'POST',
    url: '/api/players',
    body: playerData,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('authToken')}`,
    },
  });
});

Cypress.Commands.add('cleanTestData', () => {
  cy.request({
    method: 'DELETE',
    url: '/api/test/clean',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('authToken')}`,
    },
  });
});
```

## Test Utilities

### Database Test Utilities
```typescript
// src/test-utils/database.ts
import { DataSource } from 'typeorm';
import { Player } from '../entities/Player';

export class TestDatabaseFactory {
  private dataSource: DataSource;
  private queryCount = 0;

  async setup(): Promise<void> {
    this.dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Player, /* other entities */],
      synchronize: true,
      logging: false,
    });

    await this.dataSource.initialize();
  }

  async teardown(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
    }
  }

  async clean(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.clear();
    }
    
    this.queryCount = 0;
  }

  get connection(): DataSource {
    return this.dataSource;
  }

  getQueryCount(): number {
    return this.queryCount;
  }
}

// Helper functions
export async function createTestPlayer(data: Partial<Player> = {}): Promise<Player> {
  const playerData = {
    firstName: 'Test',
    lastName: 'Player',
    position: 'FORWARD',
    jerseyNumber: 99,
    ...data,
  };

  const repository = getConnection().getRepository(Player);
  return await repository.save(playerData);
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const repository = getConnection().getRepository(Player);
  return await repository.findOne({ where: { id } });
}

export async function cleanTestData(): Promise<void> {
  const connection = getConnection();
  const entities = connection.entityMetadatas;

  for (const entity of entities) {
    const repository = connection.getRepository(entity.name);
    await repository.clear();
  }
}
```

### React Test Utilities
```typescript
// src/test-utils/react.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../store/store';

// Create a wrapper component with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Custom hook for creating wrapper for hook testing
export function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders>{children}</AllTheProviders>
  );
}

// Mock data generators
export const mockPlayer = {
  id: 'player-123',
  firstName: 'Connor',
  lastName: 'McDavid',
  position: 'CENTER',
  jerseyNumber: 97,
  teamId: 'team-123',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTeam = {
  id: 'team-123',
  name: 'Edmonton Oilers',
  league: 'NHL',
  isActive: true,
};

// API mock utilities
export function mockApiSuccess<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
  };
}

export function mockApiLoading() {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
  };
}

export function mockApiError(error: any) {
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    error,
  };
}
```

## Performance Testing

### Load Testing with Artillery
```yaml
# artillery/player-api-load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  processor: './auth-processor.js'

scenarios:
  - name: "Player CRUD Operations"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomEmail }}"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/players"
          headers:
            Authorization: "Bearer {{ authToken }}"
      - post:
          url: "/api/players"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            firstName: "{{ $randomFirstName }}"
            lastName: "{{ $randomLastName }}"
            position: "{{ $randomPosition }}"
            jerseyNumber: "{{ $randomNumber }}"
          capture:
            - json: "$.data.id"
              as: "playerId"
      - get:
          url: "/api/players/{{ playerId }}"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

### Performance Benchmarks
```typescript
// src/__tests__/performance/benchmarks.test.ts
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  it('should process player stats calculation within time limit', () => {
    const player = createLargePlayerDataset();
    
    const startTime = performance.now();
    const stats = calculatePlayerStats(player);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    
    expect(executionTime).toBeLessThan(100); // 100ms limit
    expect(stats).toBeDefined();
  });

  it('should handle large dataset queries efficiently', async () => {
    await createManyTestPlayers(10000);
    
    const startTime = performance.now();
    const players = await playerRepository.findAll({ limit: 1000 });
    const endTime = performance.now();
    
    const queryTime = endTime - startTime;
    
    expect(queryTime).toBeLessThan(500); // 500ms limit
    expect(players).toHaveLength(1000);
  });
});
```

## CI/CD Integration

### GitHub Actions Test Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Run unit tests
      run: pnpm test:unit --coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_hockey_hub
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'pnpm'
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Run database migrations
      run: pnpm migrate:test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_hockey_hub
        
    - name: Run integration tests
      run: pnpm test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_hockey_hub
        REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'pnpm'
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Start application
      run: |
        pnpm build
        pnpm start:test &
        sleep 30
        
    - name: Run Cypress tests
      uses: cypress-io/github-action@v5
      with:
        wait-on: 'http://localhost:3000'
        wait-on-timeout: 120
        
    - name: Upload test artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots
```

### Test Scripts in package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:performance": "artillery run artillery/load-test.yml",
    "test:all": "pnpm test:unit && pnpm test:integration && pnpm test:e2e"
  }
}
```

This comprehensive testing guide ensures robust, reliable, and maintainable code across the entire Hockey Hub project.