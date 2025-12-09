import { CachedWorkoutSessionService } from './CachedWorkoutSessionService';
import { CachedWorkoutSessionRepository } from '../repositories/CachedWorkoutSessionRepository';
import { AppDataSource } from '../config/database';
import { WorkoutSession, Exercise, PlayerWorkoutLoad } from '../entities';
import { RedisCacheManager } from '@hockey-hub/shared-lib';

// Mock dependencies
// Mock repository and its base class dependencies
jest.mock('../repositories/CachedWorkoutSessionRepository');
jest.mock('../config/database');
jest.mock('@hockey-hub/shared-lib', () => {
  return {
    RedisCacheManager: {
      getInstance: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        deletePattern: jest.fn(),
      })),
    },
    // Provide minimal CacheKeyBuilder and CachedRepository so the import chain resolves
    CacheKeyBuilder: {
      build: (...parts: any[]) => parts.join(':'),
    },
    CachedRepository: class {},
  } as any;
});

describe('CachedWorkoutSessionService', () => {
  let service: CachedWorkoutSessionService;
  let mockWorkoutRepository: jest.Mocked<CachedWorkoutSessionRepository>;
  let mockExerciseRepository: any;
  let mockPlayerLoadRepository: any;
  let mockCacheManager: jest.Mocked<RedisCacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock repositories
    mockExerciseRepository = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    
    mockPlayerLoadRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };
    
    // Mock AppDataSource
    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Exercise) return mockExerciseRepository;
      if (entity === PlayerWorkoutLoad) return mockPlayerLoadRepository;
      if (entity && (entity as any).name === 'WorkoutSession') {
        return {
          create: jest.fn((x) => ({ id: 'workout-1', ...x })),
          save: jest.fn((x) => Promise.resolve({ id: 'workout-1', ...x })),
          remove: jest.fn((x) => Promise.resolve(x)),
        } as any;
      }
    });
    
    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
    } as any;
    
    (RedisCacheManager.getInstance as jest.Mock).mockReturnValue(mockCacheManager);
    
    // Create service instance (after resetting module cache)
    jest.resetModules();
    service = new CachedWorkoutSessionService();
    mockWorkoutRepository = (service as any).workoutRepository as jest.Mocked<CachedWorkoutSessionRepository>;
    // Ensure mocked methods exist and are tracked
    (mockWorkoutRepository as any).create = jest.fn();
    (mockWorkoutRepository as any).save = jest.fn();
    (mockWorkoutRepository as any).remove = jest.fn();
    // Ensure mocked methods exist
    (mockWorkoutRepository as any).create = (mockWorkoutRepository as any).create || jest.fn();
    (mockWorkoutRepository as any).save = (mockWorkoutRepository as any).save || jest.fn();
    (mockWorkoutRepository as any).findWithCompleteDetails = (mockWorkoutRepository as any).findWithCompleteDetails || jest.fn();
  });

  describe('createWorkoutSession', () => {
    it('should create workout session with exercises and player loads', async () => {
      // Arrange
      const workoutData = {
        title: 'Morning Training',
        description: 'High intensity workout',
        type: 'strength',
        scheduledDate: new Date('2025-01-20'),
        location: 'Gym A',
        teamId: 'team-1',
        playerIds: ['player-1', 'player-2'],
        createdBy: 'trainer-1',
        exercises: [
          {
            name: 'Squats',
            type: 'strength',
            sets: 3,
            reps: 10,
            weight: 100,
            restPeriod: 90,
            equipment: ['barbell'],
            targetMuscles: ['quadriceps', 'glutes'],
          },
          {
            name: 'Deadlifts',
            type: 'strength',
            sets: 3,
            reps: 8,
            weight: 120,
            restPeriod: 120,
          },
        ],
        playerLoads: [
          {
            playerId: 'player-1',
            loadModifier: 1.0,
            notes: 'Full intensity',
          },
          {
            playerId: 'player-2',
            loadModifier: 0.8,
            notes: 'Recovering from injury',
          },
        ],
        estimatedDuration: 75,
      };
      
      const createdWorkout = createMockWorkoutSession({ id: 'workout-1' });
      const createdExercises = workoutData.exercises.map((ex, idx) => ({ ...ex, id: `ex-${idx}` }));
      const createdLoads = workoutData.playerLoads.map((load, idx) => ({ ...load, id: `load-${idx}` }));
      
      mockWorkoutRepository.create.mockReturnValue(createdWorkout);
      mockWorkoutRepository.save.mockResolvedValue(createdWorkout);
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue({
        ...createdWorkout,
        exercises: createdExercises,
        playerLoads: createdLoads,
      } as any);
      
      mockExerciseRepository.create.mockImplementation(data => data);
      mockExerciseRepository.save.mockResolvedValue(createdExercises);
      
      mockPlayerLoadRepository.create.mockImplementation(data => data);
      mockPlayerLoadRepository.save.mockResolvedValue(createdLoads);

      // Act
      const result = await service.createWorkoutSession(workoutData);

      // Assert
      expect(mockWorkoutRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Morning Training',
          type: 'strength',
          teamId: 'team-1',
          status: 'SCHEDULED',
          estimatedDuration: 75,
        })
      );
      
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Squats',
            orderIndex: 0,
            workoutSessionId: 'workout-1',
          }),
          expect.objectContaining({
            name: 'Deadlifts',
            orderIndex: 1,
            workoutSessionId: 'workout-1',
          }),
        ])
      );
      
      expect(mockPlayerLoadRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            playerId: 'player-1',
            loadModifier: 1.0,
            workoutSessionId: 'workout-1',
          }),
        ])
      );
      
      expect(result.exercises).toHaveLength(2);
      expect(result.playerLoads).toHaveLength(2);
    });

    it('should use default settings if not provided', async () => {
      // Arrange
      const minimalData = {
        title: 'Test Workout',
        type: 'cardio',
        scheduledDate: new Date(),
        teamId: 'team-1',
        playerIds: [],
        createdBy: 'trainer-1',
      };
      
      mockWorkoutRepository.create.mockReturnValue({} as any);
      mockWorkoutRepository.save.mockResolvedValue({ id: 'workout-1' } as any);
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(createMockWorkoutSession());

      // Act
      await service.createWorkoutSession(minimalData);

      // Assert
      expect(mockWorkoutRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            allowIndividualLoads: true,
            displayMode: 'grid',
            showMetrics: true,
            autoRotation: false,
            rotationInterval: 30,
          },
          estimatedDuration: 60,
        })
      );
    });
  });

  describe('updateWorkoutSession', () => {
    it('should update workout session and replace exercises', async () => {
      // Arrange
      const workoutId = 'workout-1';
      const existingWorkout = createMockWorkoutSession({ id: workoutId, title: 'Old Title' });
      const updateData = {
        title: 'Updated Title',
        status: 'IN_PROGRESS',
        exercises: [
          { name: 'New Exercise 1', type: 'cardio' },
          { name: 'New Exercise 2', type: 'cardio' },
        ],
      };
      
      mockWorkoutRepository.findWithCompleteDetails
        .mockResolvedValueOnce(existingWorkout)
        .mockResolvedValueOnce({ ...existingWorkout, ...updateData } as any);
      mockWorkoutRepository.save.mockResolvedValue({ ...existingWorkout, ...updateData });
      mockExerciseRepository.delete.mockResolvedValue({});
      mockExerciseRepository.create.mockImplementation(data => data);
      mockExerciseRepository.save.mockResolvedValue([]);

      // Act
      const result = await service.updateWorkoutSession(workoutId, updateData);

      // Assert
      expect(mockWorkoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          status: 'IN_PROGRESS',
        })
      );
      
      expect(mockExerciseRepository.delete).toHaveBeenCalledWith({ workoutSessionId: workoutId });
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'New Exercise 1',
            orderIndex: 0,
            workoutSessionId: workoutId,
          }),
        ])
      );
    });

    it('should throw error if workout not found', async () => {
      // Arrange
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateWorkoutSession('non-existent', {})).rejects.toThrow('Workout session not found');
    });

    it('should merge settings when updating', async () => {
      // Arrange
      const existingWorkout = createMockWorkoutSession({
        id: 'workout-1',
        settings: {
          allowIndividualLoads: true,
          displayMode: 'grid',
          showMetrics: true,
          autoRotation: false,
          rotationInterval: 30,
        },
      });
      
      const updateData = {
        settings: {
          displayMode: 'list' as const,
          autoRotation: true,
        },
      };
      
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(existingWorkout);
      mockWorkoutRepository.save.mockResolvedValue(existingWorkout);

      // Act
      await service.updateWorkoutSession('workout-1', updateData);

      // Assert
      expect(mockWorkoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            allowIndividualLoads: true,
            displayMode: 'list',
            showMetrics: true,
            autoRotation: true,
            rotationInterval: 30,
          },
        })
      );
    });
  });

  describe('deleteWorkoutSession', () => {
    it('should delete existing workout session', async () => {
      // Arrange
      const workout = createMockWorkoutSession({ id: 'workout-1' });
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(workout);
      mockWorkoutRepository.remove.mockResolvedValue(workout);

      // Act
      await service.deleteWorkoutSession('workout-1');

      // Assert
      expect(mockWorkoutRepository.remove).toHaveBeenCalledWith(workout);
    });

    it('should throw error if workout not found', async () => {
      // Arrange
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteWorkoutSession('non-existent')).rejects.toThrow('Workout session not found');
    });
  });

  describe('getWorkoutSessionById', () => {
    it('should return workout session with complete details', async () => {
      // Arrange
      const workout = createMockWorkoutSession({ id: 'workout-1' });
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(workout);

      // Act
      const result = await service.getWorkoutSessionById('workout-1');

      // Assert
      expect(result).toEqual(workout);
      expect(mockWorkoutRepository.findWithCompleteDetails).toHaveBeenCalledWith('workout-1');
    });

    it('should throw error if session not found', async () => {
      // Arrange
      mockWorkoutRepository.findWithCompleteDetails.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getWorkoutSessionById('non-existent')).rejects.toThrow('Workout session not found');
    });
  });

  describe('getWorkoutSessions', () => {
    it('should use cached repository for team-based queries', async () => {
      // Arrange
      const teamId = 'team-1';
      const sessions = [createMockWorkoutSession({ id: '1' }), createMockWorkoutSession({ id: '2' })];
      mockWorkoutRepository.findSessionsByTeam.mockResolvedValue([sessions, 10]);

      // Act
      const result = await service.getWorkoutSessions({ teamId }, 1, 5);

      // Assert
      expect(result).toEqual({
        data: sessions,
        pagination: {
          page: 1,
          limit: 5,
          total: 10,
          totalPages: 2,
        },
      });
      expect(mockWorkoutRepository.findSessionsByTeam).toHaveBeenCalledWith(teamId, 1, 5);
    });

    it('should use cached repository for player-based queries', async () => {
      // Arrange
      const playerId = 'player-1';
      const sessions = [createMockWorkoutSession({ id: '1' })];
      mockWorkoutRepository.findSessionsByPlayer.mockResolvedValue([sessions, 1]);

      // Act
      const result = await service.getWorkoutSessions({ playerId }, 2, 10);

      // Assert
      expect(result.data).toEqual(sessions);
      expect(result.pagination.page).toBe(2);
      expect(mockWorkoutRepository.findSessionsByPlayer).toHaveBeenCalledWith(playerId, 2, 10);
    });

    it('should handle date-based queries with pagination', async () => {
      // Arrange
      const date = new Date('2025-01-15');
      const sessions = Array(25).fill(null).map((_, i) => createMockWorkoutSession({ id: `${i}` }));
      mockWorkoutRepository.findSessionsByDate.mockResolvedValue(sessions);

      // Act
      const result = await service.getWorkoutSessions({ date }, 2, 10);

      // Assert
      expect(result.data).toHaveLength(10);
      expect(result.data[0].id).toBe('10'); // Second page starts at index 10
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });
});

// Helper function to create mock workout session
function createMockWorkoutSession(overrides?: Partial<WorkoutSession>): WorkoutSession {
  return {
    id: 'workout-1',
    title: 'Test Workout',
    description: 'Test description',
    type: 'strength',
    status: 'SCHEDULED',
    scheduledDate: new Date('2025-01-20'),
    completedDate: null,
    location: 'Gym A',
    duration: null,
    estimatedDuration: 60,
    teamId: 'team-1',
    playerIds: ['player-1', 'player-2'],
    createdBy: 'trainer-1',
    settings: {
      allowIndividualLoads: true,
      displayMode: 'grid',
      showMetrics: true,
      autoRotation: false,
      rotationInterval: 30,
    },
    organizationId: 'org-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUser: null as any,
    updatedByUser: null as any,
    deletedAt: null,
    deletedBy: null,
    lastRequestId: null,
    lastIpAddress: null,
    exercises: [],
    playerLoads: [],
    executions: [],
    ...overrides,
  } as WorkoutSession;
}