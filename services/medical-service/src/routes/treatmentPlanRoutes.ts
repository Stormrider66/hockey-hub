import { Router } from 'express';
import { authorize } from '../middleware/auth';
import {
  getTreatmentPlans,
  addTreatmentPlan,
  updateTreatmentPlanHandler,
  deleteTreatmentPlanHandler,
} from '../controllers/treatmentPlanController';

const router: Router = Router();

// Nested routes for treatment plans under an injury
router.get(
  '/injuries/:injuryId/plans',
  authorize('medical_staff','coach','admin'),
  getTreatmentPlans
);
router.post(
  '/injuries/:injuryId/plans',
  authorize('medical_staff'),
  addTreatmentPlan
);

// Top-level routes for updating and deleting plans
router.put(
  '/plans/:id',
  authorize('medical_staff','admin'),
  updateTreatmentPlanHandler
);
router.delete(
  '/plans/:id',
  authorize('admin'),
  deleteTreatmentPlanHandler
);

export default router; 