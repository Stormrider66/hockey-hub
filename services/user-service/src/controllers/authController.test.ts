import { AuthController } from './authController';
import { CachedUserRepository } from '../repositories/CachedUserRepository';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository';
import { PasswordResetTokenRepository } from '../repositories/PasswordResetTokenRepository';
import { JWTService } from '../services/jwtService';
import { AccountLockoutService } from '../services/accountLockoutService';
import { PasswordValidator } from '../services/passwordValidator';
import bcrypt from 'bcryptjs';
import { mockRequest, mockResponse } from '@hockey-hub/shared-lib/test/testHelpers';
import { NotFoundError, ValidationError, ConflictError, UnauthorizedError } from '@hockey-hub/shared-lib/errors';

// Mock dependencies
jest.mock('../repositories/CachedUserRepository');
jest.mock('../repositories/RefreshTokenRepository');
jest.mock('../repositories/PasswordResetTokenRepository');
jest.mock('../services/jwtService');
jest.mock('../services/accountLockoutService');
jest.mock('../services/passwordValidator');
jest.mock('bcryptjs');

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserRepo: jest.Mocked<CachedUserRepository>;
  let mockRefreshTokenRepo: jest.Mocked<RefreshTokenRepository>;
  let mockPasswordResetRepo: jest.Mocked<PasswordResetTokenRepository>;
  let mockJwtService: jest.Mocked<JWTService>;
  let mockLockoutService: jest.Mocked<AccountLockoutService>;
  let mockPasswordValidator: jest.Mocked<PasswordValidator>;

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

    // Initialize mocks
    mockUserRepo = new CachedUserRepository(null as any, null as any) as jest.Mocked<CachedUserRepository>;
    mockRefreshTokenRepo = new RefreshTokenRepository() as jest.Mocked<RefreshTokenRepository>;
    mockPasswordResetRepo = new PasswordResetTokenRepository() as jest.Mocked<PasswordResetTokenRepository>;
    mockJwtService = new JWTService() as jest.Mocked<JWTService>;
    mockLockoutService = new AccountLockoutService(null as any) as jest.Mocked<AccountLockoutService>;
    mockPasswordValidator = new PasswordValidator() as jest.Mocked<PasswordValidator>;

    authController = new AuthController(
      mockUserRepo,
      mockRefreshTokenRepo,
      mockPasswordResetRepo,
      mockJwtService,
      mockLockoutService,
      mockPasswordValidator
    );
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
      const req = mockRequest({ body: registerData });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockPasswordValidator.validate.mockReturnValue({ isValid: true, score: 4, feedback: [] });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepo.create.mockResolvedValue({ ...mockUser, id: 'new-user-id' } as any);
      mockJwtService.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
      mockRefreshTokenRepo.create.mockResolvedValue({} as any);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        user: expect.objectContaining({ id: 'new-user-id' }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should reject registration with existing email', async () => {
      const req = mockRequest({ body: registerData });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email already registered'
      });
    });

    it('should reject weak passwords', async () => {
      const req = mockRequest({ body: { ...registerData, password: 'weak' } });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockPasswordValidator.validate.mockReturnValue({
        isValid: false,
        score: 1,
        feedback: ['Password is too weak', 'Add uppercase letters']
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password does not meet requirements',
        errors: ['Password is too weak', 'Add uppercase letters']
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-browser' }
      });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);
      mockLockoutService.isAccountLocked.mockResolvedValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.generateTokenPair.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
      mockRefreshTokenRepo.create.mockResolvedValue({} as any);
      mockLockoutService.clearFailedAttempts.mockResolvedValue();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: 'user-123' }),
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
      expect(mockLockoutService.clearFailedAttempts).toHaveBeenCalledWith('user-123');
    });

    it('should reject login with invalid credentials', async () => {
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'wrongpassword' },
        ip: '127.0.0.1'
      });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);
      mockLockoutService.isAccountLocked.mockResolvedValue(false);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockLockoutService.recordFailedAttempt.mockResolvedValue();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email or password'
      });
      expect(mockLockoutService.recordFailedAttempt).toHaveBeenCalledWith('user-123', '127.0.0.1');
    });

    it('should reject login for locked accounts', async () => {
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' }
      });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);
      mockLockoutService.isAccountLocked.mockResolvedValue(true);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account is locked due to too many failed login attempts'
      });
    });

    it('should reject login for inactive users', async () => {
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' }
      });
      const res = mockResponse();

      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepo.findByEmail.mockResolvedValue(inactiveUser as any);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account is deactivated'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const req = mockRequest({
        body: { refreshToken: 'valid-refresh-token' }
      });
      const res = mockResponse();

      mockJwtService.verifyRefreshToken.mockResolvedValue({
        sub: 'user-123',
        deviceId: 'device-123',
        type: 'refresh'
      } as any);
      mockRefreshTokenRepo.findOne.mockResolvedValue({
        id: 'token-id',
        token: 'valid-refresh-token',
        userId: 'user-123',
        isValid: true
      } as any);
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      mockJwtService.generateTokenPair.mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
      mockRefreshTokenRepo.save.mockResolvedValue({} as any);

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('should reject invalid refresh tokens', async () => {
      const req = mockRequest({
        body: { refreshToken: 'invalid-token' }
      });
      const res = mockResponse();

      mockJwtService.verifyRefreshToken.mockRejectedValue(new Error('Invalid token'));

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid refresh token'
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const req = mockRequest({
        body: { refreshToken: 'refresh-token' },
        user: { id: 'user-123' }
      });
      const res = mockResponse();

      mockRefreshTokenRepo.invalidateToken.mockResolvedValue();
      mockJwtService.blacklistToken.mockResolvedValue();

      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged out successfully'
      });
      expect(mockRefreshTokenRepo.invalidateToken).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const req = mockRequest({
        body: { email: 'test@example.com' }
      });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);
      mockPasswordResetRepo.create.mockResolvedValue({
        token: 'reset-token-123'
      } as any);

      await authController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset instructions sent to your email'
      });
      expect(mockPasswordResetRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should return success even for non-existent emails', async () => {
      const req = mockRequest({
        body: { email: 'nonexistent@example.com' }
      });
      const res = mockResponse();

      mockUserRepo.findByEmail.mockResolvedValue(null);

      await authController.forgotPassword(req, res);

      // Same response for security
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset instructions sent to your email'
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const req = mockRequest({
        body: {
          token: 'reset-token-123',
          password: 'NewStrongPassword123!'
        }
      });
      const res = mockResponse();

      const resetToken = {
        id: 'token-id',
        userId: 'user-123',
        token: 'reset-token-123',
        isValid: true,
        expiresAt: new Date(Date.now() + 3600000)
      };

      mockPasswordResetRepo.findOne.mockResolvedValue(resetToken as any);
      mockPasswordValidator.validate.mockReturnValue({ isValid: true, score: 4, feedback: [] });
      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockUserRepo.save.mockResolvedValue({} as any);
      mockPasswordResetRepo.save.mockResolvedValue({} as any);
      mockRefreshTokenRepo.invalidateAllUserTokens.mockResolvedValue();

      await authController.resetPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successfully'
      });
      expect(mockRefreshTokenRepo.invalidateAllUserTokens).toHaveBeenCalledWith('user-123');
    });

    it('should reject expired reset tokens', async () => {
      const req = mockRequest({
        body: {
          token: 'expired-token',
          password: 'NewPassword123!'
        }
      });
      const res = mockResponse();

      const expiredToken = {
        id: 'token-id',
        token: 'expired-token',
        isValid: true,
        expiresAt: new Date(Date.now() - 3600000) // Expired
      };

      mockPasswordResetRepo.findOne.mockResolvedValue(expiredToken as any);

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset token has expired'
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const req = mockRequest({
        user: { id: 'user-123' },
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!'
        }
      });
      const res = mockResponse();

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPasswordValidator.validate.mockReturnValue({ isValid: true, score: 4, feedback: [] });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockUserRepo.save.mockResolvedValue({} as any);

      await authController.changePassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Password changed successfully'
      });
    });

    it('should reject incorrect current password', async () => {
      const req = mockRequest({
        user: { id: 'user-123' },
        body: {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!'
        }
      });
      const res = mockResponse();

      mockUserRepo.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Current password is incorrect'
      });
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const req = mockRequest({
        user: { id: 'user-123' }
      });
      const res = mockResponse();

      const userWithRelations = {
        ...mockUser,
        organization: { id: 'org-456', name: 'Test Org' },
        teams: [{ id: 'team-1', name: 'Team A' }]
      };

      mockUserRepo.findById.mockResolvedValue(userWithRelations as any);

      await authController.getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com'
        })
      );
    });

    it('should handle user not found', async () => {
      const req = mockRequest({
        user: { id: 'non-existent' }
      });
      const res = mockResponse();

      mockUserRepo.findById.mockResolvedValue(null);

      await authController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });
  });
});