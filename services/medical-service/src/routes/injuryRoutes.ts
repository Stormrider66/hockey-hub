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
router.get('/', authorize('medical_staff','coach','admin'), getInjuries);
router.post('/', authorize('medical_staff','coach','admin'), createInjuryHandler);
router.get('/:id', authorize('medical_staff','coach','admin'), getInjuryById);
router.put('/:id', authorize('medical_staff','admin'), updateInjuryHandler);
router.delete('/:id', authorize('admin'), deleteInjuryHandler);

// Nested routes for injury updates
router.get('/:injuryId/updates', authorize('medical_staff','coach','admin'), getInjuryUpdates);
router.post('/:injuryId/updates', authorize('medical_staff'), addInjuryUpdate);

// Nested routes for injury treatments
router.get('/:injuryId/treatments', authorize('medical_staff','coach','admin'), getInjuryTreatments);
router.post('/:injuryId/treatments', authorize('medical_staff'), addInjuryTreatment);

export default router; 