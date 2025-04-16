import { Router } from 'express';
import {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getResourceAvailability
} from '../controllers/resourceController';

const router = Router();

router.get('/', getAllResources);
router.post('/', createResource);
router.get('/:id', getResourceById);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);
router.get('/:id/availability', getResourceAvailability);

export default router; 