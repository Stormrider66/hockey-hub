import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticateToken, checkRole } from '../middleware';
import type { AuthenticatedUser } from '../middleware/authenticateToken';
import { z } from 'zod';
import * as authService from '../services/authService';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types provided by default import
import asyncHandler from 'express-async-handler';

const router: Router = Router();

// ----- Validators --------------------------------------------------------- //
const registerSchemaZod = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['sv', 'en']).default('sv'),
});

const loginSchemaZod = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string() });
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string(), newPassword: z.string().min(8) });

function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Determine prod mode for secure cookies
const isProd = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' as const : 'lax' as const,
};

// --- Authentication Routes --- //

// POST /api/v1/auth/register
router.post(
  '/register',
  validate(registerSchemaZod),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  })
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validate(loginSchemaZod),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log('=== LOGIN ROUTE HIT ===');
    console.log('Request body:', req.body);
    
    const result = await authService.login(req.body);

    // Set cookies
    const accessExpiryMs = 1000 * 60 * 15; // 15m default; keep synced with ACCESS_TOKEN_EXPIRY
    const refreshExpiryMs = 1000 * 60 * 60 * 24 * 7; // 7d default

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: accessExpiryMs,
    });
    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: refreshExpiryMs,
      path: '/api/v1/auth', // limit to auth endpoints
    });

    res.json({ 
      success: true, 
      data: { 
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user 
      } 
    });
  })
);

// POST /api/v1/auth/test - Test route without asyncHandler
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== TEST ROUTE HIT ===');
    console.log('Body:', req.body);
    res.json({ success: true, message: 'Test route works', body: req.body });
  } catch (error) {
    console.error('Test route error:', error);
    next(error);
  }
});

// POST /api/v1/auth/refresh-token
router.post(
  '/refresh-token',
  asyncHandler(async (req: Request, res: Response) => {
    const tokenFromCookie = req.cookies?.refreshToken;
    const token = tokenFromCookie || req.body?.refreshToken;
    if (!token) {
      res.status(400).json({ error: true, message: 'Refresh token missing', code: 'REFRESH_TOKEN_REQUIRED' });
      return;
    }

    const tokens = await authService.refreshToken(token);

    // Rotate cookies
    const accessExpiryMs = 1000 * 60 * 15;
    const refreshExpiryMs = 1000 * 60 * 60 * 24 * 7;

    res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: accessExpiryMs });
    res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: refreshExpiryMs, path: '/api/v1/auth' });

    res.json({ success: true });
  })
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    // Clear cookies
    res.clearCookie('accessToken', { ...cookieOptions });
    res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/v1/auth' });
    res.json({ success: true, message: 'Successfully logged out' });
  })
);

// POST /api/v1/auth/forgot-password
router.post(
  '/forgot-password',
  validate(forgotSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await authService.forgotPassword(req.body);
    res.json({ success: true });
  })
);

// POST /api/v1/auth/reset-password
router.post(
  '/reset-password',
  validate(resetSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await authService.resetPassword(req.body);
    res.json({ success: true });
  })
);

// --- Example Protected Route --- //

// Define response types
interface ErrorResponse {
  error: true;
  message: string;
  code: string;
}

interface SuccessResponse {
  success: true;
  data: Omit<AuthenticatedUser, 'permissions'>;
}

// GET /api/v1/auth/me - Get current authenticated user's profile
router.get(
  '/me',
  (req, res, next) => {
    console.log('=== /auth/me route hit ===');
    console.log('Method:', req.method);
    console.log('User on request:', !!req.user);
    console.log('Headers:', Object.keys(req.headers));
    next();
  },
  authenticateToken,
  (req, res, next) => {
    console.log('=== After authenticateToken ===');
    console.log('User authenticated:', !!req.user);
    if (req.user) {
      console.log('User roles:', req.user.roles);
    }
    next();
  },
  // Example RBAC usage: allow any authenticated role listed below
  checkRole('admin', 'club_admin', 'coach', 'player', 'parent', 'staff', 'medical_staff', 'physical_trainer', 'equipment_manager'),
  (req, res, next) => {
    console.log('=== After checkRole ===');
    console.log('About to enter async handler');
    next();
  },
  asyncHandler(async (req: Request, res: Response<SuccessResponse | ErrorResponse>): Promise<void> => {
    console.log('=== Inside async handler ===');
    if (!req.user) {
      console.log('ERROR: User not found after authentication');
      res.status(401).json({
        error: true,
        message: 'User not found on request after authentication',
        code: 'AUTH_ERROR'
      });
      return;
    }

    console.log('SUCCESS: Returning user profile');
    const { permissions, ...userProfile } = req.user;
    res.status(200).json({
      success: true,
      data: userProfile
    });
  })
);

export default router; 