import { Router } from 'express';
import { playerEvaluationRoutes } from './player-evaluation.routes';
import { playerDevelopmentPlanRoutes } from './player-development-plan.routes';
import { videoAnalysisRoutes } from './video-analysis.routes';
import { skillProgressionRoutes } from './skill-progression.routes';
import { playerFeedbackRoutes } from './player-feedback.routes';

const router = Router();

// Mount all coach-related routes
router.use('/evaluations', playerEvaluationRoutes);
router.use('/development-plans', playerDevelopmentPlanRoutes);
router.use('/video-analysis', videoAnalysisRoutes);
router.use('/skill-progression', skillProgressionRoutes);
router.use('/player-feedback', playerFeedbackRoutes);

export { router as coachRoutes };