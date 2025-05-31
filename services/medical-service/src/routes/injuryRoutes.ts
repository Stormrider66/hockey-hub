import { Router } from 'express';
import { authorize } from '../middleware/auth';
import {
    getInjuries,
    getInjuryById,
    createInjuryHandler,
    updateInjuryHandler,
    deleteInjuryHandler,
    // Placeholders for related resources
    getInjuryUpdates,
    addInjuryUpdate,
    getInjuryTreatments,
    addInjuryTreatment
} from '../controllers/injuryController';

// TODO: Add auth middleware

const router: Router = Router();

// Routes for /api/v1/injuries
router.get('/', authorize('rehab','coach','admin'), getInjuries);
router.post('/', authorize('rehab','coach','admin'), createInjuryHandler);
router.get('/:id', authorize('rehab','coach','admin'), getInjuryById);
router.put('/:id', authorize('rehab','admin'), updateInjuryHandler);
router.delete('/:id', authorize('admin'), deleteInjuryHandler);

// Nested routes for injury updates
router.get('/:injuryId/updates', authorize('rehab','coach','admin'), getInjuryUpdates);
router.post('/:injuryId/updates', authorize('rehab'), addInjuryUpdate);

// Nested routes for injury treatments
router.get('/:injuryId/treatments', authorize('rehab','coach','admin'), getInjuryTreatments);
router.post('/:injuryId/treatments', authorize('rehab'), addInjuryTreatment);

export default router; 