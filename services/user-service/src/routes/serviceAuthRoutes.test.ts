import request from 'supertest';
import express from 'express';
import serviceAuthRoutes from './serviceAuthRoutes';
import { ServiceApiKeyService } from '../services/serviceApiKeyService';
import { extractUser, requireAuth, requirePermission } from '../middleware/authMiddleware';

// Mock dependencies
jest.mock('../services/serviceApiKeyService');
jest.mock('../middleware/authMiddleware');

describe('Service Auth Routes', () => {
  let app: express.Express;
  let mockApiKeyService: jest.Mocked<ServiceApiKeyService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api/service-auth', serviceAuthRoutes);

    // Mock middleware
    (extractUser as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = { 
        id: 'admin-user-id', 
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['admin:all']
      };
      next();
    });

    (requireAuth as jest.Mock).mockImplementation((req: any, res: any, next: any) => next());
    (requirePermission as jest.Mock).mockImplementation(() => (req: any, res: any, next: any) => next());

    // Mock ServiceApiKeyService
    mockApiKeyService = {
      validateApiKey: jest.fn(),
      createApiKey: jest.fn(),
      listApiKeys: jest.fn(),
      rotateApiKey: jest.fn(),
      revokeApiKey: jest.fn(),
      getApiKeyStats: jest.fn(),
    } as any;

    (ServiceApiKeyService as jest.Mock).mockImplementation(() => mockApiKeyService);
  });

  describe('POST /api/service-auth/validate', () => {
    it('should validate a valid API key', async () => {
      const mockValidation = {
        valid: true,
        service: {
          id: 'key-1',
          serviceName: 'calendar-service',
          apiKey: 'cal_test_key_123',
          permissions: ['read:events', 'write:events'],
          allowedIps: ['*'],
          isActive: true,
          usageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockApiKeyService.validateApiKey.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/service-auth/validate')
        .set('X-API-Key', 'valid-api-key')
        .set('X-Forwarded-For', '192.168.1.1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockValidation);
      expect(mockApiKeyService.validateApiKey).toHaveBeenCalledWith('valid-api-key', '192.168.1.1');
    });

    it('should reject invalid API key', async () => {
      mockApiKeyService.validateApiKey.mockResolvedValue({ valid: false, error: 'Invalid API key' });

      const response = await request(app)
        .post('/api/service-auth/validate')
        .set('X-API-Key', 'invalid-api-key');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        valid: false,
        error: 'Invalid API key'
      });
    });

    it('should handle missing API key', async () => {
      const response = await request(app)
        .post('/api/service-auth/validate');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        valid: false,
        error: 'API key required'
      });
    });
  });

  describe('GET /api/service-auth/keys', () => {
    it('should list all API keys for admin', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          serviceName: 'calendar-service',
          apiKey: 'hh_cal_key_123',
          permissions: ['read:events', 'write:events'],
          allowedIps: ['*'],
          isActive: true,
          usageCount: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsedAt: new Date()
        },
        {
          id: 'key-2',
          serviceName: 'training-service',
          apiKey: 'hh_tra_key_456',
          permissions: ['read:sessions', 'write:sessions'],
          allowedIps: ['192.168.1.0/24'],
          isActive: true,
          usageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsedAt: undefined
        }
      ];

      mockApiKeyService.listApiKeys.mockResolvedValue(mockKeys);

      const response = await request(app)
        .get('/api/service-auth/keys')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ keys: mockKeys });
      expect(extractUser).toHaveBeenCalled();
      expect(requirePermission).toHaveBeenCalled();
    });

    it('should require admin permission', async () => {
      (requirePermission as jest.Mock).mockImplementationOnce(() => (req: any, res: any) => {
        res.status(403).json({ message: 'Insufficient permissions' });
      });

      const response = await request(app)
        .get('/api/service-auth/keys')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/service-auth/keys', () => {
    it('should create new API key', async () => {
      const createData = {
        serviceName: 'new-service',
        description: 'New service API key',
        permissions: ['read:data', 'write:data'],
        ipWhitelist: ['192.168.1.0/24']
      };

      const mockNewKey = {
        id: 'new-key-id',
        serviceName: createData.serviceName,
        apiKey: 'srv_1234567890abcdef',
        permissions: createData.permissions,
        allowedIps: createData.ipWhitelist || ['*'],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockApiKeyService.createApiKey.mockResolvedValue(mockNewKey);

      const response = await request(app)
        .post('/api/service-auth/keys')
        .set('Authorization', 'Bearer admin-token')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'API key created successfully',
        key: mockNewKey
      });
      expect(mockApiKeyService.createApiKey).toHaveBeenCalledWith({
        serviceName: createData.serviceName,
        description: createData.description,
        permissions: createData.permissions,
        allowedIps: createData.ipWhitelist
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/service-auth/keys')
        .set('Authorization', 'Bearer admin-token')
        .send({ description: 'Missing service name' });

      expect(response.status).toBe(400);
      expect(mockApiKeyService.createApiKey).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/service-auth/keys/:serviceName/rotate', () => {
    it('should rotate API key for service', async () => {
      const mockRotatedKey = {
        id: 'rotated-key-id',
        serviceName: 'calendar-service',
        apiKey: 'srv_new1234567890',
        permissions: ['read:events', 'write:events'],
        allowedIps: ['*'],
        isActive: true,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockApiKeyService.rotateApiKey.mockResolvedValue(mockRotatedKey);

      const response = await request(app)
        .post('/api/service-auth/keys/calendar-service/rotate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'API key rotated successfully',
        key: mockRotatedKey
      });
      expect(mockApiKeyService.rotateApiKey).toHaveBeenCalledWith('calendar-service');
    });

    it('should handle non-existent service', async () => {
      mockApiKeyService.rotateApiKey.mockRejectedValue(
        new Error('Service not found')
      );

      const response = await request(app)
        .post('/api/service-auth/keys/non-existent/rotate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'Service not found'
      });
    });
  });

  describe('DELETE /api/service-auth/keys/:apiKeyId', () => {
    it('should revoke API key', async () => {
      mockApiKeyService.revokeApiKey.mockResolvedValue();

      const response = await request(app)
        .delete('/api/service-auth/keys/key-to-revoke')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'API key revoked successfully'
      });
      expect(mockApiKeyService.revokeApiKey).toHaveBeenCalledWith('key-to-revoke');
    });

    it('should handle key not found', async () => {
      mockApiKeyService.revokeApiKey.mockRejectedValue(
        new Error('API key not found')
      );

      const response = await request(app)
        .delete('/api/service-auth/keys/non-existent-key')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'API key not found'
      });
    });
  });

  describe('GET /api/service-auth/keys/:serviceName/stats', () => {
    it('should return API key usage statistics', async () => {
      const mockStats = {
        totalRequests: 15420,
        lastUsed: new Date(),
        isActive: true,
        expiresAt: undefined
      };

      mockApiKeyService.getApiKeyStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/service-auth/keys/calendar-service/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ stats: mockStats });
      expect(mockApiKeyService.getApiKeyStats).toHaveBeenCalledWith('calendar-service');
    });

    it('should handle stats not available', async () => {
      mockApiKeyService.getApiKeyStats.mockResolvedValue({ 
        totalRequests: 0, 
        isActive: false, 
        expiresAt: undefined 
      });

      const response = await request(app)
        .get('/api/service-auth/keys/new-service/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'No statistics available for this service'
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for admin endpoints', async () => {
      (extractUser as jest.Mock).mockImplementationOnce((req: any, res: any) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/service-auth/keys');

      expect(response.status).toBe(401);
    });

    it('should check admin permission for protected endpoints', async () => {
      (extractUser as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { 
          id: 'regular-user', 
          roles: ['player'],
          permissions: ['read:profile']
        };
        next();
      });

      (requirePermission as jest.Mock).mockImplementationOnce(() => (req: any, res: any) => {
        res.status(403).json({ message: 'Admin access required' });
      });

      const response = await request(app)
        .post('/api/service-auth/keys')
        .set('Authorization', 'Bearer user-token')
        .send({ serviceName: 'test' });

      expect(response.status).toBe(403);
    });
  });
});