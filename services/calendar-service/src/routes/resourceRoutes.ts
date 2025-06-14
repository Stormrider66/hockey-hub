import { Router } from 'express';
import {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    getResourceAvailability,
    getResourcesAvailability
} from '../controllers/resourceController';
import { validate } from '../middleware/validateRequest';
import { createResourceSchema, updateResourceSchema, resourceIdParamSchema } from '../validation/resourceSchemas';

const router = Router();

router.get('/', getAllResources);
router.post('/', validate(createResourceSchema), createResource);
router.get('/:id', validate(resourceIdParamSchema), getResourceById);
router.put('/:id', validate(updateResourceSchema), updateResource);
router.delete('/:id', validate(resourceIdParamSchema), deleteResource);
router.get('/:id/availability', getResourceAvailability);
router.get('/availability', getResourcesAvailability);

export default router; 