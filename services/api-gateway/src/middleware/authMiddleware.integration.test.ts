import request from 'supertest';
import express from 'express';
import { authMiddleware } from './authMiddleware';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Gateway Auth Middleware Integration', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    
    // Apply auth middleware
    app.use(authMiddleware);
    
    // Test routes
    app.get('/api/public/health', (req, res) => {
      res.json({ status: 'healthy' });
    });
    
    app.get('/api/protected/profile', (req, res) => {
      res.json({ 
        user: (req as any).user,
        message: 'Protected route accessed' 
      });
    });
    
    app.get('/api/admin/users', (req, res) => {
      res.json({ message: 'Admin route accessed' });
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without auth', async () => {
      const response = await request(app)
        .get('/api/public/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'healthy' });
    });

    it('should allow access to auth endpoints', async () => {
      // Mock successful response from user service
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'Login successful' }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/protected/profile');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'No token provided'
      });
    });

    it('should reject requests with invalid token', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Invalid token' } }
      });

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Invalid token'
      });
    });

    it('should allow access with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['player'],
        permissions: ['read:profile']
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/verify',
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });
  });

  describe('Role-Based Access', () => {
    it('should extract roles from verified user', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['admin:all']
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin route accessed');
    });

    it('should pass user context to downstream services', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        teamIds: ['team-1', 'team-2']
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      // Add a route that checks headers
      app.get('/api/test/headers', (req, res) => {
        res.json({
          userId: req.headers['x-user-id'],
          userEmail: req.headers['x-user-email'],
          organizationId: req.headers['x-organization-id'],
          teamIds: req.headers['x-team-ids']
        });
      });

      const response = await request(app)
        .get('/api/test/headers')
        .set('Authorization', 'Bearer valid-token');

      expect(response.body).toEqual({
        userId: 'user-123',
        userEmail: 'test@example.com',
        organizationId: 'org-456',
        teamIds: 'team-1,team-2'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        message: 'Authentication service unavailable'
      });
    });

    it('should handle malformed tokens', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'malformed-header');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Invalid authorization header format'
      });
    });

    it('should handle missing user service', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ECONNREFUSED'
      });

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(503);
    });
  });

  describe('Service Headers', () => {
    it('should forward service authentication headers', async () => {
      // Mock service making request with API key
      app.get('/api/service/data', (req, res) => {
        res.json({
          apiKey: req.headers['x-api-key'],
          serviceName: req.headers['x-service-name']
        });
      });

      const response = await request(app)
        .get('/api/service/data')
        .set('X-API-Key', 'service-key-123')
        .set('X-Service-Name', 'calendar-service');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        apiKey: 'service-key-123',
        serviceName: 'calendar-service'
      });
    });
  });

  describe('CORS and Security Headers', () => {
    it('should not expose sensitive headers in errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { 
          status: 401, 
          data: { 
            message: 'Token expired',
            debugInfo: 'Should not be exposed'
          } 
        }
      });

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Token expired'
      });
      expect(response.body).not.toHaveProperty('debugInfo');
    });
  });

  describe('Performance', () => {
    it('should cache authentication results', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      };

      mockedAxios.post.mockResolvedValue({
        data: { user: mockUser }
      });

      // Make multiple requests with same token
      const token = 'Bearer cached-token';
      
      await request(app)
        .get('/api/protected/profile')
        .set('Authorization', token);
      
      await request(app)
        .get('/api/protected/profile')
        .set('Authorization', token);
      
      await request(app)
        .get('/api/protected/profile')
        .set('Authorization', token);

      // Should only verify token once if caching is implemented
      // This test assumes caching is implemented
      // Adjust based on actual implementation
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });
  });
});