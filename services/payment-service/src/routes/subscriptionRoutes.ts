import { Router } from 'express';
import {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
} from '../controllers/subscriptionController';
import {
  listSubscriptionsSchema,
  getSubscriptionSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
} from '../validation/subscriptionSchemas';
import { validate } from '../middleware/validateRequest';
import { requireRole } from '../middleware/authMiddleware';
import { UserRole } from '@hockey-hub/types';

const router = Router();

// Require admin or club_admin
router.use(requireRole(UserRole.ADMIN, UserRole.CLUB_ADMIN));

router.get('/', validate(listSubscriptionsSchema), listSubscriptions);
router.post('/', validate(createSubscriptionSchema), createSubscription);
router.get('/:subId', validate(getSubscriptionSchema), getSubscription);
router.put('/:subId', validate(updateSubscriptionSchema), updateSubscription);
router.post('/:subId/cancel', validate(cancelSubscriptionSchema), cancelSubscription);

export default router; 