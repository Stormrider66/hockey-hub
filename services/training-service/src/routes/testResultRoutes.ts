import { Router } from 'express';
import {
    getTestResults,
    getTestResultById,
    createTestResultHandler,
    updateTestResultHandler,
    deleteTestResultHandler
} from '../controllers/testController';

// TODO: Add auth middleware

const router = Router();

// Routes for /api/v1/test-results
router.get('/', getTestResults);
router.post('/', createTestResultHandler);
router.get('/:id', getTestResultById);
router.put('/:id', updateTestResultHandler);
router.delete('/:id', deleteTestResultHandler);

export default router; 