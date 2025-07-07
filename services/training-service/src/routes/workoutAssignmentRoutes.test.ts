import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../config/database';
import workoutAssignmentRoutes from './workoutAssignmentRoutes';
import { WorkoutAssignmentService } from '../services/WorkoutAssignmentService';
import { authenticate } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../services/WorkoutAssignmentService');
jest.mock('@hockey-hub/shared-lib', () => ({
  ...jest.requireActual('@hockey-hub/shared-lib'),
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: 'test-user', role: 'physical_trainer', organizationId: 'test-org' };
    next();
  }),
  authorize: jest.fn((roles) => (req, res, next) => next()),
  validationMiddleware: jest.fn(() => (req, res, next) => next()),
  parsePaginationParams: jest.fn((query) => ({ page: 1, limit: 20 }))
}));

describe('Workout Assignment Routes', () => {
  let app: express.Application;
  let mockAssignmentService: jest.Mocked<WorkoutAssignmentService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/training/workouts', workoutAssignmentRoutes);

    // Mock database connection
    (AppDataSource.isInitialized as any) = true;

    // Mock service methods
    mockAssignmentService = new WorkoutAssignmentService() as jest.Mocked<WorkoutAssignmentService>;
    (WorkoutAssignmentService as jest.MockedClass<typeof WorkoutAssignmentService>).mockImplementation(() => mockAssignmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/training/workouts/bulk-assign', () => {
    it('should create bulk assignments successfully', async () => {
      const mockResult = {
        created: 5,
        failed: 0,
        conflicts: [],
        assignments: []
      };

      mockAssignmentService.bulkAssign = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/training/workouts/bulk-assign')
        .send({
          workoutSessionId: '123e4567-e89b-12d3-a456-426614174000',
          assignmentType: 'team',
          assignmentTarget: {
            teamId: 'team-123'
          },
          effectiveDate: '2024-01-01',
          scheduledDate: '2024-01-01T10:00:00Z'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
    });

    it('should return 400 if organization ID is missing', async () => {
      const mockAuth = authenticate as jest.MockedFunction<any>;
      mockAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'test-user', role: 'physical_trainer' };
        next();
      });

      const response = await request(app)
        .post('/api/v1/training/workouts/bulk-assign')
        .send({
          workoutSessionId: '123e4567-e89b-12d3-a456-426614174000',
          assignmentType: 'team',
          assignmentTarget: { teamId: 'team-123' },
          effectiveDate: '2024-01-01',
          scheduledDate: '2024-01-01T10:00:00Z'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Organization ID is required');
    });
  });

  describe('GET /api/v1/training/workouts/conflicts', () => {
    it('should check for conflicts successfully', async () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          playerId: 'player-123',
          conflictType: 'scheduling',
          details: {
            message: 'Player already has assignment',
            severity: 'medium',
            resolutionOptions: ['skip', 'replace']
          }
        }
      ];

      mockAssignmentService.checkConflicts = jest.fn().mockResolvedValue(mockConflicts);

      const response = await request(app)
        .get('/api/v1/training/workouts/conflicts')
        .query({
          playerIds: 'player-123',
          startDate: '2024-01-01',
          endDate: '2024-01-07'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockConflicts);
    });
  });

  describe('GET /api/v1/training/workouts/assignments/:playerId', () => {
    it('should get player assignments successfully', async () => {
      const mockAssignments = [
        {
          id: 'assignment-1',
          playerId: 'player-123',
          workoutSessionId: 'session-123',
          status: 'active'
        }
      ];

      mockAssignmentService.getPlayerAssignments = jest.fn().mockResolvedValue(mockAssignments);

      const response = await request(app)
        .get('/api/v1/training/workouts/assignments/player-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAssignments);
    });

    it('should return 403 for players viewing other player assignments', async () => {
      const mockAuth = authenticate as jest.MockedFunction<any>;
      mockAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'player-456', role: 'player' };
        next();
      });

      const response = await request(app)
        .get('/api/v1/training/workouts/assignments/player-123');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized to view other player assignments');
    });
  });

  describe('PUT /api/v1/training/workouts/assignments/:id/override', () => {
    it('should create player override successfully', async () => {
      const mockOverride = {
        id: 'override-1',
        playerId: 'player-123',
        overrideType: 'medical',
        status: 'approved'
      };

      mockAssignmentService.createPlayerOverride = jest.fn().mockResolvedValue(mockOverride);

      const response = await request(app)
        .put('/api/v1/training/workouts/assignments/assignment-123/override')
        .send({
          playerId: 'player-123',
          overrideType: 'medical',
          effectiveDate: '2024-01-01',
          modifications: {
            loadMultiplier: 0.8,
            exempt: false
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockOverride);
    });
  });
});