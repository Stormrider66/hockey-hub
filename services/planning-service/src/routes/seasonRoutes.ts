import { Router } from 'express';
import {
    getSeasons,
    getSeasonById,
    createSeasonHandler,
    updateSeasonHandler,
    deleteSeasonHandler,
    // Placeholders for phases
    getSeasonPhases,
    addSeasonPhase
} from '../controllers/seasonController';
import { validate } from '../middleware/validateRequest';
import { 
    createSeasonSchema, 
    updateSeasonSchema, 
    seasonIdParamSchema 
} from '../validation/seasonSchemas';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

// TODO: Add auth middleware

const router = Router();

// Apply requireAuth to all season routes
router.use(requireAuth);

// Base Season routes
router.get('/', getSeasons);
router.post('/', requireRole(['admin', 'club_admin']), validate(createSeasonSchema), createSeasonHandler);
router.get('/:id', validate(seasonIdParamSchema), getSeasonById);
router.put('/:id', requireRole(['admin', 'club_admin']), validate(updateSeasonSchema), updateSeasonHandler);
router.delete('/:id', requireRole(['admin', 'club_admin']), validate(seasonIdParamSchema), deleteSeasonHandler);

// Nested routes for Season Phases
router.get('/:seasonId/phases', getSeasonPhases);
router.post('/:seasonId/phases', requireRole(['admin', 'club_admin']), addSeasonPhase);
// TODO: Add PUT/DELETE for phases (e.g., /:seasonId/phases/:phaseId)

// TODO: Nested routes for Training Cycles within phases?

export default router; 