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
  authorize('medical_staff','coach','admin'),
  getTreatmentPlanItems
);
router.post(
  '/plans/:planId/items',
  authorize('medical_staff'),
  addTreatmentPlanItem
);

// Top-level routes for updating and deleting items
router.put(
  '/items/:id',
  authorize('medical_staff'),
  updateTreatmentPlanItemHandler
);
router.delete(
  '/items/:id',
  authorize('medical_staff','admin'),
  deleteTreatmentPlanItemHandler
);

export default router; 