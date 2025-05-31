import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { updateTreatmentHandler, deleteTreatmentHandler } from '../controllers/injuryController';

const router: Router = Router();

// Routes for /api/v1/treatments
router.put('/:id', authorize('rehab'), updateTreatmentHandler);
router.delete('/:id', authorize('rehab','admin'), deleteTreatmentHandler);

export default router; 