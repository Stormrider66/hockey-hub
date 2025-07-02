import request from 'supertest';
import express from 'express';
import { createRateLimiter } from './rateLimiter';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Mock the rate limiter
jest.mock('rate-limiter-flexible');

describe('Rate Limiter Integration Tests', () => {
  let app: express.Express;
  let mockConsume: jest.Mock;
  let mockDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock functions
    mockConsume = jest.fn();
    mockDelete = jest.fn();
    
    // Mock RateLimiterMemory
    (RateLimiterMemory as jest.Mock).mockImplementation(() => ({
      consume: mockConsume,
      delete: mockDelete,
      block: jest.fn(),
      reward: jest.fn(),
      penalty: jest.fn()
    }));
    
    // Setup express app
    app = express();
    app.use(express.json());
  });

  describe('General Rate Limiting', () => {
    beforeEach(() => {
      const generalLimiter = createRateLimiter();
      app.use(generalLimiter);
      
      app.get('/api/test', (req, res) => {
        res.json({ message: 'Success' });
      });
    });

    it('should allow requests within rate limit', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 99, msBeforeNext: 0 });

      const response = await request(app)
        .get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Success' });
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('99');
    });

    it('should block requests exceeding rate limit', async () => {
      mockConsume.mockRejectedValue({
        remainingPoints: 0,
        msBeforeNext: 60000,
        totalPoints: 100,
        consumedPoints: 100
      });

      const response = await request(app)
        .get('/api/test');

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        message: 'Too many requests'
      });
      expect(response.headers['retry-after']).toBe('60');
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('should use IP address as key', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 50 });

      await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.100');

      expect(mockConsume).toHaveBeenCalledWith('192.168.1.100', 1);
    });

    it('should handle multiple IPs in X-Forwarded-For', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 50 });

      await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.100, 10.0.0.1, 172.16.0.1');

      // Should use the first IP (client IP)
      expect(mockConsume).toHaveBeenCalledWith('192.168.1.100', 1);
    });
  });

  describe('Auth Rate Limiting', () => {
    beforeEach(() => {
      const authLimiter = createRateLimiter({
        points: 5,
        duration: 900, // 15 minutes
        keyPrefix: 'auth'
      });
      
      app.post('/api/auth/login', authLimiter, (req, res) => {
        res.json({ token: 'fake-token' });
      });
      
      app.post('/api/auth/register', authLimiter, (req, res) => {
        res.status(201).json({ message: 'Registered' });
      });
    });

    it('should apply stricter limits to auth endpoints', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 4 });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('5');
      expect(response.headers['x-ratelimit-remaining']).toBe('4');
    });

    it('should block after 5 failed auth attempts', async () => {
      mockConsume.mockRejectedValue({
        remainingPoints: 0,
        msBeforeNext: 900000, // 15 minutes
        totalPoints: 5,
        consumedPoints: 5
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(response.status).toBe(429);
      expect(response.headers['retry-after']).toBe('900');
    });
  });

  describe('Role-Based Rate Limiting', () => {
    beforeEach(() => {
      // Middleware to set user role
      app.use((req, res, next) => {
        if (req.headers.authorization) {
          (req as any).user = {
            id: 'user-123',
            roles: req.headers['x-test-role']?.toString().split(',') || ['player']
          };
        }
        next();
      });

      const roleLimiter = createRateLimiter();
      app.use(roleLimiter);
      
      app.get('/api/data', (req, res) => {
        res.json({ data: 'Success' });
      });
    });

    it('should apply higher limits for admin users', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 999 });

      const response = await request(app)
        .get('/api/data')
        .set('Authorization', 'Bearer token')
        .set('X-Test-Role', 'admin');

      // Should use user ID as key for authenticated users
      expect(mockConsume).toHaveBeenCalledWith('user:user-123', 1);
    });

    it('should apply standard limits for regular users', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 99 });

      const response = await request(app)
        .get('/api/data')
        .set('Authorization', 'Bearer token')
        .set('X-Test-Role', 'player');

      expect(mockConsume).toHaveBeenCalledWith('user:user-123', 1);
    });

    it('should use IP for unauthenticated requests', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 50 });

      await request(app)
        .get('/api/data');

      expect(mockConsume).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+\.\d+$/), 1);
    });
  });

  describe('Password Reset Rate Limiting', () => {
    beforeEach(() => {
      const resetLimiter = createRateLimiter({
        points: 3,
        duration: 3600, // 1 hour
        keyPrefix: 'reset'
      });
      
      app.post('/api/auth/forgot-password', resetLimiter, (req, res) => {
        res.json({ message: 'Email sent' });
      });
    });

    it('should limit password reset requests strictly', async () => {
      mockConsume.mockResolvedValue({ remainingPoints: 2 });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBe('3');
      expect(response.headers['x-ratelimit-remaining']).toBe('2');
    });

    it('should block after 3 password reset attempts', async () => {
      mockConsume.mockRejectedValue({
        remainingPoints: 0,
        msBeforeNext: 3600000,
        totalPoints: 3
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many password reset attempts');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      app.use(createRateLimiter());
      app.get('/api/test', (req, res) => res.json({ ok: true }));
    });

    it('should handle rate limiter errors gracefully', async () => {
      mockConsume.mockRejectedValue(new Error('Redis connection failed'));

      const response = await request(app)
        .get('/api/test');

      // Should allow request through on error
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('should log errors but not expose them', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockConsume.mockRejectedValue(new Error('Internal error'));

      await request(app).get('/api/test');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Rate limiter error:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Headers', () => {
    beforeEach(() => {
      app.use(createRateLimiter());
      app.get('/api/test', (req, res) => res.json({ ok: true }));
    });

    it('should include rate limit headers in response', async () => {
      mockConsume.mockResolvedValue({ 
        remainingPoints: 75,
        msBeforeNext: 45000,
        consumedPoints: 25,
        isFirstInDuration: false
      });

      const response = await request(app)
        .get('/api/test');

      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBe('75');
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });

    it('should set Retry-After header when rate limited', async () => {
      mockConsume.mockRejectedValue({
        remainingPoints: 0,
        msBeforeNext: 30000,
        totalPoints: 100
      });

      const response = await request(app)
        .get('/api/test');

      expect(response.headers['retry-after']).toBe('30');
      expect(response.headers['x-ratelimit-remaining']).toBe('0');
    });
  });

  describe('Distributed Rate Limiting', () => {
    it('should create memory-based limiter when Redis not available', () => {
      createRateLimiter();
      
      expect(RateLimiterMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          points: 100,
          duration: 60
        })
      );
    });

    it('should handle concurrent requests properly', async () => {
      app.use(createRateLimiter());
      app.get('/api/test', (req, res) => res.json({ ok: true }));
      
      mockConsume
        .mockResolvedValueOnce({ remainingPoints: 99 })
        .mockResolvedValueOnce({ remainingPoints: 98 })
        .mockResolvedValueOnce({ remainingPoints: 97 });

      // Simulate concurrent requests
      const requests = [
        request(app).get('/api/test'),
        request(app).get('/api/test'),
        request(app).get('/api/test')
      ];

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(mockConsume).toHaveBeenCalledTimes(3);
    });
  });
});