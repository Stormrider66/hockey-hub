// @ts-nocheck
import { Router } from 'express';
import {
    getTestDefinitions,
    getTestDefinitionById,
    createTestDefinitionHandler,
    updateTestDefinitionHandler,
    deleteTestDefinitionHandler
} from '../controllers/testController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

// Routes for /api/v1/tests
router.get('/', getTestDefinitions);
router.post('/', createTestDefinitionHandler);
router.get('/:id', getTestDefinitionById);
router.put('/:id', updateTestDefinitionHandler);
router.delete('/:id', deleteTestDefinitionHandler);

export default router; 