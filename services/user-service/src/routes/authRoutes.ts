import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateRequest, authenticateToken } from '../middleware';
import type { AuthenticatedUser } from '../middleware/authenticateToken';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/authValidations';
import {
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from '../controllers/authController';

const router = Router();

// --- Authentication Routes --- //

// POST /api/v1/auth/register
router.post(
  '/register',
  validateRequest(registerSchema),
  registerHandler
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validateRequest(loginSchema),
  loginHandler
);

// POST /api/v1/auth/refresh-token
// No specific Zod schema needed here as we just check for req.body.refreshToken in the controller
router.post('/refresh-token', refreshTokenHandler);

// POST /api/v1/auth/logout
// No specific Zod schema needed here as we just check for req.body.refreshToken in the controller
router.post('/logout', authenticateToken, logoutHandler);

// POST /api/v1/auth/forgot-password
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  forgotPasswordHandler
);

// POST /api/v1/auth/reset-password
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  resetPasswordHandler
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