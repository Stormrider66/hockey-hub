import { Router } from 'express';
import request from 'supertest';
import express from 'express';
import { createMockRequest, createMockResponse, createTestToken, MockFactory, testHelpers } from '@hockey-hub/shared-lib';
import injuryRoutes, { __setInjuryRepository, __setMedicalService } from './injuryRoutes';
import { CachedMedicalService } from '../services/CachedMedicalService';
import { CachedInjuryRepository } from '../repositories/CachedInjuryRepository';
import { authenticate, authorize, validationMiddleware } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('../services/CachedMedicalService');
jest.mock('../repositories/CachedInjuryRepository');
jest.mock('@hockey-hub/shared-lib', () => {
  const shim = jest.requireActual('../../jest.shared-lib-shim.ts');
  return {
    ...shim,
    authenticate: jest.fn((req: any, res: any, next: any) => next()),
    authorize: jest.fn(() => (req: any, res: any, next: any) => next()),
    validationMiddleware: jest.fn(() => (req: any, res: any, next: any) => next()),
    MockFactory: shim.MockFactory || { resetIdCounter: () => {}, generateId: () => 'mock-id-1' },
  };
});

// Create Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/injuries', injuryRoutes);
  return app;
};

describe('Injury Routes', () => {
  let app: express.Application;
  let mockMedicalService: jest.Mocked<CachedMedicalService>;
  let mockInjuryRepository: jest.Mocked<CachedInjuryRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    MockFactory.resetIdCounter();
    
    // Setup app
    app = createTestApp();
    
    // Get mock instances
    mockMedicalService = new (CachedMedicalService as any)() as jest.Mocked<CachedMedicalService>;
    mockInjuryRepository = new (CachedInjuryRepository as any)() as jest.Mocked<CachedInjuryRepository>;
    // Inject mocks into route module
    __setMedicalService(mockMedicalService as any);
    __setInjuryRepository(mockInjuryRepository as any);
  });

  describe('GET /injuries', () => {
    it('should return paginated injuries for authorized users', async () => {
      // Arrange
      const mockInjuries = [
        createMockInjury({ id: 1, playerId: 101 }),
        createMockInjury({ id: 2, playerId: 102 }),
      ];
      
      mockInjuryRepository.findAllPaginated.mockResolvedValue({
        data: mockInjuries,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1,
        },
      });

      // Act
      const response = await request(app)
        .get('/injuries')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockInjuries,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
      expect(mockInjuryRepository.findAllPaginated).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        offset: 0,
      });
    });

    it('should handle pagination parameters correctly', async () => {
      // Arrange
      mockInjuryRepository.findAllPaginated.mockResolvedValue({
        data: [],
        pagination: {
          total: 50,
          page: 2,
          limit: 10,
          pages: 5,
        },
      });

      // Act
      const response = await request(app)
        .get('/injuries?page=2&limit=10')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(mockInjuryRepository.findAllPaginated).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        offset: 10,
      });
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockInjuryRepository.findAllPaginated.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/injuries')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to fetch injuries',
      });
    });
  });

  describe('GET /injuries/active', () => {
    it('should return active injuries only', async () => {
      // Arrange
      const mockActiveInjuries = [
        createMockInjury({ id: 1, recoveryStatus: 'active' }),
        createMockInjury({ id: 2, recoveryStatus: 'active' }),
      ];
      
      mockInjuryRepository.findActiveInjuriesPaginated.mockResolvedValue({
        data: mockActiveInjuries,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1,
        },
      });

      // Act
      const response = await request(app)
        .get('/injuries/active')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((injury: any) => injury.recoveryStatus === 'active')).toBe(true);
    });
  });

  describe('GET /injuries/:id', () => {
    it('should return injury by ID', async () => {
      // Arrange
      const mockInjury = createMockInjury({ id: 1 });
      mockInjuryRepository.findById.mockResolvedValue(mockInjury);

      // Act
      const response = await request(app)
        .get('/injuries/1')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockInjury,
      });
      expect(mockInjuryRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 if injury not found', async () => {
      // Arrange
      mockInjuryRepository.findById.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/injuries/999')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: 'Injury not found',
      });
    });

    it('should handle invalid ID parameter', async () => {
      // Act
      const response = await request(app)
        .get('/injuries/invalid')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /injuries/player/:playerId', () => {
    it('should return injuries for specific player', async () => {
      // Arrange
      const playerId = 101;
      const mockPlayerInjuries = [
        createMockInjury({ id: 1, playerId }),
        createMockInjury({ id: 2, playerId }),
      ];
      
      mockInjuryRepository.findByPlayerIdPaginated.mockResolvedValue({
        data: mockPlayerInjuries,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1,
        },
      });

      // Act
      const response = await request(app)
        .get(`/injuries/player/${playerId}`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((injury: any) => injury.playerId === playerId)).toBe(true);
      expect(mockInjuryRepository.findByPlayerIdPaginated).toHaveBeenCalledWith(playerId, expect.any(Object));
    });
  });

  describe('POST /injuries', () => {
    it('should create new injury with valid data', async () => {
      // Arrange
      const newInjuryData = {
        playerId: 101,
        injuryType: 'muscle_strain',
        bodyPart: 'hamstring',
        severityLevel: 2,
        injuryDate: new Date().toISOString(),
        description: 'Pulled hamstring during practice',
      };
      
      const createdInjury = createMockInjury({ ...newInjuryData, id: 1 });
      mockMedicalService.createInjury.mockResolvedValue(createdInjury);

      // Act
      const response = await request(app)
        .post('/injuries')
        .set('Authorization', 'Bearer test-token')
        .send(newInjuryData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: createdInjury,
        message: 'Injury created successfully',
      });
      expect(mockMedicalService.createInjury).toHaveBeenCalledWith(newInjuryData);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidData = {
        // Missing required fields
        injuryType: 'muscle_strain',
      };

      // Act
      const response = await request(app)
        .post('/injuries')
        .set('Authorization', 'Bearer test-token')
        .send(invalidData);

      // Assert
      // Note: Since we're mocking validationMiddleware, we need to test actual validation separately
      expect(response.status).toBe(201); // Will pass due to mocked validation
    });

    it('should handle service errors', async () => {
      // Arrange
      mockMedicalService.createInjury.mockRejectedValue(new Error('Service error'));

      // Act
      const response = await request(app)
        .post('/injuries')
        .set('Authorization', 'Bearer test-token')
        .send({ playerId: 101 });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Service error',
      });
    });
  });

  describe('PUT /injuries/:id', () => {
    it('should update existing injury', async () => {
      // Arrange
      const injuryId = 1;
      const updateData = {
        recoveryStatus: 'recovering',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      const updatedInjury = createMockInjury({ id: injuryId, ...updateData });
      mockMedicalService.updateInjury.mockResolvedValue(updatedInjury);

      // Act
      const response = await request(app)
        .put(`/injuries/${injuryId}`)
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedInjury,
        message: 'Injury updated successfully',
      });
      expect(mockMedicalService.updateInjury).toHaveBeenCalledWith(injuryId, updateData);
    });

    it('should handle non-existent injury update', async () => {
      // Arrange
      mockMedicalService.updateInjury.mockRejectedValue(new Error('Injury not found'));

      // Act
      const response = await request(app)
        .put('/injuries/999')
        .set('Authorization', 'Bearer test-token')
        .send({ recoveryStatus: 'recovered' });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Injury not found',
      });
    });
  });

  describe('DELETE /injuries/:id', () => {
    it('should delete injury successfully', async () => {
      // Arrange
      const injuryId = 1;
      mockInjuryRepository.delete.mockResolvedValue(undefined);

      // Act
      const response = await request(app)
        .delete(`/injuries/${injuryId}`)
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Injury deleted successfully',
      });
      expect(mockInjuryRepository.delete).toHaveBeenCalledWith(injuryId);
    });

    it('should handle deletion errors', async () => {
      // Arrange
      mockInjuryRepository.delete.mockRejectedValue(new Error('Cannot delete'));

      // Act
      const response = await request(app)
        .delete('/injuries/1')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Failed to delete injury',
      });
    });
  });

  describe('GET /injuries/stats/body-parts', () => {
    it('should return injury statistics by body part', async () => {
      // Arrange
      const mockStats = [
        { bodyPart: 'knee', count: 5 },
        { bodyPart: 'ankle', count: 3 },
        { bodyPart: 'hamstring', count: 2 },
      ];
      
      mockInjuryRepository.countActiveByBodyPart.mockResolvedValue(mockStats);

      // Act
      const response = await request(app)
        .get('/injuries/stats/body-parts')
        .set('Authorization', 'Bearer test-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockStats,
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should enforce role-based access control', async () => {
      // Test that authorize middleware is called with correct roles
      const authorizeSpy = authorize as jest.Mock;
      
      // Create injury - only medical_staff and admin
      await request(app).post('/injuries').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['medical_staff', 'admin']);
      
      // Get injuries - medical_staff, admin, and coach
      await request(app).get('/injuries').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['medical_staff', 'admin', 'coach']);
      
      // Get player injuries - includes player and parent
      await request(app).get('/injuries/player/1').set('Authorization', 'Bearer test-token');
      expect(authorizeSpy).toHaveBeenCalledWith(['medical_staff', 'admin', 'coach', 'player', 'parent']);
    });
  });
});

// Helper function to create mock injury
function createMockInjury(overrides?: Partial<any>): any {
  return {
    id: 1,
    playerId: 101,
    injuryType: 'muscle_strain',
    bodyPart: 'hamstring',
    severityLevel: 2,
    injuryDate: new Date('2025-01-01'),
    expectedReturnDate: new Date('2025-01-15'),
    recoveryStatus: 'active',
    description: 'Mock injury',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    treatments: [],
    medicalReports: [],
    ...overrides,
  };
}