import { Router } from 'express';
import { listInvoices, getInvoice, payInvoice } from '../controllers/invoiceController';
import { listInvoicesSchema, getInvoiceSchema, payInvoiceSchema } from '../validation/invoiceSchemas';
import { validate } from '../middleware/validateRequest';
import { requireRole } from '../middleware/authMiddleware';
import { UserRole } from '@hockey-hub/types';

const router = Router();

router.use(requireRole(UserRole.ADMIN, UserRole.CLUB_ADMIN));

router.get('/', validate(listInvoicesSchema), listInvoices);
router.get('/:invoiceId', validate(getInvoiceSchema), getInvoice);
router.post('/:invoiceId/pay', validate(payInvoiceSchema), payInvoice);

export default router; 