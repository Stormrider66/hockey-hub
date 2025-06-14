import { Router } from 'express';
import {
    getPlayerGoals,
    getPlayerGoalById,
    createPlayerGoalHandler,
    updatePlayerGoalHandler,
    deletePlayerGoalHandler
} from '../controllers/goalController';
import { validate } from '../middleware/validateRequest';
import { 
    createPlayerGoalSchema, 
    updatePlayerGoalSchema, 
    playerGoalIdParamSchema 
} from '../validation/goalSchemas';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

// TODO: Add auth middleware

const router = Router();

// Apply requireAuth to all player goal routes
router.use(requireAuth);

// Routes for /api/v1/player-goals
router.get('/', getPlayerGoals);
router.post('/', requireRole(['admin', 'club_admin', 'coach', 'player']), validate(createPlayerGoalSchema), createPlayerGoalHandler);
router.get('/:id', validate(playerGoalIdParamSchema), getPlayerGoalById);
router.put('/:id', requireRole(['admin', 'club_admin', 'coach', 'player']), validate(updatePlayerGoalSchema), updatePlayerGoalHandler);
router.delete('/:id', requireRole(['admin', 'club_admin', 'coach', 'player']), validate(playerGoalIdParamSchema), deletePlayerGoalHandler);

export default router; 