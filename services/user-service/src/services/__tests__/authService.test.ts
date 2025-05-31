// Test suite for authService
import { getRepository, MoreThan } from 'typeorm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../emailService';
import logger from '../../config/logger';
import { User, RefreshToken } from '../../entities'; // Adjust path as needed
import { ConflictError, UnauthorizedError } from '../../errors/authErrors'; // Adjust path

// Mock dependencies
jest.mock('typeorm', () => ({
  getRepository: jest.fn(),
  MoreThan: jest.fn(), // We might need to mock its behavior if used complexly
  BaseEntity: class MockBaseEntity {},
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('crypto', () => {
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDigest = jest.fn();
  return {
    randomBytes: jest.fn(),
    createHash: jest.fn(() => ({ // createHash returns an object
        update: mockUpdate,
        digest: mockDigest,
    })),
    // Keep references for configuration if needed elsewhere
    __mockUpdate: mockUpdate, 
    __mockDigest: mockDigest, 
  };
});
jest.mock('../emailService');
jest.mock('../../config/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}));

// Import the service *after* mocks are defined
import * as authService from '../authService';

describe('Auth Service', () => {
  // --- Mocks Setup --- 
  let mockUserRepo: any;
  let mockTokenRepo: any;
  let mockCryptoDigest: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup mock repository implementations
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    mockTokenRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    // Configure getRepository mock to return our mock repos
    (getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) {
        return mockUserRepo;
      }
      if (entity === RefreshToken) {
        return mockTokenRepo;
      }
      throw new Error(`Mock not configured for repository: ${entity}`);
    });

    // Configure other mocks with default behaviors if needed
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock_jwt_token');
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 'mock_user_id', email: 'test@example.com', roles: [] });
    (jwt.decode as jest.Mock).mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Mock expiry
    (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => 'mock_random_bytes' });
    mockCryptoDigest = require('crypto').__mockDigest;
    mockCryptoDigest.mockReturnValue('mock_hashed_token');
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
  });

  // TODO: Add tests for register, login, refreshToken, forgotPassword, resetPassword, etc.
  describe('register', () => {
      it('should register a new user successfully', async () => {
          // Arrange
          const userData = { 
              email: 'test@example.com', 
              password: 'password123', 
              firstName: 'Test', 
              lastName: 'User' 
          };
          const createdUser = { ...userData, id: 'uuid1', passwordHash: 'hashed_password', status: 'active' };
          mockUserRepo.findOne.mockResolvedValue(null); // No existing user
          mockUserRepo.create.mockReturnValue(createdUser); // Simulate entity creation
          mockUserRepo.save.mockResolvedValue(createdUser); // Simulate save

          // Act
          const result = await authService.register(userData);

          // Assert
          expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
          expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
          expect(mockUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              passwordHash: 'hashed_password',
              status: 'active'
          }));
          expect(mockUserRepo.save).toHaveBeenCalledWith(createdUser);
          expect(result).toEqual(expect.objectContaining({ 
              email: userData.email, 
              firstName: userData.firstName, 
              lastName: userData.lastName 
          })); 
          expect(result).not.toHaveProperty('passwordHash'); // Ensure hash is removed
      });

      it('should throw ConflictError if email already exists', async () => {
          // Arrange
          const userData = { email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User' };
          mockUserRepo.findOne.mockResolvedValue({ id: 'uuid1', email: userData.email }); // User exists

          // Act & Assert
          await expect(authService.register(userData)).rejects.toThrow(ConflictError);
          await expect(authService.register(userData)).rejects.toThrow('Email already in use');
          expect(bcrypt.hash).not.toHaveBeenCalled();
          expect(mockUserRepo.create).not.toHaveBeenCalled();
          expect(mockUserRepo.save).not.toHaveBeenCalled();
      });
  });

  describe('login', () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      id: 'uuid1',
      email: credentials.email,
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      status: 'active' as const,
      preferredLanguage: 'en',
      roles: [{ id: 'role1', name: 'user' }],
      lastLogin: null, // For checking update
    };

    it('should login successfully and return tokens and user info', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('mock_access_token') // First call for access token
        .mockReturnValueOnce('mock_refresh_token'); // Second call for refresh token
      mockTokenRepo.create.mockImplementation((data: any) => data); // Simulate create
      mockTokenRepo.save.mockResolvedValue({}); // Simulate save
      mockUserRepo.save.mockResolvedValue({}); // Simulate user save (lastLogin)

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ 
          where: { email: credentials.email }, 
          relations: ['roles'] 
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.passwordHash);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      // Access Token generation
      expect(jwt.sign).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ userId: mockUser.id, email: mockUser.email, roles: ['user'] }),
        process.env.JWT_SECRET, // Check if it uses the right secret (might need to mock process.env)
        { expiresIn: process.env.JWT_EXPIRY || '15m' }
      );
      // Refresh Token generation
      expect(jwt.sign).toHaveBeenNthCalledWith(2,
        { userId: mockUser.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
      );
      expect(mockTokenRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: mockUser.id, token: 'mock_refresh_token' }));
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: mockUser.id, lastLogin: expect.any(Date) }));
      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          preferredLanguage: mockUser.preferredLanguage,
          roles: mockUser.roles,
        }
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if password does not match', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if user status is not active', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, status: 'inactive' as const };
      mockUserRepo.findOne.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(credentials)).rejects.toThrow('User account is not active');
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const incomingRefreshToken = 'valid_refresh_token';
    const decodedPayload = { userId: 'uuid1', email: 'test@example.com', roles: ['user'] };
    const mockStoredToken = {
        token: incomingRefreshToken,
        userId: decodedPayload.userId,
        revoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Expires tomorrow
        user: { 
            id: decodedPayload.userId, 
            email: decodedPayload.email, 
            roles: [{ id: 'role1', name: 'user' }] 
        }
    };

    it('should refresh tokens successfully', async () => {
        // Arrange
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
        mockTokenRepo.findOne.mockResolvedValue(mockStoredToken);
        mockTokenRepo.update.mockResolvedValue({ affected: 1 }); // Simulate revocation
        (jwt.sign as jest.Mock)
            .mockReturnValueOnce('new_access_token')
            .mockReturnValueOnce('new_refresh_token');
        mockTokenRepo.create.mockImplementation((data: any) => data);
        mockTokenRepo.save.mockResolvedValue({}); // Simulate saving new token

        // Act
        const result = await authService.refreshToken(incomingRefreshToken);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
        expect(mockTokenRepo.findOne).toHaveBeenCalledWith({
            where: { token: incomingRefreshToken, userId: decodedPayload.userId, revoked: false },
            relations: ['user', 'user.roles'],
        });
        expect(mockTokenRepo.update).toHaveBeenCalledWith({ token: incomingRefreshToken }, { revoked: true, revokedReason: 'Logout or Refresh' });
        expect(jwt.sign).toHaveBeenCalledTimes(2);
        expect(jwt.sign).toHaveBeenNthCalledWith(1, 
            expect.objectContaining({ userId: decodedPayload.userId, email: decodedPayload.email, roles: ['user'] }),
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '15m' }
        );
        expect(jwt.sign).toHaveBeenNthCalledWith(2,
            { userId: decodedPayload.userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
        );
        expect(mockTokenRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: decodedPayload.userId, token: 'new_refresh_token' }));
        expect(result).toEqual({ accessToken: 'new_access_token', refreshToken: 'new_refresh_token' });
    });

    it('should throw UnauthorizedError if jwt.verify fails', async () => {
        // Arrange
        const verifyError = new Error('Invalid token signature');
        (jwt.verify as jest.Mock).mockImplementation(() => { throw verifyError; });

        // Act & Assert
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow(UnauthorizedError);
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow('Invalid or expired refresh token');
        expect(mockTokenRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if stored token not found', async () => {
        // Arrange
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
        mockTokenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow(UnauthorizedError);
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow('Invalid refresh token');
        expect(mockTokenRepo.update).not.toHaveBeenCalled();
        expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if stored token has no user', async () => {
        // Arrange
        const tokenWithoutUser = { ...mockStoredToken, user: null };
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
        mockTokenRepo.findOne.mockResolvedValue(tokenWithoutUser);

        // Act & Assert
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow(UnauthorizedError);
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError if stored token is expired', async () => {
        // Arrange
        const expiredToken = { ...mockStoredToken, expiresAt: new Date(Date.now() - 1000) }; // Expired 1s ago
        (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);
        mockTokenRepo.findOne.mockResolvedValue(expiredToken);

        // Act & Assert
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow(UnauthorizedError);
        await expect(authService.refreshToken(incomingRefreshToken)).rejects.toThrow('Refresh token expired');
        expect(mockTokenRepo.update).not.toHaveBeenCalled(); // Should fail before revocation
    });

  });

  describe('forgotPassword', () => {
    const forgotPasswordData = { email: 'test@example.com' };
    const mockUser = {
        id: 'uuid1',
        email: forgotPasswordData.email,
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        status: 'active' as const,
        passwordResetToken: null,
        passwordResetExpires: null,
    };

    it('should generate token, save user, and call sendPasswordResetEmail if user found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({}); // Simulate save
      const mockResetToken = 'mock_random_bytes'; // The unhashed token
      const mockHashedToken = 'mock_hashed_token'; // The hashed token
      (crypto.randomBytes as jest.Mock).mockReturnValue({ toString: () => mockResetToken });
      mockCryptoDigest.mockReturnValue(mockHashedToken);

      // Act
      await authService.forgotPassword(forgotPasswordData);

      // Assert
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: forgotPasswordData.email } });
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(require('crypto').__mockUpdate).toHaveBeenCalledWith(mockResetToken); // Check update was called with unhashed token
      expect(mockCryptoDigest).toHaveBeenCalledWith('hex');
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.id,
        passwordResetToken: mockHashedToken,
        passwordResetExpires: expect.any(Date),
      }));
      // Check expiry is roughly 1 hour from now
      const savedUser = (mockUserRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.passwordResetExpires.getTime()).toBeGreaterThan(Date.now() + 3590000); 
      expect(savedUser.passwordResetExpires.getTime()).toBeLessThan(Date.now() + 3610000);

      const expectedResetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${mockResetToken}`;
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(mockUser.email, expectedResetUrl);
      expect(logger.info).toHaveBeenCalledWith(`Password reset email initiated for ${mockUser.email}`);
    });

    it('should do nothing (and not throw) if user not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act
      await authService.forgotPassword(forgotPasswordData);

      // Assert
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: forgotPasswordData.email } });
      expect(crypto.randomBytes).not.toHaveBeenCalled();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
      // Check logger was called for debugging this case
      expect(logger.debug).toHaveBeenCalledWith(`Password reset requested for non-existent email: ${forgotPasswordData.email}`);
    });

     it('should log an error if sendPasswordResetEmail fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.save.mockResolvedValue({});
      const emailError = new Error('SMTP connection failed');
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(emailError);
      const mockResetToken = 'mock_random_bytes';

      // Act
      await authService.forgotPassword(forgotPasswordData);

      // Assert
      expect(mockUserRepo.save).toHaveBeenCalled(); // Should still save token
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        { err: emailError, userId: mockUser.id, email: mockUser.email },
        `Failed to send password reset email`
      );
    });

  });

  describe('resetPassword', () => {
    const resetPasswordData = { token: 'valid_reset_token', newPassword: 'newPassword123' };
    const mockHashedToken = 'hashed_valid_reset_token';
    const mockUserWithToken = {
        id: 'uuid1',
        email: 'test@example.com',
        passwordHash: 'old_hashed_password',
        firstName: 'Test',
        lastName: 'User',
        status: 'active' as const,
        passwordResetToken: mockHashedToken,
        passwordResetExpires: new Date(Date.now() + 1000 * 60 * 30), // Expires in 30 mins
    };

    beforeEach(() => {
        // Setup crypto mock for this specific test block if needed
        mockCryptoDigest.mockReturnValue(mockHashedToken);
        // Mock MoreThan to simulate date comparison (basic mock, might need refinement)
        (MoreThan as jest.Mock).mockImplementation(date => ({ date, type: 'moreThan' }));
    });

    it('should reset password successfully if token is valid and not expired', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUserWithToken);
        (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
        mockUserRepo.save.mockResolvedValue({}); // Simulate user save
        mockTokenRepo.update.mockResolvedValue({ affected: 1 }); // Simulate token revocation

        // Act
        await authService.resetPassword(resetPasswordData);

        // Assert
        expect(crypto.createHash).toHaveBeenCalledWith('sha256');
        expect(require('crypto').__mockUpdate).toHaveBeenCalledWith(resetPasswordData.token);
        expect(mockCryptoDigest).toHaveBeenCalledWith('hex');
        expect(mockUserRepo.findOne).toHaveBeenCalledWith({
            where: {
                passwordResetToken: mockHashedToken,
                passwordResetExpires: { date: expect.any(Date), type: 'moreThan' } // Check MoreThan was used
            }
        });
        expect(bcrypt.hash).toHaveBeenCalledWith(resetPasswordData.newPassword, 10);
        expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: mockUserWithToken.id,
            passwordHash: 'new_hashed_password',
            passwordResetToken: null,
            passwordResetExpires: null,
        }));
        expect(mockTokenRepo.update).toHaveBeenCalledWith(
            { userId: mockUserWithToken.id, revoked: false },
            { revoked: true, revokedReason: 'Password changed' }
        );
    });

    it('should throw UnauthorizedError if token is invalid or expired (user not found)', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(null); // Simulate token not found or expired

        // Act & Assert
        await expect(authService.resetPassword(resetPasswordData)).rejects.toThrow(UnauthorizedError);
        await expect(authService.resetPassword(resetPasswordData)).rejects.toThrow('Invalid or expired reset token');
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(mockUserRepo.save).not.toHaveBeenCalled();
        expect(mockTokenRepo.update).not.toHaveBeenCalled();
    });

  });

  describe('logout', () => {
    const incomingRefreshToken = 'some_refresh_token';

    it('should call revokeRefreshToken and log success', async () => {
      // Arrange
      mockTokenRepo.update.mockResolvedValue({ affected: 1 }); // Simulate successful update

      // Act
      await authService.logout(incomingRefreshToken);

      // Assert
      expect(mockTokenRepo.update).toHaveBeenCalledWith(
        { token: incomingRefreshToken }, 
        { revoked: true, revokedReason: 'Logout or Refresh' }
      );
      expect(logger.info).toHaveBeenCalledWith('User logged out successfully (refresh token revoked).');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log an error if revokeRefreshToken fails', async () => {
      // Arrange
      const dbError = new Error('Database update failed');
      mockTokenRepo.update.mockRejectedValue(dbError); // Simulate update failure

      // Act
      await authService.logout(incomingRefreshToken);

      // Assert
      expect(mockTokenRepo.update).toHaveBeenCalledWith(
        { token: incomingRefreshToken }, 
        { revoked: true, revokedReason: 'Logout or Refresh' }
      );
      expect(logger.info).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith({ err: dbError }, "Error during token revocation on logout");
    });

  });

}); 