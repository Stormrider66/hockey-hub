import { Router } from 'express';
import {
    getDevelopmentPlans,
    getDevelopmentPlanById,
    createDevelopmentPlanHandler,
    updateDevelopmentPlanHandler,
    deleteDevelopmentPlanHandler,
    // Item placeholders
    getDevelopmentPlanItems,
    addDevelopmentPlanItem,
    updateDevelopmentPlanItem,
    deleteDevelopmentPlanItem
} from '../controllers/developmentPlanController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateRequest';
import {
    createDevelopmentPlanSchema,
    updateDevelopmentPlanSchema,
    planIdParamSchema,
    createDevelopmentPlanItemSchema,
    updateDevelopmentPlanItemSchema,
    planItemIdParamSchema
} from '../validation/developmentPlanSchemas';

const router = Router();

// Apply requireAuth to all development plan routes
router.use(requireAuth);

// Base Development Plan routes
router.get('/', getDevelopmentPlans);
router.post('/', requireRole(['admin', 'club_admin', 'coach']), validate(createDevelopmentPlanSchema), createDevelopmentPlanHandler);
router.get('/:id', validate(planIdParamSchema), getDevelopmentPlanById);
router.put('/:id', requireRole(['admin', 'club_admin', 'coach']), validate(updateDevelopmentPlanSchema), updateDevelopmentPlanHandler);
router.delete('/:id', requireRole(['admin', 'club_admin', 'coach']), validate(planIdParamSchema), deleteDevelopmentPlanHandler);

// Nested routes for Development Plan Items
router.get('/:planId/items', validate(planIdParamSchema), getDevelopmentPlanItems);
router.post('/:planId/items', requireRole(['admin', 'club_admin', 'coach']), validate(createDevelopmentPlanItemSchema), addDevelopmentPlanItem);
router.put('/:planId/items/:itemId', requireRole(['admin', 'club_admin', 'coach']), validate(updateDevelopmentPlanItemSchema), updateDevelopmentPlanItem);
router.delete('/:planId/items/:itemId', requireRole(['admin', 'club_admin', 'coach']), validate(planItemIdParamSchema), deleteDevelopmentPlanItem);

export default router; 