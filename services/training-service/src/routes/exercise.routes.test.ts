import request from 'supertest';
import express from 'express';
import { exerciseRoutes } from './exercise.routes';
import { ExerciseService } from '../services/ExerciseService';
import { authMiddleware } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../services/ExerciseService');
jest.mock('@hockey-hub/shared-lib', () => ({
  validationMiddleware: () => (req: any, res: any, next: any) => next(),
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      organizationId: 'test-org-id',
      roles: ['coach']
    };
    next();
  },
  RequestWithUser: {},
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('Exercise Routes', () => {
  let app: express.Application;
  let mockExerciseService: jest.Mocked<ExerciseService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/training', exerciseRoutes);
    
    mockExerciseService = new ExerciseService() as jest.Mocked<ExerciseService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/training/exercises', () => {
    it('should return a list of exercises', async () => {
      const mockExercises = [
        { id: '1', name: 'Squat', category: 'strength' },
        { id: '2', name: 'Bench Press', category: 'strength' }
      ];

      mockExerciseService.findAll = jest.fn().mockResolvedValue({
        data: mockExercises,
        total: 2
      });

      const response = await request(app)
        .get('/api/v1/training/exercises')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockExercises,
        total: 2,
        skip: 0,
        take: 50
      });
    });

    it('should filter exercises by category', async () => {
      const mockExercises = [
        { id: '1', name: 'Running', category: 'cardio' }
      ];

      mockExerciseService.findAll = jest.fn().mockResolvedValue({
        data: mockExercises,
        total: 1
      });

      const response = await request(app)
        .get('/api/v1/training/exercises?category=cardio')
        .expect(200);

      expect(mockExerciseService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'cardio' })
      );
    });
  });

  describe('POST /api/v1/training/exercises', () => {
    it('should create a new exercise', async () => {
      const newExercise = {
        name: 'Deadlift',
        category: 'strength',
        primaryUnit: 'kilograms'
      };

      const createdExercise = {
        id: '123',
        ...newExercise,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id'
      };

      mockExerciseService.create = jest.fn().mockResolvedValue(createdExercise);

      const response = await request(app)
        .post('/api/v1/training/exercises')
        .send(newExercise)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: createdExercise
      });
    });

    it('should return 403 for users without coach role', async () => {
      // Override auth middleware for this test
      jest.resetModules();
      jest.doMock('@hockey-hub/shared-lib', () => ({
        validationMiddleware: () => (req: any, res: any, next: any) => next(),
        authMiddleware: (req: any, res: any, next: any) => {
          req.user = {
            id: 'test-user-id',
            organizationId: 'test-org-id',
            roles: ['player'] // Not a coach
          };
          next();
        }
      }));

      const response = await request(app)
        .post('/api/v1/training/exercises')
        .send({
          name: 'Test Exercise',
          category: 'strength',
          primaryUnit: 'kilograms'
        })
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions to create exercises');
    });
  });

  describe('GET /api/v1/training/exercises/:id', () => {
    it('should return a specific exercise', async () => {
      const mockExercise = {
        id: '123',
        name: 'Squat',
        category: 'strength'
      };

      mockExerciseService.findById = jest.fn().mockResolvedValue(mockExercise);

      const response = await request(app)
        .get('/api/v1/training/exercises/123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockExercise
      });
    });

    it('should return 404 for non-existent exercise', async () => {
      const error = new Error('Exercise not found: 999');
      (error as any).statusCode = 404;
      
      mockExerciseService.findById = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .get('/api/v1/training/exercises/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Exercise not found: 999'
      });
    });
  });

  describe('PUT /api/v1/training/exercises/:id', () => {
    it('should update an exercise', async () => {
      const updateData = {
        name: 'Updated Squat',
        description: 'Updated description'
      };

      const updatedExercise = {
        id: '123',
        ...updateData,
        category: 'strength'
      };

      mockExerciseService.update = jest.fn().mockResolvedValue(updatedExercise);

      const response = await request(app)
        .put('/api/v1/training/exercises/123')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedExercise
      });
    });
  });

  describe('DELETE /api/v1/training/exercises/:id', () => {
    it('should delete an exercise', async () => {
      mockExerciseService.delete = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/v1/training/exercises/123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Exercise deleted successfully'
      });
    });
  });
});