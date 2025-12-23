// @ts-nocheck - Coach routes with auth middleware
import { Router } from 'express';
import { authenticate as authenticateToken } from '@hockey-hub/shared-lib';
import { VideoAnalysisController } from '../../controllers/coach/video-analysis.controller';

const router = Router();
const controller = new VideoAnalysisController();

// Integration tests mount this router at `/api/video-analysis`.
router.post('/', authenticateToken, controller.createAnalysis);
router.get('/', authenticateToken, controller.listAnalyses);

router.get('/analytics', authenticateToken, controller.analytics);
router.get('/analytics/improvement/:playerId', authenticateToken, controller.improvementAnalytics);

router.post('/bulk', authenticateToken, controller.bulkCreate);
router.put('/bulk/share', authenticateToken, controller.bulkShare);

router.put('/:id/share', authenticateToken, controller.share);
router.post('/:id/view', authenticateToken, controller.markViewed);

router.put('/:id/clips', authenticateToken, controller.updateClip);
router.post('/:id/clips', authenticateToken, controller.addClip);

router.get('/:id/viewing-stats', authenticateToken, controller.viewingStats);
router.get('/:id', authenticateToken, controller.getById);

export { router as videoAnalysisRoutes };





