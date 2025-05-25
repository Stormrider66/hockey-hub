import { Router } from 'express';
import { validate } from '../middleware/validateRequest';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import {
  createTrainingCycleSchema,
  updateTrainingCycleSchema,
  trainingCycleIdParamSchema,
} from '../validation/trainingCycleSchemas';
import {
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle,
} from '../controllers/trainingCycleController';

const router: Router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getCycles);
router.post('/', requireRole(['admin', 'club_admin', 'coach']), validate(createTrainingCycleSchema), createCycle);
router.get('/:cycleId', validate(trainingCycleIdParamSchema), getCycleById);
router.put('/:cycleId', requireRole(['admin', 'club_admin', 'coach']), validate(updateTrainingCycleSchema), updateCycle);
router.delete('/:cycleId', requireRole(['admin', 'club_admin', 'coach']), validate(trainingCycleIdParamSchema), deleteCycle);

export default router; 