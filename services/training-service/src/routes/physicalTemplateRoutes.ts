// @ts-nocheck
import { Router } from 'express';
import {
    getTemplates,
    getTemplateById,
    createTemplateHandler,
    updateTemplateHandler,
    deleteTemplateHandler,
    copyTemplateHandler
} from '../controllers/physicalTemplateController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

// Assuming routes like /api/v1/physical-templates
router.get('/', requireRole(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), getTemplates);
router.post('/', requireRole(['admin', 'club_admin', 'coach', 'fys_coach']), createTemplateHandler);
router.get('/:id', requireRole(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), getTemplateById);
router.put('/:id', requireRole(['admin', 'club_admin', 'coach', 'fys_coach']), updateTemplateHandler);
router.delete('/:id', requireRole(['admin', 'club_admin', 'coach', 'fys_coach']), deleteTemplateHandler);
router.post('/:id/copy', requireRole(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), copyTemplateHandler); // Route for copying

export default router; 