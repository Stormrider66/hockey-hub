// @ts-nocheck - Coach routes with auth middleware
import { Router } from 'express';
import { PlayerEvaluationController } from '../../controllers/coach/player-evaluation.controller';
import { authenticate as authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new PlayerEvaluationController();

// NOTE: Intentionally lightweight for Jest/integration stability.
// Validation + authorization are handled inside the controller to match test expectations.

router.get('/', authenticateToken, controller.listEvaluations);
router.get('/compare', authenticateToken, controller.compareEvaluations);
router.get('/analytics', authenticateToken, controller.getTeamAnalytics);
router.get('/analytics/player/:playerId', authenticateToken, controller.getPlayerAnalytics);

router.post('/', authenticateToken, controller.createEvaluation);
router.post('/bulk', authenticateToken, controller.bulkCreateEvaluations);

router.get('/:id', authenticateToken, controller.getEvaluationById);
router.put('/:id', authenticateToken, controller.updateEvaluation);
router.delete('/:id', authenticateToken, controller.deleteEvaluation);

export { router as playerEvaluationRoutes };





