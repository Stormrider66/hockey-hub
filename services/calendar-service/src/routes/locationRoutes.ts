import { Router } from 'express';
import {
    getAllLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation
} from '../controllers/locationController';
import { validate } from '../middleware/validateRequest';
import { createLocationSchema, updateLocationSchema, locationIdParamSchema } from '../validation/locationSchemas';

const router = Router();

router.get('/', getAllLocations);
router.post('/', validate(createLocationSchema), createLocation);
router.get('/:id', validate(locationIdParamSchema), getLocationById);
router.put('/:id', validate(updateLocationSchema), updateLocation);
router.delete('/:id', validate(locationIdParamSchema), deleteLocation);

// TODO: Add route for getting resources at a location? (GET /:id/resources)

export default router; 