import { Router } from 'express';
import { CachedPlanningService } from '../services/CachedPlanningService';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { Logger } from '@hockey-hub/shared-lib/utils/logger';

const router = Router();
const planningService = new CachedPlanningService();
const logger = new Logger('PlanningDashboardRoutes');

// Coach dashboard planning data
router.get('/dashboard/coach', authMiddleware(['coach', 'ice_coach']), async (req, res, next) => {
  try {
    const coachId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const data = await planningService.getCoachDashboardData(coachId, organizationId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting coach dashboard data:', error);
    next(error);
  }
});

// Player dashboard planning data
router.get('/dashboard/player', authMiddleware(['player']), async (req, res, next) => {
  try {
    const playerId = req.user!.id;
    const teamId = req.user!.teamId || req.query.teamId as string;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }
    
    const data = await planningService.getPlayerDashboardData(playerId, teamId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting player dashboard data:', error);
    next(error);
  }
});

// Admin dashboard planning data
router.get('/dashboard/admin', authMiddleware(['admin', 'club_admin']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const data = await planningService.getAdminDashboardData(organizationId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    next(error);
  }
});

// Search drills
router.get('/drills/search', authMiddleware(), async (req, res, next) => {
  try {
    const { type, difficulty, ageGroup, duration, search } = req.query;
    const organizationId = req.user!.organizationId;
    
    const drills = await planningService.searchDrills({
      organizationId,
      type: type as any,
      difficulty: difficulty as any,
      ageGroup: ageGroup as string,
      duration: duration ? parseInt(duration as string) : undefined,
      searchText: search as string
    });
    
    res.json(drills);
  } catch (error) {
    logger.error('Error searching drills:', error);
    next(error);
  }
});

// Get popular drills
router.get('/drills/popular', authMiddleware(), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const drills = await planningService.searchDrills({ organizationId });
    
    // Sort by usage and return top 10
    const popular = drills
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
    
    res.json(popular);
  } catch (error) {
    logger.error('Error getting popular drills:', error);
    next(error);
  }
});

// Get drill details
router.get('/drills/:id', authMiddleware(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const drill = await planningService.getDrillDetails(id);
    
    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }
    
    res.json(drill);
  } catch (error) {
    logger.error('Error getting drill details:', error);
    next(error);
  }
});

// Get templates
router.get('/templates', authMiddleware(['coach', 'ice_coach']), async (req, res, next) => {
  try {
    const { category } = req.query;
    const organizationId = req.user!.organizationId;
    
    const templates = await planningService.getTemplatesForOrganization(
      organizationId, 
      category as any
    );
    
    res.json(templates);
  } catch (error) {
    logger.error('Error getting templates:', error);
    next(error);
  }
});

// Get popular templates
router.get('/templates/popular', authMiddleware(), async (req, res, next) => {
  try {
    const templates = await planningService.getPopularTemplates();
    res.json(templates);
  } catch (error) {
    logger.error('Error getting popular templates:', error);
    next(error);
  }
});

// Use template to create plan
router.post('/templates/:id/use', authMiddleware(['coach', 'ice_coach']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;
    const coachId = req.user!.id;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }
    
    const plan = await planningService.useTemplate(id, teamId, coachId);
    res.json(plan);
  } catch (error) {
    logger.error('Error using template:', error);
    next(error);
  }
});

// Get practice details
router.get('/practices/:id', authMiddleware(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const practice = await planningService.getPracticeDetails(id);
    
    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' });
    }
    
    res.json(practice);
  } catch (error) {
    logger.error('Error getting practice details:', error);
    next(error);
  }
});

// Get planning analytics
router.get('/analytics', authMiddleware(['admin', 'club_admin', 'coach']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { startDate, endDate } = req.query;
    
    const analytics = await planningService.getPlanningAnalytics(
      organizationId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting planning analytics:', error);
    next(error);
  }
});

export default router;