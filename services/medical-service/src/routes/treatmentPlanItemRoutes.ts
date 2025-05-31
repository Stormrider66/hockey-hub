import { Router } from 'express';
import { authorize } from '../middleware/auth';
import {
  getTreatmentPlanItems,
  addTreatmentPlanItem,
  updateTreatmentPlanItemHandler,
  deleteTreatmentPlanItemHandler,
} from '../controllers/treatmentPlanItemController';

const router: Router = Router();

// Nested routes for treatment plan items under a plan
router.get(
  '/plans/:planId/items',
  authorize('rehab','coach','admin'),
  getTreatmentPlanItems
);
router.post(
  '/plans/:planId/items',
  authorize('rehab'),
  addTreatmentPlanItem
);

// Top-level routes for updating and deleting items
router.put(
  '/items/:id',
  authorize('rehab'),
  updateTreatmentPlanItemHandler
);
router.delete(
  '/items/:id',
  authorize('rehab','admin'),
  deleteTreatmentPlanItemHandler
);

export default router; 