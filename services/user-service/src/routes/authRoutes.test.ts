import request from 'supertest';
import express from 'express';

// Mock dependencies BEFORE importing the routes
jest.mock('../controllers/authController');
jest.mock('@hockey-hub/shared-lib/middleware/validationMiddleware', () => ({
  validateBody: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
jest.mock('@hockey-hub/shared-lib/middleware/sanitizationMiddleware', () => ({
  sanitize: jest.fn(() => (req: any, res: any, next: any) => next()),
}));
jest.mock('../middleware/authenticate');

// Now import modules that use the mocks
import { AuthController } from '../controllers/authController';
import * as validation from '@hockey-hub/shared-lib/middleware/validationMiddleware';
import * as sanitization from '@hockey-hub/shared-lib/middleware/sanitizationMiddleware';
import { authenticate } from '../middleware/authenticate';
import authRoutes, { __setAuthController } from './authRoutes';

describe('Auth Routes', () => {
  let app: express.Express;
  let mockAuthController: jest.Mocked<AuthController>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    // Mock middleware BEFORE mounting routes
    (validation.validateBody as unknown as jest.Mock).mockImplementation(() => {
      return (req: any, res: any, next: any) => {
        // Simulate validation failure for weak password on reset-password route
        if (req.path.endsWith('/reset-password') && req.body && req.body.password === 'weak') {
          return res.status(400).json({ errors: [{ field: 'password', message: 'Password is too weak' }] });
        }
        next();
      };
    });
    (sanitization.sanitize as unknown as jest.Mock).mockImplementation(() => {
      return (req: any, _res: any, next: any) => {
        if (req.body && typeof req.body.email === 'string') {
          req.body.email = req.body.email.replace(/<[^>]*>/g, '');
        }
        next();
      };
    });
    (authenticate as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = { id: 'test-user-id', email: 'test@example.com' };
      next();
    });

    // Mock AuthController
    mockAuthController = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      getMe: jest.fn(),
    } as any;

    (AuthController as jest.Mock).mockImplementation(() => mockAuthController);

    // Inject our mock controller before mounting routes (after middleware mocks)
    __setAuthController(({
      register: (...args: any[]) => mockAuthController.register(...(args as [any, any, any])),
      login: (...args: any[]) => mockAuthController.login(...(args as [any, any, any])),
      logout: (...args: any[]) => mockAuthController.logout(...(args as [any, any, any])),
      refreshToken: (...args: any[]) => mockAuthController.refreshToken(...(args as [any, any, any])),
      forgotPassword: (...args: any[]) => mockAuthController.forgotPassword(...(args as [any, any, any])),
      resetPassword: (...args: any[]) => mockAuthController.resetPassword(...(args as [any, any, any])),
      changePassword: (...args: any[]) => mockAuthController.changePassword(...(args as [any, any, any])),
      getMe: (...args: any[]) => mockAuthController.getMe(...(args as [any, any, any]))
    } as unknown) as any);
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller with sanitized data', async () => {
      mockAuthController.register.mockImplementation(async (req, res) => {
        res.status(201).json({ message: 'User registered successfully' });
        return res;
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          organizationId: 'org-123'
        });

      expect(response.status).toBe(201);
      expect(mockAuthController.register).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller with credentials', async () => {
      mockAuthController.login.mockImplementation(async (req, res) => {
        res.json({ 
          accessToken: 'test-token',
          refreshToken: 'refresh-token',
          user: { id: 'user-123', email: 'test@example.com' }
        });
        return res;
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(mockAuthController.login).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should call forgotPassword controller with email', async () => {
      mockAuthController.forgotPassword.mockImplementation(async (req, res) => {
        res.json({ message: 'Password reset email sent' });
        return;
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(mockAuthController.forgotPassword).toHaveBeenCalled();
    });

    it('should handle non-existent email gracefully', async () => {
      mockAuthController.forgotPassword.mockImplementation(async (req, res) => {
        // Same response for security - don't reveal if email exists
        res.json({ message: 'Password reset email sent' });
        return;
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset email sent');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should call resetPassword controller with token and new password', async () => {
      mockAuthController.resetPassword.mockImplementation(async (req, res) => {
        res.json({ message: 'Password reset successfully' });
        return;
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'reset-token-123',
          password: 'NewPassword123!@#'
        });

      expect(response.status).toBe(200);
      expect(mockAuthController.resetPassword).toHaveBeenCalled();
    });

    it('should reject weak passwords', async () => {
      // This would be handled by validation middleware
      (validation.validateBody as jest.Mock).mockImplementationOnce(() => (req: any, res: any, next: any) => {
        res.status(400).json({ 
          errors: [{ field: 'password', message: 'Password is too weak' }] 
        });
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'reset-token-123',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(mockAuthController.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      mockAuthController.getMe.mockImplementation(async (req, res) => {
        res.json({
          id: 'test-user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['player']
        });
        return res;
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockAuthController.getMe).toHaveBeenCalled();
      expect(authenticate).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req: any, res: any) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(mockAuthController.getMe).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password when authenticated', async () => {
      mockAuthController.changePassword.mockImplementation(async (req, res) => {
        res.json({ message: 'Password changed successfully' });
        return res;
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer test-token')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!@#'
        });

      expect(response.status).toBe(200);
      expect(mockAuthController.changePassword).toHaveBeenCalled();
      expect(authenticate).toHaveBeenCalled();
    });

    it('should reject if current password is incorrect', async () => {
      mockAuthController.changePassword.mockImplementation(async (req, res) => {
        res.status(400).json({ message: 'Current password is incorrect' });
        return res;
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer test-token')
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!@#'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      mockAuthController.refreshToken.mockImplementation(async (req, res) => {
        res.json({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        });
        return res;
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      mockAuthController.logout.mockImplementation(async (req, res) => {
        res.json({ message: 'Logged out successfully' });
        return res;
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'refresh-token' });

      expect(response.status).toBe(200);
      expect(mockAuthController.logout).toHaveBeenCalled();
    });
  });

  describe('Validation and Sanitization', () => {
    it('should sanitize input to prevent XSS', async () => {
      const maliciousInput = {
        email: '<script>alert("xss")</script>test@example.com',
        password: 'Test123!@#'
      };

      mockAuthController.login.mockImplementation(async (req, res) => {
        // The sanitization middleware should have cleaned the input
        expect(req.body.email).not.toContain('<script>');
        res.json({ accessToken: 'token' });
        return res;
      });

      await request(app)
        .post('/api/auth/login')
        .send(maliciousInput);
    });

    it('should validate email format', async () => {
      (validation.validateBody as jest.Mock).mockImplementationOnce(() => (req: any, res: any, next: any) => {
        res.status(400).json({ 
          errors: [{ field: 'email', message: 'Invalid email format' }] 
        });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toBe('email');
    });
  });
});