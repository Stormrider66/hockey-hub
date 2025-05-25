// @ts-nocheck
import { Router } from 'express';
import { getCorrelation, postRegression } from '../controllers/testAnalyticsController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

// Endpoint for Pearson correlation analytics
router.get('/correlation', getCorrelation);

// Endpoint for multi-linear regression analytics
router.post('/regression', postRegression);

// TODO: Add regression analytics endpoint (e.g., POST /regression)

export default router; 