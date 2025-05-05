// @ts-nocheck
import { Router } from 'express';
import {
    getTestResults,
    getTestResultById,
    createTestResultHandler,
    updateTestResultHandler,
    deleteTestResultHandler
} from '../controllers/testController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.use(requireAuth);

// Routes for /api/v1/test-results
router.get('/', getTestResults);
router.post('/', createTestResultHandler);
router.get('/:id', getTestResultById);
router.put('/:id', updateTestResultHandler);
router.delete('/:id', deleteTestResultHandler);

export default router; 