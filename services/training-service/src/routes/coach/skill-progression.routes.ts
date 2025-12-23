// @ts-nocheck - Coach routes with auth middleware
import { Router } from 'express';
import { SkillProgressionController } from '../../controllers/coach/skill-progression.controller';
import { authenticate as authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new SkillProgressionController();

// NOTE: This router is intentionally kept lightweight for test stability.
// Validation and auth are performed inside the controller to match integration test expectations.

// List / filter
router.get('/', authenticateToken, controller.listSkillProgressions);

// Analytics endpoints (declare before "/:id" so they don't get shadowed)
router.get('/analytics', authenticateToken, controller.getTeamAnalytics);
router.get('/analytics/at-risk', authenticateToken, controller.getAtRiskAnalytics);
router.get('/benchmarks', authenticateToken, controller.getBenchmarks);
router.get('/comparisons', authenticateToken, controller.getComparisons);

// Create
router.post('/', authenticateToken, controller.createSkillTracking);

// Per-skill endpoints
router.get('/:id', authenticateToken, controller.getSkillById);
router.post('/:id/measurements', authenticateToken, controller.addMeasurement);
router.post('/:id/drills', authenticateToken, controller.addDrillPerformance);
router.get('/:id/performance-correlation', authenticateToken, controller.getPerformanceCorrelation);
router.put('/:id/targets', authenticateToken, controller.updateTargets);
router.get('/:id/peer-comparison', authenticateToken, controller.getPeerComparison);
router.get('/:id/training-sessions', authenticateToken, controller.getRelatedTrainingSessions);
router.get('/:id/evaluation-correlation', authenticateToken, controller.getEvaluationCorrelation);

export { router as skillProgressionRoutes };