// @ts-nocheck - Coach routes with auth middleware
import { Router } from 'express';
import { PlayerFeedbackController } from '../../controllers/coach/player-feedback.controller';
import { authenticate as authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new PlayerFeedbackController();

// NOTE: The integration tests mount this router at `/api/feedback` and assert specific
// endpoints + response shapes (no `{ success: true, data: ... }` wrapper).

router.post('/', authenticateToken, controller.createFeedback);
router.get('/', authenticateToken, controller.listFeedback);

router.post('/templates', authenticateToken, controller.createTemplate);
router.post('/from-template', authenticateToken, controller.createFromTemplate);

router.get('/analytics', authenticateToken, controller.getAnalytics);
router.get('/analytics/player/:playerId', authenticateToken, controller.getPlayerAnalytics);

router.post('/bulk', authenticateToken, controller.bulkCreate);
router.put('/bulk/status', authenticateToken, controller.bulkStatusUpdate);

router.get('/:id/related-sessions', authenticateToken, controller.getRelatedSessions);
router.get('/:id/evaluation-context', authenticateToken, controller.getEvaluationContext);

router.put('/:id/response', authenticateToken, controller.addPlayerResponse);
router.put('/:id/status', authenticateToken, controller.updateFeedbackStatus);

router.get('/:id', authenticateToken, controller.getFeedbackById);

export { router as playerFeedbackRoutes };