import { Router } from 'express';
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

const router = Router();

// Routes for /api/v1/injuries
router.get('/', getInjuries);
router.post('/', createInjuryHandler);
router.get('/:id', getInjuryById);
router.put('/:id', updateInjuryHandler);
router.delete('/:id', deleteInjuryHandler);

// Nested routes for injury updates
router.get('/:injuryId/updates', getInjuryUpdates);
router.post('/:injuryId/updates', addInjuryUpdate);

// Nested routes for injury treatments
router.get('/:injuryId/treatments', getInjuryTreatments);
router.post('/:injuryId/treatments', addInjuryTreatment);

export default router; 