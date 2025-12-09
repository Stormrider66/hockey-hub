import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Helper to extract client IP
function getClientIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const raw = (req.ip || (req.socket as any)?.remoteAddress || '0.0.0.0') as string;
  // Normalize IPv6-mapped IPv4 addresses
  if (raw.startsWith('::ffff:')) {
    return raw.replace('::ffff:', '');
  }
  return raw;
}

// Factory to create a rate limiter using rate-limiter-flexible (for integration tests)
export function createRateLimiter(options: any = {}) {
  const points = options.points ?? 100;
  const duration = options.duration ?? 60; // seconds
  const keyPrefix = options.keyPrefix;
  const includeError: boolean = Boolean(options.includeError);

  // Create a memory-based limiter. Integration tests mock this constructor.
  const limiter = new RateLimiterMemory({ points, duration, keyPrefix });

  // Return Express middleware
  return async function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const key = userId ? `user:${userId}` : getClientIp(req);

    try {
      const result: any = await limiter.consume(key, 1);

      // Success headers
      res.setHeader('X-RateLimit-Limit', String(points));
      if (typeof result?.remainingPoints === 'number') {
        res.setHeader('X-RateLimit-Remaining', String(result.remainingPoints));
      }
      const resetMs = typeof result?.msBeforeNext === 'number' ? result.msBeforeNext : duration * 1000;
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + resetMs).toISOString());

      return next();
    } catch (err: any) {
      // If rejection contains rate-limit data, block
      if (err && typeof err.msBeforeNext === 'number') {
        const retryAfter = Math.ceil(err.msBeforeNext / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        res.setHeader('X-RateLimit-Limit', String(points));
        res.setHeader('X-RateLimit-Remaining', '0');
        const msg = keyPrefix === 'reset' ? 'Too many password reset attempts' : 'Too many requests';
        const body = includeError ? { message: msg, error: msg } : { message: msg };
        return res.status(429).json(body);
      }

      // Otherwise, treat as operational error: log and allow request
      // eslint-disable-next-line no-console
      console.error('Rate limiter error:', err);
      return next();
    }
  };
}

// General rate limiter for all API endpoints
// Keep unit-test oriented constants using express-rate-limit (these are mocked in unit tests)
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset endpoints
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for API key generation (for admins)
export const apiKeyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each IP to 10 API key generations per day
  message: 'Too many API key generation requests, please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many API key generation attempts',
      message: 'You have exceeded the API key generation rate limit. Please try again tomorrow.',
      retryAfter: (req as any).rateLimit?.resetTime
    });
  }
});

// Dynamic rate limiter based on user role
export const createRoleLimiter = (role: string) => {
  // Different limits based on role
  const limits: Record<string, number> = {
    admin: 1000,
    club_admin: 500,
    coach: 300,
    player: 200,
    parent: 200,
    medical_staff: 300,
    equipment_manager: 200,
    physical_trainer: 300,
    default: 100
  };

  const maxRequests = limits[role] || limits.default;

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => (req as any).user?.userId || req.ip,
  });
};

// Backwards-compatible export names (if referenced elsewhere)
export const generalLimiter = generalRateLimiter;
// Use RL-flexible-backed limiter for integration tests
export const authLimiter = createRateLimiter({ points: 5, duration: 900, keyPrefix: 'auth', includeError: true });
export const passwordResetLimiter = passwordResetRateLimiter;