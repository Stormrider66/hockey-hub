import { Router } from 'express';
import { createOrganizationHandler } from '../controllers/organizationController';

const router = Router();

router.post('/', createOrganizationHandler);

export default router; 