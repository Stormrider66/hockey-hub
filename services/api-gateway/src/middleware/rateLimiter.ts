import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General rate limiter for all API endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the authentication rate limit. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

// Rate limiter for password reset endpoints
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'You have exceeded the password reset rate limit. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
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
      retryAfter: req.rateLimit?.resetTime
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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxRequests,
    message: `Rate limit exceeded for ${role} role.`,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.userId || req.ip;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the rate limit for ${role} role. Please try again later.`,
        retryAfter: req.rateLimit?.resetTime
      });
    }
  });
};