import { Router } from 'express';
import {
    getSeasons,
    getSeasonById,
    createSeasonHandler,
    updateSeasonHandler,
    deleteSeasonHandler,
    // Placeholders for phases
    getSeasonPhases,
    addSeasonPhase,
    updateSeasonPhase,
    deleteSeasonPhase
} from '../controllers/seasonController';
import { validate } from '../middleware/validateRequest';
import { 
    createSeasonSchema, 
    updateSeasonSchema, 
    singleSeasonIdParamSchema,
    createSeasonPhaseSchema, 
    updateSeasonPhaseSchema,
    seasonAndPhaseIdParamSchema,
    seasonIdParamSchema,
    listSeasonsQuerySchema
} from '../validation/seasonSchemas';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import trainingCycleRoutes from './trainingCycleRoutes';

// TODO: Add auth middleware

const router: Router = Router();

// Apply requireAuth to all season routes
router.use(requireAuth);

// Base Season routes
router.get('/', validate(listSeasonsQuerySchema), getSeasons);
router.post('/', requireRole(['admin', 'club_admin']), validate(createSeasonSchema), createSeasonHandler);
router.get('/:id', validate(singleSeasonIdParamSchema), getSeasonById);
router.put('/:id', requireRole(['admin', 'club_admin']), validate(updateSeasonSchema), updateSeasonHandler);
router.delete('/:id', requireRole(['admin', 'club_admin']), validate(singleSeasonIdParamSchema), deleteSeasonHandler);

// Nested routes for Season Phases
router.get('/:seasonId/phases', validate(seasonIdParamSchema), getSeasonPhases);
router.post('/:seasonId/phases', requireRole(['admin', 'club_admin', 'coach']), validate(createSeasonPhaseSchema), addSeasonPhase);
router.put('/:seasonId/phases/:phaseId', requireRole(['admin', 'club_admin', 'coach']), validate(updateSeasonPhaseSchema), updateSeasonPhase);
router.delete('/:seasonId/phases/:phaseId', requireRole(['admin', 'club_admin', 'coach']), validate(seasonAndPhaseIdParamSchema), deleteSeasonPhase);

// Nested routes for Training Cycles within phases
router.use('/:seasonId/phases/:phaseId/cycles', trainingCycleRoutes);

export default router; 