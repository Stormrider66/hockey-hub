import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { getAvailability, setAvailability } from '../controllers/playerAvailabilityController';

const router: Router = Router();

// Player availability status endpoints
router.get(
  '/players/:playerId/availability',
  authorize('rehab','coach','admin'),
  getAvailability
);
router.post(
  '/players/:playerId/availability',
  authorize('rehab','coach','admin'),
  setAvailability
);

export default router; 