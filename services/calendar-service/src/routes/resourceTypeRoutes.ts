import { Router } from 'express';
import {
    getAllResourceTypes,
    getResourceTypeById,
    createResourceType,
    updateResourceType,
    deleteResourceType
} from '../controllers/resourceController';
import { validate } from '../middleware/validateRequest';
import { createResourceTypeSchema, updateResourceTypeSchema, resourceTypeIdParamSchema } from '../validation/resourceTypeSchemas';

const router = Router();

router.get('/', getAllResourceTypes);
router.post('/', validate(createResourceTypeSchema), createResourceType);
router.get('/:id', validate(resourceTypeIdParamSchema), getResourceTypeById);
router.put('/:id', validate(updateResourceTypeSchema), updateResourceType);
router.delete('/:id', validate(resourceTypeIdParamSchema), deleteResourceType);

export default router; 