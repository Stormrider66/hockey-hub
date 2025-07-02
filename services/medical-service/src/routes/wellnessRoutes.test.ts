import request from 'supertest';
import express from 'express';
import { MockFactory } from '@hockey-hub/shared-lib';
import wellnessRoutes from './wellnessRoutes';
import { CachedMedicalService } from '../services/CachedMedicalService';
import { CachedWellnessRepository } from '../repositories/CachedWellnessRepository';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../services/CachedMedicalService');
jest.mock('../repositories/CachedWellnessRepository');
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
  app.use('/wellness', wellnessRoutes);
  return app;
};

describe('Wellness Routes', () => {
  let app: express.Application;
  let mockMedicalService: jest.Mocked<CachedMedicalService>;
  let mockWellnessRepository: jest.Mocked<CachedWellnessRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    MockFactory.resetIdCounter();
    
    app = createTestApp();
    
    // Get mock instances
    mockMedicalService = new CachedMedicalService() as jest.Mocked<CachedMedicalService>;
    mockWellnessRepository = new CachedWellnessRepository() as jest.Mocked<CachedWellnessRepository>;
  });

  describe('POST /wellness/players/:playerId/wellness', () => {
    it('should submit wellness entry successfully', async () => {
      // Arrange
      const playerId = 101;
      const wellnessData = {
        sleepHours: 8,
        sleepQuality: 8,
        energyLevel: 7,
        stressLevel: 3,
        sorenessLevel: 2,
        hydrationLevel: 8,
        appetite: 8,
        mood: 7,
        heartRateVariability: 65,
        restingHeartRate: 60,
        notes: 'Feeling good',
      };
      
      const savedEntry = createMockWellnessEntry({ ...wellnessData, playerId, id: 1 });
      mockMedicalService.submitWellnessEntry.mockResolvedValue(savedEntry);

      // Act
      const response = await request(app)
        .post(`/wellness/players/${playerId}/wellness`)
        .set('Authorization', 'Bearer test-token')
        .send(wellnessData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Wellness data submitted successfully',
        data: savedEntry,
      });
      expect(mockMedicalService.submitWellnessEntry).toHaveBeenCalledWith({
        ...wellnessData,
        playerId,
      });
    });

    it('should handle validation errors from service', async () => {
      // Arrange
      const playerId = 101;
      mockMedicalService.submitWellnessEntry.mockRejectedValue(
        new Error('Sleep quality must be between 1 and 10')
      );

      // Act
      const response = await request(app)
        .post(`/wellness/players/${playerId}/wellness`)
        .set('Authorization', 'Bearer test-token')
        .send({ sleepQuality: 11 });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Sleep quality must be between 1 and 10',
      });
    });

    it('should authorize correct roles', async () => {
      // Arrange
      const authorizeSpy = authorize as jest.Mock;
      
      // Act
      await request(app)
        .post('/wellness/players/101/wellness')
        .set('Authorization', 'Bearer test-token')
        .send({});

      // Assert
      expect(authorizeSpy).toHaveBeenCalledWith(['player', 'medical_staff', 'admin']);
    });
  });

  describe('GET /wellness/players/:playerId/wellness', () => {
    it('should return paginated wellness history', async () => {
      // Arrange
      const playerId = 101;
      const wellnessEntries = [
        createMockWellnessEntry({ id: 1, playerId }),
        createMockWellnessEntry({ id: 2, playerId }),
      ];
      
      mockWellnessRepository.findByPlayerIdPaginated.mockResolvedValue({
        data: wellnessEntries,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      // Act
      const response = await request(app)
        .get(`/wellness/players/${playerId}/wellness`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: wellnessEntries,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
      expect(mockWellnessRepository.findByPlayerIdPaginated).toHaveBeenCalledWith(
        playerId,
        { page: 1, limit: 20, offset: 0 }
      );
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const playerId = 101;
      mockWellnessRepository.findByPlayerIdPaginated.mockResolvedValue({
        data: [],
        pagination: {
          total: 50,
          page: 3,
          limit: 10,
          pages: 5,
          hasNext: true,
          hasPrev: true,
        },
      });

      // Act
      const response = await request(app)
        .get(`/wellness/players/${playerId}/wellness?page=3&limit=10`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(3);
      expect(response.body.meta.limit).toBe(10);
      expect(mockWellnessRepository.findByPlayerIdPaginated).toHaveBeenCalledWith(
        playerId,
        { page: 3, limit: 10, offset: 20 }
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockWellnessRepository.findByPlayerIdPaginated.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const response = await request(app)
        .get('/wellness/players/101/wellness')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch wellness data',
      });
    });
  });

  describe('GET /wellness/players/:playerId/wellness/latest', () => {
    it('should return latest wellness entry', async () => {
      // Arrange
      const playerId = 101;
      const latestEntry = createMockWellnessEntry({ id: 1, playerId });
      mockWellnessRepository.findLatestByPlayerId.mockResolvedValue(latestEntry);

      // Act
      const response = await request(app)
        .get(`/wellness/players/${playerId}/wellness/latest`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: latestEntry,
      });
      expect(mockWellnessRepository.findLatestByPlayerId).toHaveBeenCalledWith(playerId);
    });

    it('should handle when no wellness data exists', async () => {
      // Arrange
      mockWellnessRepository.findLatestByPlayerId.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/wellness/players/101/wellness/latest')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: null,
      });
    });
  });

  describe('GET /wellness/players/:playerId/wellness/range', () => {
    it('should return wellness data for date range', async () => {
      // Arrange
      const playerId = 101;
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      const wellnessEntries = [
        createMockWellnessEntry({ id: 1, playerId, entryDate: new Date('2025-01-15') }),
        createMockWellnessEntry({ id: 2, playerId, entryDate: new Date('2025-01-20') }),
      ];
      
      mockWellnessRepository.findByPlayerIdAndDateRangePaginated.mockResolvedValue({
        data: wellnessEntries,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });

      // Act
      const response = await request(app)
        .get(`/wellness/players/${playerId}/wellness/range`)
        .query({ startDate, endDate })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockWellnessRepository.findByPlayerIdAndDateRangePaginated).toHaveBeenCalledWith(
        playerId,
        new Date(startDate),
        new Date(endDate),
        { page: 1, limit: 20, offset: 0 }
      );
    });

    it('should return 400 if date parameters are missing', async () => {
      // Act
      const response = await request(app)
        .get('/wellness/players/101/wellness/range')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Start date and end date are required',
      });
    });

    it('should handle invalid date formats', async () => {
      // Arrange
      mockWellnessRepository.findByPlayerIdAndDateRangePaginated.mockRejectedValue(
        new Error('Invalid date')
      );

      // Act
      const response = await request(app)
        .get('/wellness/players/101/wellness/range')
        .query({ startDate: 'invalid', endDate: 'invalid' })
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /wellness/team/wellness/summary', () => {
    it('should return team wellness summary', async () => {
      // Arrange
      const teamSummary = {
        averageSleepHours: 7.5,
        averageStressLevel: 4.2,
        averageEnergyLevel: 7.1,
        averageSorenessLevel: 3.8,
        playersReporting: 18,
        lastUpdated: new Date(),
        trends: {
          sleep: 'improving',
          stress: 'stable',
          energy: 'declining',
          soreness: 'improving',
        },
      };
      
      mockWellnessRepository.getTeamWellnessSummary.mockResolvedValue(teamSummary);

      // Act
      const response = await request(app)
        .get('/wellness/team/wellness/summary')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: teamSummary,
      });
    });

    it('should only allow authorized roles', async () => {
      // Arrange
      const authorizeSpy = authorize as jest.Mock;
      
      // Act
      await request(app)
        .get('/wellness/team/wellness/summary')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(authorizeSpy).toHaveBeenCalledWith(['medical_staff', 'admin', 'coach']);
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockWellnessRepository.getTeamWellnessSummary.mockRejectedValue(
        new Error('Failed to calculate summary')
      );

      // Act
      const response = await request(app)
        .get('/wellness/team/wellness/summary')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch team wellness summary',
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should enforce correct role-based access', async () => {
      const authorizeSpy = authorize as jest.Mock;
      
      // Submit wellness - player, medical_staff, admin
      await request(app).post('/wellness/players/101/wellness').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['player', 'medical_staff', 'admin']);
      
      // Get wellness history - includes parent and coach
      await request(app).get('/wellness/players/101/wellness').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['player', 'parent', 'medical_staff', 'admin', 'coach']);
      
      // Team summary - only medical_staff, admin, coach
      await request(app).get('/wellness/team/wellness/summary').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['medical_staff', 'admin', 'coach']);
    });
  });
});

// Helper function to create mock wellness entry
function createMockWellnessEntry(overrides?: Partial<any>): any {
  return {
    id: 1,
    playerId: 101,
    entryDate: new Date(),
    sleepHours: 8,
    sleepQuality: 8,
    energyLevel: 7,
    stressLevel: 3,
    sorenessLevel: 2,
    hydrationLevel: 8,
    appetite: 8,
    mood: 7,
    heartRateVariability: 65,
    restingHeartRate: 60,
    notes: 'Test wellness entry',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}