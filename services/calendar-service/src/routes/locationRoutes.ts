import { Router } from 'express';
import {
    getAllLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation
} from '../controllers/locationController';

const router = Router();

router.get('/', getAllLocations);
router.post('/', createLocation);
router.get('/:id', getLocationById);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

// TODO: Add route for getting resources at a location? (GET /:id/resources)

export default router; 