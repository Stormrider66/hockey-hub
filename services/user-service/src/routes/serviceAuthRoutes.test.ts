import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing the routes
jest.mock('../services/serviceApiKeyService', () => {
  const mockInstance = {
    validateApiKey: jest.fn(),
    createApiKey: jest.fn(),
    listApiKeys: jest.fn(),
    rotateApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
    getApiKeyStats: jest.fn(),
  };
  const ServiceApiKeyService = jest.fn().mockImplementation(() => mockInstance);
  return { ServiceApiKeyService };
});
jest.mock('../middleware/authMiddleware', () => ({
  extractUser: jest.fn((req: any, _res: any, next: any) => { req.user = { userId: 'admin-user-id', roles: ['admin'] }; next(); }),
  requireAuth: jest.fn((_req: any, _res: any, next: any) => next()),
  requirePermission: jest.fn(() => (_req: any, _res: any, next: any) => next())
}));

// Now import modules that use the mocks
import serviceAuthRoutes, { __setServiceApiKeyService } from './serviceAuthRoutes';
import { extractUser, requireAuth, requirePermission } from '../middleware/authMiddleware';

describe('Service Auth Routes', () => {
  let app: express.Express;
  let svc: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create and inject our own mock service instance each test
    svc = {
      validateApiKey: jest.fn(),
      createApiKey: jest.fn(),
      listApiKeys: jest.fn(),
      rotateApiKey: jest.fn(),
      revokeApiKey: jest.fn(),
      getApiKeyStats: jest.fn(),
    };
    __setServiceApiKeyService(svc);
    
    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api/service-auth', serviceAuthRoutes);

    // Mock middleware
    (extractUser as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = { 
        userId: 'admin-user-id', 
        id: 'admin-user-id',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['admin:all']
      };
      next();
    });

    (requireAuth as jest.Mock).mockImplementation((req: any, res: any, next: any) => next());
    (requirePermission as jest.Mock).mockImplementation(() => (req: any, res: any, next: any) => next());

    // Note: router created its own instance on import; use getServiceMock() in tests
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      svc.validateApiKey.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/service-auth/validate')
        .set('X-API-Key', 'valid-api-key')
        .set('X-Forwarded-For', '192.168.1.1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        valid: true,
        service: {
          id: 'key-1',
          serviceName: 'calendar-service',
          apiKey: 'cal_test_key_123',
          permissions: ['read:events', 'write:events'],
          allowedIps: ['*'],
          isActive: true,
          usageCount: 5,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      });
      expect(svc.validateApiKey).toHaveBeenCalledWith('valid-api-key', '192.168.1.1');
    });

    it('should reject invalid API key', async () => {
      svc.validateApiKey.mockResolvedValue({ valid: false, error: 'Invalid API key' });

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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString()
        },
        {
          id: 'key-2',
          serviceName: 'training-service',
          apiKey: 'hh_tra_key_456',
          permissions: ['read:sessions', 'write:sessions'],
          allowedIps: ['192.168.1.0/24'],
          isActive: true,
          usageCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      svc.listApiKeys.mockResolvedValue(mockKeys);

      const response = await request(app)
        .get('/api/service-auth/keys')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        keys: [
          expect.objectContaining({
            id: 'key-1',
            serviceName: 'calendar-service',
            apiKey: 'hh_cal_key_123',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            lastUsedAt: expect.any(String)
          }),
          expect.objectContaining({
            id: 'key-2',
            serviceName: 'training-service',
            apiKey: 'hh_tra_key_456',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ]
      });
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      svc.createApiKey.mockResolvedValue(mockNewKey);

      const response = await request(app)
        .post('/api/service-auth/keys')
        .set('Authorization', 'Bearer admin-token')
        .send(createData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        message: 'API key created successfully',
        key: expect.objectContaining({
          id: 'new-key-id',
          serviceName: 'new-service',
          apiKey: 'srv_1234567890abcdef',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
      expect(svc.createApiKey).toHaveBeenCalledWith({
        serviceName: createData.serviceName,
        description: createData.description,
        permissions: createData.permissions,
        allowedIps: createData.ipWhitelist,
        expiresAt: undefined,
        createdBy: 'admin-user-id'
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/service-auth/keys')
        .set('Authorization', 'Bearer admin-token')
        .send({ description: 'Missing service name' });

      expect(response.status).toBe(400);
      expect(svc.createApiKey).not.toHaveBeenCalled();
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      svc.rotateApiKey.mockResolvedValue(mockRotatedKey);

      const response = await request(app)
        .post('/api/service-auth/keys/calendar-service/rotate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'API key rotated successfully',
        key: expect.objectContaining({
          id: 'rotated-key-id',
          serviceName: 'calendar-service',
          apiKey: 'srv_new1234567890',
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      });
      expect(svc.rotateApiKey).toHaveBeenCalledWith('calendar-service', 'admin-user-id');
    });

    it('should handle non-existent service', async () => {
      svc.rotateApiKey.mockRejectedValue(
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
      svc.revokeApiKey.mockResolvedValue();

      // Provide list so the route can find the key by id
      svc.listApiKeys.mockResolvedValue([
        {
          id: 'key-to-revoke',
          serviceName: 'some-service',
          apiKey: 'actual-key',
          permissions: [],
          allowedIps: ['*'],
          isActive: true,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);

      const response = await request(app)
        .delete('/api/service-auth/keys/key-to-revoke')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'API key revoked successfully'
      });
      expect(svc.revokeApiKey).toHaveBeenCalledWith('actual-key', 'admin-user-id', 'Admin action');
    });

    it('should handle key not found', async () => {
      svc.revokeApiKey.mockRejectedValue(
        new Error('API key not found')
      );

      svc.listApiKeys.mockResolvedValue([]);

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
        lastUsed: new Date().toISOString(),
        isActive: true,
        expiresAt: undefined
      };

      svc.getApiKeyStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/service-auth/keys/calendar-service/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        stats: {
          totalRequests: 15420,
          lastUsed: expect.any(String),
          isActive: true
        }
      });
      expect(svc.getApiKeyStats).toHaveBeenCalledWith('calendar-service');
    });

    it('should handle stats not available', async () => {
      svc.getApiKeyStats.mockResolvedValue({ 
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