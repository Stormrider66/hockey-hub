import request from 'supertest';
import express from 'express';
import { TestServer, createTestClient } from '@hockey-hub/shared-lib/testing/testServer';
import { TestDatabaseFactory } from '@hockey-hub/shared-lib/testing/testDatabaseFactory';
import { createTestToken, createTestUser } from '@hockey-hub/shared-lib/testing/testHelpers';
import { authMiddleware } from '../../middleware/authMiddleware';
import * as rateLimiter from '../../middleware/rateLimiter';
import { requestLogger } from '../../middleware/requestLogger';
// Fallback simple error handler for tests
const errorHandler = (err: any, req: any, res: any, _next: any) => {
  const status = err?.status || err?.response?.status || 500;
  res.status(status).json({ error: err?.message || 'Internal service error' });
};
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('API Gateway Authentication Flow Integration', () => {
  let app: express.Express;
  let server: TestServer;
  let mockAxios: MockAdapter;
  const JWT_SECRET = 'test-secret';

  beforeAll(async () => {
    // Create Express app with middleware
    app = express();
    app.use(express.json());
    app.use(requestLogger);
    
    // Mock axios for service calls
    mockAxios = new MockAdapter(axios);
    
    // Create test server
    server = new TestServer(app);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    mockAxios.restore();
  });

  beforeEach(() => {
    mockAxios.reset();
  });

  describe('User Registration and Login Flow', () => {
    it('should successfully register a new user through the gateway', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'player',
        organizationId: 'org-123',
      };

      // Mock user service registration endpoint
      mockAxios.onPost('http://localhost:3001/api/auth/register').reply(201, {
        user: {
          id: 'user-123',
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: registerData.role,
        },
        message: 'User registered successfully',
      });

      // Set up gateway route
      app.post('/api/auth/register', async (req, res, next) => {
        try {
          const response = await axios.post('http://localhost:3001/api/auth/register', req.body);
          res.status(response.status).json(response.data);
        } catch (error: any) {
          next(error);
        }
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.email).toBe(registerData.email);
      expect(response.body.message).toBe('User registered successfully');
    });

    it('should successfully login and receive JWT tokens', async () => {
      const loginData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };

      const mockTokens = {
        accessToken: createTestToken({ userId: 'user-123', role: 'player' }, JWT_SECRET),
        refreshToken: 'mock-refresh-token',
      };

      // Mock user service login endpoint
      mockAxios.onPost('http://localhost:3001/api/auth/login').reply(200, {
        ...mockTokens,
        user: {
          id: 'user-123',
          email: loginData.email,
          role: 'player',
        },
      });

      // Set up gateway route
      app.post('/api/auth/login', async (req, res, next) => {
        try {
          const response = await axios.post('http://localhost:3001/api/auth/login', req.body);
          res.status(response.status).json(response.data);
        } catch (error: any) {
          next(error);
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should enforce rate limiting on login attempts', async () => {
      // Apply rate limiting middleware
      app.post('/api/auth/login-limited', rateLimiter.authLimiter, async (req, res) => {
        res.json({ message: 'Login successful' });
      });

      // Make multiple requests to trigger rate limit
      const requests = Array(6).fill(null).map(() => 
        request(app)
          .post('/api/auth/login-limited')
          .send({ email: 'test@example.com', password: 'password' })
      );

      const responses = await Promise.all(requests);
      
      // First 5 should succeed, 6th should be rate limited
      expect(responses.slice(0, 5).every(r => r.status === 200)).toBe(true);
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.error).toContain('Too many requests');
    });
  });

  describe('Authenticated Request Flow', () => {
    it('should allow access to protected routes with valid JWT', async () => {
      const user = createTestUser({ id: 'user-123', role: 'player' });
      const token = createTestToken(user, JWT_SECRET);

      // Mock JWKS endpoint for token validation
      mockAxios.onGet('http://localhost:3001/api/auth/.well-known/jwks.json').reply(200, {
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            kid: 'test-key-id',
            alg: 'RS256',
            n: 'test-modulus',
            e: 'AQAB',
          },
        ],
      });

      // Mock user service for token validation
      mockAxios.onGet('http://localhost:3001/api/auth/validate').reply(200, {
        valid: true,
        user,
      });

      // Set up protected route
      app.get('/api/protected', authMiddleware, (req, res) => {
        res.json({ 
          message: 'Access granted',
          user: (req as any).user,
        });
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Access granted');
      expect(response.body.user).toBeDefined();
    });

    it('should reject requests with invalid JWT', async () => {
      const invalidToken = 'invalid.jwt.token';

      // Mock user service validation failure
      mockAxios.onGet('http://localhost:3001/api/auth/validate').reply(401, {
        error: 'Invalid token',
      });

      // Set up protected route
      app.get('/api/protected-invalid', authMiddleware, (req, res) => {
        res.json({ message: 'Should not reach here' });
      });

      const response = await request(app)
        .get('/api/protected-invalid')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should reject requests without JWT', async () => {
      // Set up protected route
      app.get('/api/protected-no-token', authMiddleware, (req, res) => {
        res.json({ message: 'Should not reach here' });
      });

      const response = await request(app)
        .get('/api/protected-no-token')
        .expect(401);

      expect(response.body.error).toBe('No token provided');
    });
  });

  describe('Service-to-Service Communication', () => {
    it('should forward user context to downstream services', async () => {
      const user = createTestUser({ id: 'user-123', role: 'coach' });
      const token = createTestToken(user, JWT_SECRET);

      // Mock user validation
      mockAxios.onGet('http://localhost:3001/api/auth/validate').reply(200, {
        valid: true,
        user,
      });

      // Mock training service endpoint
      mockAxios.onGet('http://localhost:3004/api/sessions').reply(function(config) {
        // Verify user context headers are forwarded
        expect(config.headers['x-user-id']).toBe(user.id);
        expect(config.headers['x-user-role']).toBe(user.role);
        expect(config.headers['x-organization-id']).toBe(user.organizationId);
        
        return [200, { sessions: [] }];
      });

      // Set up gateway route with auth and service forwarding
      app.get('/api/training/sessions', authMiddleware, async (req, res, next) => {
        try {
          const response = await axios.get('http://localhost:3004/api/sessions', {
            headers: {
              'x-user-id': (req as any).user?.id || (req.headers['x-user-id'] as string),
              'x-user-role': (req as any).user?.role || (req.headers['x-user-role'] as string),
              'x-organization-id': (req as any).user?.organizationId || (req.headers['x-organization-id'] as string),
            },
          });
          res.json(response.data);
        } catch (error) {
          res.status(error?.response?.status || 500).json({ error: error?.response?.data?.error || 'Internal service error' });
        }
      });

      const response = await request(app)
        .get('/api/training/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.sessions).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      const user = createTestUser({ id: 'user-123', role: 'player' });
      const token = createTestToken(user, JWT_SECRET);

      // Mock user validation
      mockAxios.onGet('http://localhost:3001/api/auth/validate').reply(200, {
        valid: true,
        user,
      });

      // Mock service error
      mockAxios.onGet('http://localhost:3004/api/sessions').reply(500, {
        error: 'Internal service error',
      });

      // Set up gateway route
      app.get('/api/training/sessions-error', authMiddleware, async (req, res, next) => {
        try {
          const response = await axios.get('http://localhost:3004/api/sessions');
          res.json(response.data);
        } catch (error: any) {
          res.status(error.response?.status || 500).json({
            error: error.response?.data?.error || 'Service unavailable',
          });
        }
      });

      const response = await request(app)
        .get('/api/training/sessions-error')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);

      expect(response.body.error).toBe('Internal service error');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Add error handler
      app.use(errorHandler);
    });

    it('should handle validation errors with proper status codes', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      // Mock validation error from user service
      mockAxios.onPost('http://localhost:3001/api/auth/register').reply(400, {
        error: 'Validation failed',
        details: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password must be at least 8 characters' },
        ],
      });

      // Set up route
      app.post('/api/auth/register-validation', async (req, res, next) => {
        try {
          const response = await axios.post('http://localhost:3001/api/auth/register', req.body);
          res.json(response.data);
        } catch (error: any) {
          if (error.response) {
            res.status(error.response.status).json(error.response.data);
          } else {
            next(error);
          }
        }
      });

      const response = await request(app)
        .post('/api/auth/register-validation')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveLength(2);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockAxios.onGet('http://localhost:3001/api/health').networkError();

      // Set up health check route
      app.get('/api/health', async (req, res, next) => {
        try {
          await axios.get('http://localhost:3001/api/health');
          res.json({ status: 'healthy' });
        } catch (error) {
          res.status(503).json({ 
            error: 'Service unavailable',
            service: 'user-service',
          });
        }
      });

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.service).toBe('user-service');
    });
  });

  describe('Security Features', () => {
    it('should include security headers in responses', async () => {
      app.get('/api/test-headers', (req, res) => {
        res.json({ message: 'Headers test' });
      });

      const response = await request(app)
        .get('/api/test-headers')
        .expect(200);

      // Check for request ID header (added by request logger)
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should sanitize user input to prevent injection attacks', async () => {
      const maliciousInput = {
        email: 'test@example.com<script>alert("xss")</script>',
        password: "'; DROP TABLE users; --",
      };

      // Mock sanitized response from user service
      mockAxios.onPost('http://localhost:3001/api/auth/register').reply(201, {
        user: {
          email: 'test@example.com', // Sanitized
        },
      });

      // Set up route with basic sanitization
      app.post('/api/auth/register-sanitized', async (req, res, next) => {
        // Basic sanitization (in real app, use proper middleware)
        const sanitizedData = {
          email: req.body.email?.replace(/<[^>]*>/g, ''),
          password: req.body.password,
        };
        
        try {
          const response = await axios.post('http://localhost:3001/api/auth/register', sanitizedData);
          res.status(response.status || 201).json(response.data);
        } catch (error) {
          next(error);
        }
      });

      const response = await request(app)
        .post('/api/auth/register-sanitized')
        .send(maliciousInput)
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.email).not.toContain('<script>');
    });
  });
});