import { JWTService } from './jwtService';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Mock modules
jest.mock('fs');
jest.mock('crypto', () => ({
  generateKeyPairSync: jest.fn(() => ({
    privateKey: 'mock-private-key',
    publicKey: 'mock-public-key'
  }))
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('JWTService', () => {
  let jwtService: JWTService;
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    organizationId: 'org-456',
    teamIds: ['team-1', 'team-2'],
    roles: ['player', 'coach'],
    permissions: ['read:profile', 'write:profile']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.JWT_ISSUER = 'hockey-hub-test';
    process.env.JWT_AUDIENCE = 'hockey-hub-api-test';

    // Mock file system operations
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.writeFileSync.mockImplementation(() => undefined);
    mockFs.readFileSync.mockImplementation((filePath: any) => {
      if (filePath.includes('private')) {
        return 'mock-private-key';
      }
      return 'mock-public-key';
    });

    jwtService = new JWTService();
  });

  describe('initialization', () => {
    it('should create RSA key pair if not exists', () => {
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('keys'),
        expect.objectContaining({ recursive: true })
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2); // private and public keys
    });

    it('should load existing keys if they exist', () => {
      mockFs.existsSync.mockReturnValue(true);
      const service = new JWTService();
      
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('private.key')
      );
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('public.key')
      );
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = jwtService.generateAccessToken(mockUser);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should include user data in token payload', () => {
      const token = jwtService.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.organizationId).toBe(mockUser.organizationId);
      expect(decoded.roles).toEqual(mockUser.roles);
      expect(decoded.permissions).toEqual(mockUser.permissions);
    });

    it('should set correct token metadata', () => {
      const token = jwtService.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.iss).toBe('hockey-hub-test');
      expect(decoded.aud).toBe('hockey-hub-api-test');
      expect(decoded.type).toBe('access');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(mockUser.id, 'device-123');
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include minimal data in refresh token', () => {
      const token = jwtService.generateRefreshToken(mockUser.id, 'device-123');
      const decoded = jwt.decode(token) as any;
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.deviceId).toBe('device-123');
      expect(decoded.type).toBe('refresh');
      // Should not include sensitive data
      expect(decoded.email).toBeUndefined();
      expect(decoded.roles).toBeUndefined();
      expect(decoded.permissions).toBeUndefined();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      const token = jwtService.generateAccessToken(mockUser);
      const decoded = await jwtService.verifyAccessToken(token);
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should reject expired tokens', async () => {
      // Create token with past expiration
      const expiredToken = jwt.sign(
        { sub: mockUser.id, type: 'access' },
        'test-secret',
        { expiresIn: '-1h' }
      );

      await expect(jwtService.verifyAccessToken(expiredToken))
        .rejects.toThrow();
    });

    it('should reject tokens with wrong type', async () => {
      const refreshToken = jwtService.generateRefreshToken(mockUser.id, 'device-123');
      
      await expect(jwtService.verifyAccessToken(refreshToken))
        .rejects.toThrow('Invalid token type');
    });

    it('should reject tampered tokens', async () => {
      const token = jwtService.generateAccessToken(mockUser);
      const tamperedToken = token.slice(0, -10) + 'tampered123';
      
      await expect(jwtService.verifyAccessToken(tamperedToken))
        .rejects.toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const token = jwtService.generateRefreshToken(mockUser.id, 'device-123');
      const decoded = await jwtService.verifyRefreshToken(token);
      
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.deviceId).toBe('device-123');
    });

    it('should reject access tokens', async () => {
      const accessToken = jwtService.generateAccessToken(mockUser);
      
      await expect(jwtService.verifyRefreshToken(accessToken))
        .rejects.toThrow('Invalid token type');
    });
  });

  describe('getJWKS', () => {
    it('should return JWKS with public key', () => {
      const jwks = jwtService.getJWKS();
      
      expect(jwks).toHaveProperty('keys');
      expect(Array.isArray(jwks.keys)).toBe(true);
      expect(jwks.keys.length).toBeGreaterThan(0);
      expect(jwks.keys[0]).toHaveProperty('kty');
      expect(jwks.keys[0]).toHaveProperty('kid');
      expect(jwks.keys[0]).toHaveProperty('use', 'sig');
    });
  });

  describe('blacklistToken', () => {
    it('should add token to blacklist', async () => {
      const token = jwtService.generateAccessToken(mockUser);
      const jti = 'unique-token-id';
      
      // Mock token with jti
      jest.spyOn(jwtService as any, 'verifyAccessToken').mockResolvedValueOnce({
        jti,
        exp: Math.floor(Date.now() / 1000) + 3600
      });

      await jwtService.blacklistToken(token);
      
      // Token should now be blacklisted
      const isBlacklisted = await jwtService.isTokenBlacklisted(jti);
      expect(isBlacklisted).toBe(true);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const { accessToken, refreshToken } = jwtService.generateTokenPair(mockUser, 'device-123');
      
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    it('should generate tokens with unique JTIs', () => {
      const pair1 = jwtService.generateTokenPair(mockUser, 'device-123');
      const pair2 = jwtService.generateTokenPair(mockUser, 'device-123');
      
      const decoded1 = jwt.decode(pair1.accessToken) as any;
      const decoded2 = jwt.decode(pair2.accessToken) as any;
      
      expect(decoded1.jti).toBeDefined();
      expect(decoded2.jti).toBeDefined();
      expect(decoded1.jti).not.toBe(decoded2.jti);
    });
  });

  describe('error handling', () => {
    it('should handle malformed tokens gracefully', async () => {
      const malformedToken = 'not-a-valid-jwt';
      
      await expect(jwtService.verifyAccessToken(malformedToken))
        .rejects.toThrow();
    });

    it('should handle missing environment variables', () => {
      delete process.env.JWT_SECRET;
      
      expect(() => new JWTService()).toThrow();
    });
  });

  describe('token expiration', () => {
    it('should respect JWT_EXPIRES_IN environment variable', () => {
      process.env.JWT_EXPIRES_IN = '5m';
      const service = new JWTService();
      const token = service.generateAccessToken(mockUser);
      const decoded = jwt.decode(token) as any;
      
      const expectedExp = Math.floor(Date.now() / 1000) + (5 * 60);
      expect(Math.abs(decoded.exp - expectedExp)).toBeLessThan(5); // Allow 5 second variance
    });

    it('should respect JWT_REFRESH_EXPIRES_IN environment variable', () => {
      process.env.JWT_REFRESH_EXPIRES_IN = '30d';
      const service = new JWTService();
      const token = service.generateRefreshToken(mockUser.id, 'device-123');
      const decoded = jwt.decode(token) as any;
      
      const expectedExp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      expect(Math.abs(decoded.exp - expectedExp)).toBeLessThan(5);
    });
  });
});