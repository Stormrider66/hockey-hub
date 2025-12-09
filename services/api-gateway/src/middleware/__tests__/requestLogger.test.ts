import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../requestLogger';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345'),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    http: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('requestLogger', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let logger: any;

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      method: 'GET',
      originalUrl: '/api/users/123',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest Test Agent',
        'content-length': '256',
      },
      user: undefined,
      get: jest.fn((header: string) => mockReq.headers?.[header.toLowerCase()]),
    };

    // Setup mock response
    const responseData = { data: [] };
    mockRes = {
      statusCode: 200,
      locals: {},
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'finish') {
          // Simulate response finish
          setTimeout(() => callback(), 10);
        }
      }),
      removeListener: jest.fn(),
      get: jest.fn((header: string) => {
        if (header.toLowerCase() === 'content-length') return '1024';
        return undefined;
      }),
    };

    mockNext = jest.fn();

    // Get logger mock
    logger = require('../../utils/logger').default;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Request ID generation', () => {
    it('should generate and attach request ID to request and response', async () => {
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe('mock-uuid-12345');
      expect(mockRes.locals).toHaveProperty('requestId', 'mock-uuid-12345');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing x-request-id header if provided', async () => {
      mockReq.headers = {
        ...mockReq.headers,
        'x-request-id': 'existing-request-id',
      };

      await requestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.id).toBe('existing-request-id');
      expect(mockRes.locals).toHaveProperty('requestId', 'existing-request-id');
    });
  });

  describe('Request logging', () => {
    it('should log incoming request details', async () => {
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.http).toHaveBeenCalledWith('Incoming request', {
        requestId: 'mock-uuid-12345',
        method: 'GET',
        url: '/api/users/123',
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent',
        userId: undefined,
      });
    });

    it('should include user ID if authenticated', async () => {
      mockReq.user = { id: 'user-123', email: 'test@example.com', role: 'player' };

      await requestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.http).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        userId: 'user-123',
      }));
    });

    it('should handle missing headers gracefully', async () => {
      mockReq.headers = {};
      mockReq.get = jest.fn(() => undefined);

      await requestLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.http).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        userAgent: undefined,
      }));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Response logging', () => {
    it('should log response details on finish', async () => {
      jest.useFakeTimers();
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      // Fast-forward timers to trigger the finish event
      jest.advanceTimersByTime(10);
      
      // Wait for next tick
      await Promise.resolve();
      
      expect(logger.http).toHaveBeenCalledWith('Outgoing response', expect.objectContaining({
        requestId: 'mock-uuid-12345',
        method: 'GET',
        url: '/api/users/123',
        statusCode: 200,
        contentLength: '1024',
        duration: expect.any(Number),
      }));
      
      jest.useRealTimers();
    });

    it('should calculate response duration', async () => {
      jest.useFakeTimers();

      // For this specific test, make the finish event fire after 150ms
      (mockRes as any).on = jest.fn((event: string, callback: Function) => {
        if (event === 'finish') {
          setTimeout(() => callback(), 150);
        }
      });

      await requestLogger(mockReq as Request, mockRes as Response, mockNext);

      // Advance the fake timers to trigger the finish handler
      jest.advanceTimersByTime(150);
      await Promise.resolve();

      const logCall = logger.http.mock.calls.find(
        (call: any[]) => call[0] === 'Outgoing response'
      );

      expect(logCall).toBeDefined();
      expect(logCall[1].duration).toBeGreaterThanOrEqual(150);

      jest.useRealTimers();
    });

    it('should handle different status codes', async () => {
      mockRes.statusCode = 404;
      jest.useFakeTimers();
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      jest.advanceTimersByTime(10);
      await Promise.resolve();
      
      expect(logger.http).toHaveBeenCalledWith('Outgoing response', expect.objectContaining({
        statusCode: 404,
      }));
      
      jest.useRealTimers();
    });
  });

  describe('Error handling', () => {
    it('should pass through errors from next middleware', async () => {
      const error = new Error('Test error');
      mockNext = jest.fn(() => {
        throw error;
      });

      await expect(async () => {
        await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      }).rejects.toThrow('Test error');

      expect(mockNext).toHaveBeenCalled();
    });

    it('should still log response on error', async () => {
      mockRes.statusCode = 500;
      jest.useFakeTimers();
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      jest.advanceTimersByTime(10);
      await Promise.resolve();
      
      expect(logger.http).toHaveBeenCalledWith('Outgoing response', expect.objectContaining({
        statusCode: 500,
      }));
      
      jest.useRealTimers();
    });
  });

  describe('Special routes', () => {
    it('should handle health check requests', async () => {
      mockReq.originalUrl = '/health';
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      expect(logger.http).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        url: '/health',
      }));
    });

    it('should handle requests with query parameters', async () => {
      mockReq.originalUrl = '/api/users?page=1&limit=10';
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      expect(logger.http).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        url: '/api/users?page=1&limit=10',
      }));
    });

    it('should handle requests with long URLs', async () => {
      const longUrl = '/api/users/' + 'a'.repeat(2000);
      mockReq.originalUrl = longUrl;
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      expect(logger.http).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
        url: longUrl,
      }));
    });
  });

  describe('Performance considerations', () => {
    it('should not block request processing', async () => {
      const startTime = Date.now();
      
      await requestLogger(mockReq as Request, mockRes as Response, mockNext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10); // Should be very fast
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle high-frequency requests', async () => {
      const requests = Array(100).fill(null).map((_, i) => ({
        ...mockReq,
        originalUrl: `/api/endpoint-${i}`,
      }));

      const startTime = Date.now();
      
      for (const req of requests) {
        await requestLogger(req as Request, mockRes as Response, mockNext);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should handle 100 requests quickly
      expect(mockNext).toHaveBeenCalledTimes(100);
    });
  });
});