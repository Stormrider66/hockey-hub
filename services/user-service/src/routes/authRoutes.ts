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
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/auth/refresh-token
// No specific Zod schema needed here as we just check for req.body.refreshToken in the controller
router.post('/refresh-token', validate(refreshSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tokens = await authService.refreshToken(req.body.refreshToken);
  res.json({ success: true, data: tokens });
}));

// POST /api/v1/auth/logout
// No specific Zod schema needed here as we just check for req.body.refreshToken in the controller
router.post('/logout', validate(refreshSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await authService.logout(req.body.refreshToken);
  res.json({ success: true, message: 'Successfully logged out' });
}));

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
  authenticateToken,
  // Example RBAC usage: allow any authenticated role listed below
  checkRole('admin', 'club_admin', 'coach', 'player', 'parent', 'staff'),
  async (req: Request, res: Response<SuccessResponse | ErrorResponse>) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'User not found on request after authentication',
        code: 'AUTH_ERROR'
      });
    }

    const { permissions, ...userProfile } = req.user;
    return res.status(200).json({
      success: true,
      data: userProfile
    });
  }
);

export default router; 