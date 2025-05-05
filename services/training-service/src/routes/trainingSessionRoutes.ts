import { Router } from 'express';
import { getTeamMetrics, getSessionIntervals } from '../controllers/trainingSessionController';
import { requireAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();
router.use(requireAuth);

// GET /api/v1/training-sessions/teams/:teamId/metrics
router.get('/teams/:teamId/metrics', requireRole(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), getTeamMetrics);

// GET /api/v1/training-sessions/scheduled-sessions/:id/intervals
router.get('/scheduled-sessions/:id/intervals', requireRole(['admin', 'club_admin', 'coach', 'fys_coach']), getSessionIntervals);

export default router; 