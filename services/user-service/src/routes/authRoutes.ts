import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { validateBody, sanitize } from '@hockey-hub/shared-lib/dist/middleware';
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from '@hockey-hub/shared-lib/dist/dto';

const router = Router();
const authController = new AuthController();

// Apply sanitization to all routes
router.use(sanitize({
  stripHtml: true,
  trimStrings: true,
  removeNullBytes: true
}));

// Public routes with validation
router.post('/login', validateBody(LoginDto), authController.login);
router.post('/register', validateBody(RegisterDto), authController.register);
router.post('/refresh', validateBody(RefreshTokenDto), authController.refreshToken);
router.post('/forgot-password', validateBody(ForgotPasswordDto), authController.forgotPassword);
router.post('/reset-password', validateBody(ResetPasswordDto), authController.resetPassword);

// Protected routes with validation
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, validateBody(ChangePasswordDto), authController.changePassword);

export default router;