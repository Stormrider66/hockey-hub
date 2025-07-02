import request from 'supertest';
import express from 'express';
import { MockFactory } from '@hockey-hub/shared-lib';
import workoutRoutes from './workoutRoutes';
import { CachedWorkoutSessionService } from '../services/CachedWorkoutSessionService';
import { AppDataSource } from '../config/database';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../services/CachedWorkoutSessionService');
jest.mock('../config/database');
jest.mock('@hockey-hub/shared-lib', () => ({
  ...jest.requireActual('@hockey-hub/shared-lib'),
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  authorize: jest.fn(() => (req: any, res: any, next: any) => next()),
  validationMiddleware: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/workouts', workoutRoutes);
  return app;
};

describe('Workout Routes', () => {
  let app: express.Application;
  let mockWorkoutService: jest.Mocked<CachedWorkoutSessionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockFactory.resetIdCounter();
    
    // Mock database connection
    (AppDataSource.isInitialized as unknown) = true;
    
    app = createTestApp();
    
    // Get mock instance
    mockWorkoutService = new CachedWorkoutSessionService() as jest.Mocked<CachedWorkoutSessionService>;
  });

  describe('Database Connection Check', () => {
    it('should return 503 when database is not initialized', async () => {
      // Arrange
      (AppDataSource.isInitialized as unknown) = false;

      // Act
      const response = await request(app)
        .get('/workouts/sessions')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        success: false,
        error: 'Database service unavailable',
        message: 'Please ensure the database is created and running',
      });
    });
  });

  describe('GET /workouts/sessions', () => {
    it('should return paginated workout sessions', async () => {
      // Arrange
      const mockSessions = [
        createMockWorkoutSession({ id: '1', title: 'Morning Training' }),
        createMockWorkoutSession({ id: '2', title: 'Evening Training' }),
      ];
      
      mockWorkoutService.getWorkoutSessions.mockResolvedValue({
        data: mockSessions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      // Act
      const response = await request(app)
        .get('/workouts/sessions')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSessions,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockWorkoutService.getWorkoutSessions).toHaveBeenCalledWith(
        expect.any(Object),
        1,
        20
      );
    });

    it('should handle filters correctly', async () => {
      // Arrange
      const filters = {
        teamId: 'team-1',
        playerId: 'player-1',
        status: 'scheduled',
        type: 'strength',
        date: '2025-01-15',
      };
      
      mockWorkoutService.getWorkoutSessions.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      // Act
      const response = await request(app)
        .get('/workouts/sessions')
        .query(filters)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(mockWorkoutService.getWorkoutSessions).toHaveBeenCalledWith(
        {
          teamId: 'team-1',
          playerId: 'player-1',
          status: 'scheduled',
          type: 'strength',
          date: new Date('2025-01-15'),
        },
        1,
        20
      );
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      mockWorkoutService.getWorkoutSessions.mockResolvedValue({
        data: [],
        total: 100,
        page: 3,
        limit: 10,
        totalPages: 10,
      });

      // Act
      const response = await request(app)
        .get('/workouts/sessions?page=3&limit=10')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(mockWorkoutService.getWorkoutSessions).toHaveBeenCalledWith(
        expect.any(Object),
        3,
        10
      );
    });

    it('should handle service errors', async () => {
      // Arrange
      mockWorkoutService.getWorkoutSessions.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/workouts/sessions')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch workout sessions',
      });
    });
  });

  describe('GET /workouts/sessions/:id', () => {
    it('should return single workout session', async () => {
      // Arrange
      const sessionId = 'session-1';
      const mockSession = createMockWorkoutSession({ id: sessionId });
      mockWorkoutService.getWorkoutSessionById.mockResolvedValue(mockSession);

      // Act
      const response = await request(app)
        .get(`/workouts/sessions/${sessionId}`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSession,
      });
      expect(mockWorkoutService.getWorkoutSessionById).toHaveBeenCalledWith(sessionId);
    });

    it('should return 404 when session not found', async () => {
      // Arrange
      mockWorkoutService.getWorkoutSessionById.mockRejectedValue(
        new Error('Workout session not found')
      );

      // Act
      const response = await request(app)
        .get('/workouts/sessions/non-existent')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Workout session not found',
      });
    });

    it('should handle other errors', async () => {
      // Arrange
      mockWorkoutService.getWorkoutSessionById.mockRejectedValue(
        new Error('Unexpected error')
      );

      // Act
      const response = await request(app)
        .get('/workouts/sessions/session-1')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch workout session',
      });
    });
  });

  describe('POST /workouts/sessions', () => {
    it('should create new workout session', async () => {
      // Arrange
      const newWorkoutData = {
        title: 'New Training Session',
        description: 'High intensity training',
        type: 'strength',
        scheduledDate: '2025-01-20T10:00:00Z',
        location: 'Gym A',
        teamId: 'team-1',
        playerIds: ['player-1', 'player-2'],
        exercises: [
          {
            name: 'Squats',
            sets: 3,
            reps: 10,
            weight: 100,
            restTime: 90,
          },
        ],
        playerLoads: [
          { playerId: 'player-1', load: 85 },
          { playerId: 'player-2', load: 75 },
        ],
        settings: { intensity: 'high' },
        estimatedDuration: 60,
        userId: 'trainer-1',
      };
      
      const createdSession = createMockWorkoutSession({
        ...newWorkoutData,
        id: 'new-session-1',
      });
      
      mockWorkoutService.createWorkoutSession.mockResolvedValue(createdSession);

      // Act
      const response = await request(app)
        .post('/workouts/sessions')
        .set('Authorization', 'Bearer test-token')
        .send(newWorkoutData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: createdSession,
      });
      expect(mockWorkoutService.createWorkoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Training Session',
          scheduledDate: new Date('2025-01-20T10:00:00Z'),
          teamId: 'team-1',
          createdBy: 'trainer-1',
        })
      );
    });

    it('should handle creation errors', async () => {
      // Arrange
      mockWorkoutService.createWorkoutSession.mockRejectedValue(
        new Error('Failed to create')
      );

      // Act
      const response = await request(app)
        .post('/workouts/sessions')
        .set('Authorization', 'Bearer test-token')
        .send({ title: 'Test' });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to create workout session',
      });
    });
  });

  describe('PUT /workouts/sessions/:id', () => {
    it('should update existing workout session', async () => {
      // Arrange
      const sessionId = 'session-1';
      const updateData = {
        title: 'Updated Training',
        status: 'completed',
        description: 'Updated description',
      };
      
      const updatedSession = createMockWorkoutSession({
        id: sessionId,
        ...updateData,
      });
      
      mockWorkoutService.updateWorkoutSession.mockResolvedValue(updatedSession);

      // Act
      const response = await request(app)
        .put(`/workouts/sessions/${sessionId}`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedSession,
      });
      expect(mockWorkoutService.updateWorkoutSession).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          title: 'Updated Training',
          status: 'completed',
        })
      );
    });

    it('should return 404 when session not found', async () => {
      // Arrange
      mockWorkoutService.updateWorkoutSession.mockRejectedValue(
        new Error('Workout session not found')
      );

      // Act
      const response = await request(app)
        .put('/workouts/sessions/non-existent')
        .set('Authorization', 'Bearer test-token')
        .send({ title: 'Updated' });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Workout session not found',
      });
    });
  });

  describe('DELETE /workouts/sessions/:id', () => {
    it('should delete workout session', async () => {
      // Arrange
      const sessionId = 'session-1';
      mockWorkoutService.deleteWorkoutSession.mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .delete(`/workouts/sessions/${sessionId}`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Workout session deleted successfully',
      });
      expect(mockWorkoutService.deleteWorkoutSession).toHaveBeenCalledWith(sessionId);
    });

    it('should return 404 when session not found', async () => {
      // Arrange
      mockWorkoutService.deleteWorkoutSession.mockRejectedValue(
        new Error('Workout session not found')
      );

      // Act
      const response = await request(app)
        .delete('/workouts/sessions/non-existent')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Workout session not found',
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should enforce correct roles for each endpoint', async () => {
      const authorizeSpy = authorize as jest.Mock;
      
      // Get sessions - physical_trainer, coach, admin, player
      await request(app).get('/workouts/sessions').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['physical_trainer', 'coach', 'admin', 'player']);
      
      // Get single session - includes parent
      await request(app).get('/workouts/sessions/1').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['physical_trainer', 'coach', 'admin', 'player', 'parent']);
      
      // Create session - only physical_trainer, coach, admin
      await request(app).post('/workouts/sessions').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['physical_trainer', 'coach', 'admin']);
      
      // Update session - only physical_trainer, coach, admin
      await request(app).put('/workouts/sessions/1').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['physical_trainer', 'coach', 'admin']);
      
      // Delete session - only physical_trainer, coach, admin
      await request(app).delete('/workouts/sessions/1').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['physical_trainer', 'coach', 'admin']);
    });
  });
});

// Helper function to create mock workout session
function createMockWorkoutSession(overrides?: Partial<any>): any {
  return {
    id: 'session-1',
    title: 'Test Workout Session',
    description: 'Test description',
    type: 'strength',
    status: 'scheduled',
    scheduledDate: new Date('2025-01-15T10:00:00Z'),
    completedDate: null,
    location: 'Gym A',
    duration: 60,
    estimatedDuration: 60,
    teamId: 'team-1',
    createdBy: 'trainer-1',
    settings: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    exercises: [],
    playerLoads: [],
    executions: [],
    ...overrides,
  };
}