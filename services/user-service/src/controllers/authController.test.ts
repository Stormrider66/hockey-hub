import { AuthController, __setAuthService } from './authController';
import { createMockRequest, createMockResponse } from '@hockey-hub/shared-lib/testing/testHelpers';

type MockAuthService = {
  register: jest.Mock;
  login: jest.Mock;
  refreshToken: jest.Mock;
  logout: jest.Mock;
  getMe: jest.Mock;
  forgotPassword: jest.Mock;
  resetPassword: jest.Mock;
  changePassword: jest.Mock;
};

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: MockAuthService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 'org-456',
    teamIds: ['team-1'],
    roles: [{ id: 'role-1', name: 'player', permissions: [] }],
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getMe: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
    };

    __setAuthService(mockAuthService as any);
    authController = new AuthController();
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      firstName: 'New',
      lastName: 'User',
      organizationId: 'org-456'
    };

    it('should register a new user successfully', async () => {
      const req = createMockRequest({ body: registerData } as any);
      const res = createMockResponse();

      mockAuthService.register.mockResolvedValue({
        message: 'User registered successfully',
        user: { id: 'new-user-id' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: 'new-user-id' }),
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        })
      }));
    });

    it('should reject registration with existing email', async () => {
      const req = createMockRequest({ body: registerData } as any);
      const res = createMockResponse();

      mockAuthService.register.mockRejectedValue(new Error('Email already registered'));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'USER_EXISTS', message: 'Email already registered' }
      });
    });

    it('should reject weak passwords', async () => {
      const req = createMockRequest({ body: { ...registerData, password: 'weak' } } as any);
      const res = createMockResponse();

      const err: any = new Error('Password does not meet requirements');
      (err as any).errors = ['Password is too weak', 'Add uppercase letters'];
      mockAuthService.register.mockRejectedValue(err);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password does not meet requirements' }
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'password123' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-browser' }
      } as any);
      const res = createMockResponse();

      mockAuthService.login.mockResolvedValue({
        user: { id: 'user-123' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: 'user-123' }),
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        })
      }));
      // service internal behavior not asserted here
    });

    it('should reject login with invalid credentials', async () => {
      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'wrongpassword' },
        ip: '127.0.0.1'
      } as any);
      const res = createMockResponse();

      mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
      // service internal behavior not asserted here
    });

    it('should reject login for locked accounts', async () => {
      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'password123' }
      } as any);
      const res = createMockResponse();

      mockAuthService.login.mockRejectedValue(new Error('Account is locked due to too many failed login attempts'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'ACCOUNT_LOCKED', message: 'Account is locked due to too many failed login attempts' }
      });
    });

    it('should reject login for inactive users', async () => {
      const req = createMockRequest({
        body: { email: 'test@example.com', password: 'password123' }
      } as any);
      const res = createMockResponse();

      mockAuthService.login.mockRejectedValue(new Error('Account is deactivated'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const req = createMockRequest({
        body: { refreshToken: 'valid-refresh-token' }
      } as any);
      const res = createMockResponse();

      mockAuthService.refreshToken.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token'
      });

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' })
      }));
    });

    it('should reject invalid refresh tokens', async () => {
      const req = createMockRequest({
        body: { refreshToken: 'invalid-token' }
      } as any);
      const res = createMockResponse();

      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid token'));

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const req = createMockRequest({
        body: { refreshToken: 'refresh-token' },
        user: { id: 'user-123' }
      } as any);
      const res = createMockResponse();

      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { message: 'Logged out successfully' } }));
      // No internal assertions; controller-only behavior
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const req = createMockRequest({
        body: { email: 'test@example.com' }
      } as any);
      const res = createMockResponse();

      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      await authController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset instructions sent to your email'
      });
      // Internal repository operations are hidden inside the service
    });

    it('should return success even for non-existent emails', async () => {
      const req = createMockRequest({
        body: { email: 'nonexistent@example.com' }
      } as any);
      const res = createMockResponse();

      await authController.forgotPassword(req, res);

      // Same response for security
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset instructions sent to your email'
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const req = createMockRequest({
        body: {
          token: 'reset-token-123',
          password: 'NewStrongPassword123!'
        }
      } as any);
      const res = createMockResponse();

      mockAuthService.resetPassword.mockResolvedValue(undefined);

      await authController.resetPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successfully'
      });
      // Internal invalidation is handled inside service; assert only controller response
    });

    it('should reject expired reset tokens', async () => {
      const req = createMockRequest({
        body: {
          token: 'expired-token',
          password: 'NewPassword123!'
        }
      } as any);
      const res = createMockResponse();

      mockAuthService.resetPassword.mockRejectedValue(new Error('expired'));

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset token has expired'
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        }
      } as any);
      const res = createMockResponse();

      mockAuthService.changePassword.mockResolvedValue(undefined);

      await authController.changePassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Password changed successfully'
      });
    });

    it('should reject incorrect current password', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        body: {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!'
        }
      } as any);
      const res = createMockResponse();

      mockAuthService.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Current password is incorrect'
      });
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' }
      } as any);
      const res = createMockResponse();

      mockAuthService.getMe.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

      await authController.getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com'
        })
      );
    });

    it('should handle user not found', async () => {
      const req = createMockRequest({
        user: { id: 'non-existent' }
      } as any);
      const res = createMockResponse();

      mockAuthService.getMe.mockRejectedValue(new Error('User not found'));

      await authController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });
});