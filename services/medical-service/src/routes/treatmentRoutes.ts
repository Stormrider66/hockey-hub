import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { updateTreatmentHandler, deleteTreatmentHandler } from '../controllers/injuryController';

const router: Router = Router();

// Routes for /api/v1/treatments
router.put('/:id', authorize('medical_staff'), updateTreatmentHandler);
router.delete('/:id', authorize('medical_staff','admin'), deleteTreatmentHandler);

export default router; 