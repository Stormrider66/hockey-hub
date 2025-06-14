import { Router } from 'express';
import {
    listDevelopmentPlansHandler,
    getDevelopmentPlanById,
    createDevelopmentPlanHandler,
    updateDevelopmentPlanHandler,
    deleteDevelopmentPlanHandler,
    addDevelopmentPlanItemHandler,
    updateDevelopmentPlanItemHandler,
    deleteDevelopmentPlanItem,
    listDevelopmentPlanItemsHandler
} from '../controllers/developmentPlanController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validateRequest';
import {
    createDevelopmentPlanSchema,
    updateDevelopmentPlanSchema,
    planIdParamSchema,
    createDevelopmentPlanItemSchema,
    updateDevelopmentPlanItemSchema,
    planItemIdParamSchema,
    listDevelopmentPlansQuerySchema
} from '../validation/developmentPlanSchemas';

const router: Router = Router();

// Apply requireAuth to all development plan routes
router.use(requireAuth);

// Base Development Plan routes
router.get('/', validate(listDevelopmentPlansQuerySchema), listDevelopmentPlansHandler);
router.post('/', requireRole(['admin', 'club_admin', 'coach']), validate(createDevelopmentPlanSchema), createDevelopmentPlanHandler);
router.get('/:planId', validate(planIdParamSchema), getDevelopmentPlanById);
router.put('/:planId', requireRole(['admin', 'club_admin', 'coach']), validate(updateDevelopmentPlanSchema), updateDevelopmentPlanHandler);
router.delete('/:planId', requireRole(['admin', 'club_admin', 'coach']), validate(planIdParamSchema), deleteDevelopmentPlanHandler);
router.get('/:planId/items', validate(planIdParamSchema), listDevelopmentPlanItemsHandler);

// Nested routes for Development Plan Items
router.post('/:planId/items', requireRole(['admin', 'club_admin', 'coach']), validate(createDevelopmentPlanItemSchema), addDevelopmentPlanItemHandler);
router.put('/:planId/items/:itemId', requireRole(['admin', 'club_admin', 'coach']), validate(updateDevelopmentPlanItemSchema), updateDevelopmentPlanItemHandler);
router.delete('/:planId/items/:itemId', requireRole(['admin', 'club_admin', 'coach']), validate(planItemIdParamSchema), deleteDevelopmentPlanItem);

export default router; 