import { Router } from 'express';
import { checkPermission } from '../controllers/authorizationController';
import { authenticateToken } from '../middleware/authenticateToken';

const router: Router = Router();

// ... (Swagger comments remain the same) ...

router.get(
    '/check',
    authenticateToken,
    checkPermission
);

export default router; 