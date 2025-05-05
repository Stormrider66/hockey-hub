import { Router } from 'express';
import { registerHandler, loginHandler } from '../controllers/authController';
import { validateRequest } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validations/authValidations';

/**
 * Authentication routes handler
 * Defines validation for authentication operations using Zod schemas
 * 
 * TODO: This implementation uses Zod for validation instead of express-validator
 * to avoid TypeScript type conflicts with express-validator. A more permanent fix
 * would be to address the ts-node version conflict (needs ^10.7.0 for typeorm, but
 * other dependencies require ^9.1.1).
 */
const router = Router();

// /register endpoint with Zod validation
router.post('/register',
  validateRequest(registerSchema),
  registerHandler
);

// /login endpoint with Zod validation
router.post('/login',
  validateRequest(loginSchema),
  loginHandler
);

export default router; 