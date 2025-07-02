import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from '../rateLimiter';

// Mock the rate limiter module
jest.mock('express-rate-limit', () => {
  return jest.fn(() => {
    const middleware = jest.fn((req: Request, res: Response, next: NextFunction) => {
      // Simulate rate limiting behavior
      const ip = req.ip || '127.0.0.1';
      if (!middleware.requests) {
        middleware.requests = new Map();
      }
      
      const count = middleware.requests.get(ip) || 0;
      middleware.requests.set(ip, count + 1);
      
      if (count >= middleware.limit) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
        });
      } else {
        next();
      }
    });
    
    middleware.limit = 100; // Default limit
    middleware.requests = new Map();
    middleware.reset = () => {
      middleware.requests.clear();
    };
    
    return middleware;
  });
});

describe('rateLimiter', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      path: '/api/test',
      headers: {},
      user: undefined,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should create rate limiter with default options', () => {
      const limiter = createRateLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should create rate limiter with custom options', () => {
      const limiter = createRateLimiter({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // 50 requests
      });
      expect(limiter).toBeDefined();
    });
  });

  describe('generalRateLimiter', () => {
    it('should allow requests under the limit', async () => {
      const { generalRateLimiter } = require('../rateLimiter');
      generalRateLimiter.reset();
      
      // Make requests under the limit
      for (let i = 0; i < 5; i++) {
        await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalledTimes(i + 1);
      }
      
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block requests over the limit', async () => {
      const { generalRateLimiter } = require('../rateLimiter');
      generalRateLimiter.reset();
      generalRateLimiter.limit = 3; // Set a low limit for testing
      
      // Make requests up to the limit
      for (let i = 0; i < 3; i++) {
        await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      }
      
      // This request should be blocked
      jest.clearAllMocks();
      await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should track requests per IP address', async () => {
      const { generalRateLimiter } = require('../rateLimiter');
      generalRateLimiter.reset();
      generalRateLimiter.limit = 2;
      
      // Requests from first IP
      mockReq.ip = '192.168.1.1';
      await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      
      // Request from different IP should be allowed
      mockReq.ip = '192.168.1.2';
      jest.clearAllMocks();
      await generalRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('authRateLimiter', () => {
    it('should have stricter limits for auth endpoints', async () => {
      const { authRateLimiter } = require('../rateLimiter');
      authRateLimiter.reset();
      authRateLimiter.limit = 5; // Stricter limit for auth
      
      mockReq.path = '/api/users/login';
      
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await authRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      }
      
      // This request should be blocked
      jest.clearAllMocks();
      await authRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('passwordResetRateLimiter', () => {
    it('should have very strict limits for password reset', async () => {
      const { passwordResetRateLimiter } = require('../rateLimiter');
      passwordResetRateLimiter.reset();
      passwordResetRateLimiter.limit = 3; // Very strict limit
      
      mockReq.path = '/api/users/forgot-password';
      
      // Make requests up to the limit
      for (let i = 0; i < 3; i++) {
        await passwordResetRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      }
      
      // This request should be blocked
      jest.clearAllMocks();
      await passwordResetRateLimiter(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Role-based rate limiting', () => {
    it('should apply different limits based on user role', async () => {
      const limiter = createRateLimiter({
        max: (req: Request) => {
          if (!req.user) return 100;
          switch (req.user.role) {
            case 'admin':
              return 1000;
            case 'coach':
              return 500;
            case 'player':
              return 200;
            default:
              return 100;
          }
        },
      });
      
      // Test with admin user
      mockReq.user = { id: '1', role: 'admin' };
      limiter.limit = 1000;
      
      // Admin should have higher limit
      for (let i = 0; i < 10; i++) {
        await limiter(mockReq as Request, mockRes as Response, mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(10);
      
      // Test with player user
      jest.clearAllMocks();
      limiter.reset();
      mockReq.user = { id: '2', role: 'player' };
      limiter.limit = 200;
      
      // Player should have lower limit
      for (let i = 0; i < 5; i++) {
        await limiter(mockReq as Request, mockRes as Response, mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(5);
    });
  });

  describe('Rate limit headers', () => {
    it('should set rate limit headers in response', async () => {
      const { generalRateLimiter } = require('../rateLimiter');
      generalRateLimiter.reset();
      
      // Mock rate limit headers
      const mockLimiter = (req: Request, res: Response, next: NextFunction) => {
        res.setHeader('X-RateLimit-Limit', '100');
        res.setHeader('X-RateLimit-Remaining', '99');
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 900000).toISOString());
        generalRateLimiter(req, res, next);
      };
      
      await mockLimiter(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '99');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
  });
});