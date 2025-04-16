import { Router } from 'express';
import {
    getTeamGoals,
    getTeamGoalById,
    createTeamGoalHandler,
    updateTeamGoalHandler,
    deleteTeamGoalHandler
} from '../controllers/goalController';
import { validate } from '../middleware/validateRequest';
import { 
    createTeamGoalSchema, 
    updateTeamGoalSchema, 
    teamGoalIdParamSchema 
} from '../validation/goalSchemas';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

// TODO: Add auth middleware

const router = Router();

// Apply requireAuth to all team goal routes
router.use(requireAuth);

// Routes for /api/v1/team-goals
router.get('/', getTeamGoals);
router.post('/', requireRole(['admin', 'club_admin', 'coach']), validate(createTeamGoalSchema), createTeamGoalHandler);
router.get('/:id', validate(teamGoalIdParamSchema), getTeamGoalById);
router.put('/:id', requireRole(['admin', 'club_admin', 'coach']), validate(updateTeamGoalSchema), updateTeamGoalHandler);
router.delete('/:id', requireRole(['admin', 'club_admin', 'coach']), validate(teamGoalIdParamSchema), deleteTeamGoalHandler);

export default router; 