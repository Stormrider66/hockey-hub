import { Router } from 'express';
import {
    getTemplates,
    getTemplateById,
    createTemplateHandler,
    updateTemplateHandler,
    deleteTemplateHandler,
    copyTemplateHandler
} from '../controllers/physicalTemplateController';

// TODO: Add auth middleware

const router = Router();

// Assuming routes like /api/v1/physical-templates
router.get('/', getTemplates);
router.post('/', createTemplateHandler);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplateHandler);
router.delete('/:id', deleteTemplateHandler);
router.post('/:id/copy', copyTemplateHandler); // Route for copying

export default router; 