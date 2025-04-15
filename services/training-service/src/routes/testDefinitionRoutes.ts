import { Router } from 'express';
import {
    getTestDefinitions,
    getTestDefinitionById,
    createTestDefinitionHandler,
    updateTestDefinitionHandler,
    deleteTestDefinitionHandler
} from '../controllers/testController';

// TODO: Add auth middleware

const router = Router();

// Routes for /api/v1/tests
router.get('/', getTestDefinitions);
router.post('/', createTestDefinitionHandler);
router.get('/:id', getTestDefinitionById);
router.put('/:id', updateTestDefinitionHandler);
router.delete('/:id', deleteTestDefinitionHandler);

export default router; 