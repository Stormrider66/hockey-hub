import { Router } from 'express';
import { checkAuthorizationController } from '../controllers/authorization.controller.js';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// ... (Swagger comments remain the same) ...

router.get(
    '/check',
    authenticateToken,
    checkAuthorizationController
);

export default router; 