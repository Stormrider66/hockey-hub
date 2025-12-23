// @ts-nocheck - Coach routes with auth middleware
import { Router } from 'express';
import { authenticate as authenticateToken } from '@hockey-hub/shared-lib';
import { PlayerDevelopmentPlanController } from '../../controllers/coach/player-development-plan.controller';

const router = Router();
const controller = new PlayerDevelopmentPlanController();

// Integration tests mount this router at `/api/development-plans` and expect these endpoints.
router.post('/', authenticateToken, controller.createPlan);
router.get('/', authenticateToken, controller.listPlans);

router.get('/analytics', authenticateToken, controller.getAnalytics);
router.get('/analytics/player/:playerId', authenticateToken, controller.getPlayerAnalytics);

router.put('/:id/progress', authenticateToken, controller.updateGoalProgress);
router.put('/:id/milestones', authenticateToken, controller.updateMilestones);
router.put('/:id/weekly', authenticateToken, controller.updateWeekly);

router.post('/:id/communication', authenticateToken, controller.addCommunication);

router.put('/:id/status', authenticateToken, controller.updatePlanStatus);

router.post('/:id/resources', authenticateToken, controller.addResource);
router.put('/:id/resources/complete', authenticateToken, controller.completeResource);

router.get('/:id/linked-evaluations', authenticateToken, controller.linkedEvaluations);
router.get('/:id/related-sessions', authenticateToken, controller.relatedSessions);

router.get('/:id', authenticateToken, controller.getPlanById);

export { router as playerDevelopmentPlanRoutes };





