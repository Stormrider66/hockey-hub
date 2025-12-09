import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../authMiddleware';
import { createKeySet, exportJWK, SignJWT } from 'jose';
import * as crypto from 'crypto';

// Mock modules
jest.mock('axios');
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('authMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      USER_SERVICE_URL: 'http://localhost:3001',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    mockReq = {
      headers: {},
      get: jest.fn((header: string) => mockReq.headers?.[header.toLowerCase()]),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Public routes', () => {
    it('should allow access to health check endpoint', async () => {
      mockReq.path = '/health';
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access to login endpoint', async () => {
      mockReq.path = '/api/users/login';
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access to register endpoint', async () => {
      mockReq.path = '/api/users/register';
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access to forgot password endpoint', async () => {
      mockReq.path = '/api/users/forgot-password';
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access to JWKS endpoint', async () => {
      mockReq.path = '/api/users/.well-known/jwks.json';
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Protected routes', () => {
    it('should reject requests without authorization header', async () => {
      mockReq.path = '/api/protected';
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization header provided',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid authorization format', async () => {
      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: 'InvalidFormat' };
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization format',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject requests with empty token', async () => {
      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: 'Bearer ' };
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization format',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed JWT tokens', async () => {
      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: 'Bearer invalid.jwt.token' };
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid JWT tokens and attach user to request', async () => {
      // Generate a test key pair
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Mock JWKS endpoint response
      const axios = require('axios');
      const jwk = await exportJWK(await importKey(publicKey));
      axios.get = jest.fn().mockResolvedValue({
        data: {
          keys: [{ ...jwk, kid: 'test-key-1', use: 'sig', alg: 'RS256' }],
        },
      });

      // Create a valid JWT
      const token = await new SignJWT({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'player',
        organizationId: 'org-123',
        permissions: ['read:profile'],
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(await importKey(privateKey));

      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: `Bearer ${token}` };
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe('user-123');
      expect(mockReq.user?.email).toBe('test@example.com');
      expect(mockReq.user?.role).toBe('player');
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject expired tokens', async () => {
      // Generate a test key pair
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Mock JWKS endpoint response
      const axios = require('axios');
      const jwk = await exportJWK(await importKey(publicKey));
      axios.get = jest.fn().mockResolvedValue({
        data: {
          keys: [{ ...jwk, kid: 'test-key-1', use: 'sig', alg: 'RS256' }],
        },
      });

      // Create an expired JWT
      const token = await new SignJWT({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'player',
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 7200) // 2 hours ago
        .setExpirationTime(Math.floor(Date.now() / 1000) - 3600) // 1 hour ago
        .sign(await importKey(privateKey));

      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: `Bearer ${token}` };
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has expired',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle JWKS fetch errors gracefully', async () => {
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('Network error'));

      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: 'Bearer some.jwt.token' };
      
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should cache JWKS for subsequent requests', async () => {
      // Generate a test key pair
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Mock JWKS endpoint response
      const axios = require('axios');
      const jwk = await exportJWK(await importKey(publicKey));
      axios.get = jest.fn().mockResolvedValue({
        data: {
          keys: [{ ...jwk, kid: 'test-key-1', use: 'sig', alg: 'RS256' }],
        },
      });

      // Create a valid JWT
      const token = await new SignJWT({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'player',
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(await importKey(privateKey));

      mockReq.path = '/api/protected';
      mockReq.headers = { authorization: `Bearer ${token}` };
      
      // First request
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(axios.get).toHaveBeenCalledTimes(1);
      
      // Second request should use cached JWKS
      jest.clearAllMocks();
      await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(axios.get).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Role-based access control', () => {
    // Note: Since the authMiddleware doesn't enforce role-based permissions
    // (that's handled by permission middleware), we just test that the role
    // is properly extracted and attached to the request
    
    it('should extract and attach user role from token', async () => {
      // Generate a test key pair
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Mock JWKS endpoint response
      const axios = require('axios');
      const jwk = await exportJWK(await importKey(publicKey));
      axios.get = jest.fn().mockResolvedValue({
        data: {
          keys: [{ ...jwk, kid: 'test-key-1', use: 'sig', alg: 'RS256' }],
        },
      });

      // Test different roles
      const roles = ['admin', 'coach', 'player', 'parent', 'medical_staff', 'equipment_manager', 'physical_trainer'];
      
      for (const role of roles) {
        const token = await new SignJWT({
          sub: `user-${role}`,
          email: `${role}@example.com`,
          role,
          permissions: [],
        })
          .setProtectedHeader({ alg: 'RS256', kid: 'test-key-1' })
          .setIssuedAt()
          .setExpirationTime('1h')
          .sign(await importKey(privateKey));

        mockReq.path = '/api/protected';
        mockReq.headers = { authorization: `Bearer ${token}` };
        
        await authMiddleware(mockReq as Request, mockRes as Response, mockNext);
        
        expect(mockReq.user?.role).toBe(role);
        expect(mockNext).toHaveBeenCalled();
        
        // Reset for next iteration
        jest.clearAllMocks();
        delete mockReq.user;
      }
    });
  });
});

// Helper function to import keys
async function importKey(pem: string): Promise<CryptoKey> {
  const keyData = pem
    .replace(/-----BEGIN.*-----/g, '')
    .replace(/-----END.*-----/g, '')
    .replace(/\s/g, '');
  const binaryKey = Buffer.from(keyData, 'base64');
  
  const isPrivate = pem.includes('PRIVATE');
  
  return crypto.webcrypto.subtle.importKey(
    isPrivate ? 'pkcs8' : 'spki',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    isPrivate ? ['sign'] : ['verify']
  );
}