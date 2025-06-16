import { Router } from 'express';
import {
  listPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../controllers/paymentMethodController';
import {
  listPaymentMethodsSchema,
  createPaymentMethodSchema,
  deletePaymentMethodSchema,
  setDefaultPaymentMethodSchema,
} from '../validation/paymentMethodSchemas';
import { validate } from '../middleware/validateRequest';
import { requireRole } from '../middleware/authMiddleware';
import { UserRole } from '@hockey-hub/types';

const router = Router();

router.use(requireRole(UserRole.ADMIN, UserRole.CLUB_ADMIN));

router.get('/', validate(listPaymentMethodsSchema), listPaymentMethods);
router.post('/', validate(createPaymentMethodSchema), createPaymentMethod);
router.delete('/:methodId', validate(deletePaymentMethodSchema), deletePaymentMethod);
router.post('/:methodId/set-default', validate(setDefaultPaymentMethodSchema), setDefaultPaymentMethod);

export default router; 