import { Router } from 'express';
import {
    getAllResourceTypes,
    getResourceTypeById,
    createResourceType,
    updateResourceType,
    deleteResourceType
} from '../controllers/resourceController';

const router = Router();

router.get('/', getAllResourceTypes);
router.post('/', createResourceType);
router.get('/:id', getResourceTypeById);
router.put('/:id', updateResourceType);
router.delete('/:id', deleteResourceType);

export default router; 