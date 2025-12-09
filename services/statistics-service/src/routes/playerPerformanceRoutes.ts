import { Router, Request, Response } from 'express';
import { CachedPlayerPerformanceRepository } from '../repositories/CachedPlayerPerformanceRepository';
import { authMiddleware, validateRequest } from '@hockey-hub/shared-lib';
import { query, param } from 'express-validator';

export function createPlayerPerformanceRoutes(playerPerformanceRepo: CachedPlayerPerformanceRepository): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware);

  /**
   * GET /api/players/:playerId/stats
   * Get player statistics with optional date range
   */
  router.get('/:playerId/stats',
    [
      param('playerId').isUUID().withMessage('Valid player ID required'),
      query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 format'),
      query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 format')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { playerId } = req.params;
        const { startDate, endDate } = req.query;

        const stats = await playerPerformanceRepo.getPlayerStats(
          playerId,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Player stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch player statistics'
        });
      }
    }
  );

  /**
   * GET /api/players/:playerId/trends
   * Get player performance trends over time
   */
  router.get('/:playerId/trends',
    [
      param('playerId').isUUID().withMessage('Valid player ID required'),
      query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { playerId } = req.params;
        const days = req.query.days ? parseInt(req.query.days as string) : 30;

        const trends = await playerPerformanceRepo.getPlayerPerformanceTrends(playerId, days);

        res.json({
          success: true,
          data: trends
        });
      } catch (error) {
        console.error('Player trends error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch player trends'
        });
      }
    }
  );

  /**
   * GET /api/teams/:teamId/players/stats
   * Get all player stats for a team on a specific date
   */
  router.get('/teams/:teamId/stats',
    [
      param('teamId').isUUID().withMessage('Valid team ID required'),
      query('date').isISO8601().withMessage('Date must be valid ISO8601 format')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { teamId } = req.params;
        const { date } = req.query;

        const stats = await playerPerformanceRepo.getTeamPlayerStats(
          teamId,
          new Date(date as string)
        );

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Team player stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch team player statistics'
        });
      }
    }
  );

  /**
   * GET /api/teams/:teamId/top-performers
   * Get top performing players for a team
   */
  router.get('/teams/:teamId/top-performers',
    [
      param('teamId').isUUID().withMessage('Valid team ID required'),
      query('metric').optional().isIn(['goals', 'assists', 'points', 'readinessScore', 'improvementRate'])
        .withMessage('Metric must be one of: goals, assists, points, readinessScore, improvementRate'),
      query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { teamId } = req.params;
        const metric = (req.query.metric as string) || 'points';
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        const topPerformers = await playerPerformanceRepo.getTopPerformers(teamId, metric, limit);

        res.json({
          success: true,
          data: topPerformers,
          metadata: {
            metric,
            limit,
            teamId
          }
        });
      } catch (error) {
        console.error('Top performers error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch top performers'
        });
      }
    }
  );

  /**
   * GET /api/organizations/:organizationId/analytics
   * Get performance analytics for entire organization
   */
  router.get('/organizations/:organizationId/analytics',
    [
      param('organizationId').isUUID().withMessage('Valid organization ID required'),
      query('period').optional().isIn(['week', 'month', 'season'])
        .withMessage('Period must be one of: week, month, season')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { organizationId } = req.params;
        const period = (req.query.period as 'week' | 'month' | 'season') || 'week';

        const analytics = await playerPerformanceRepo.getPerformanceAnalytics(organizationId, period);

        res.json({
          success: true,
          data: analytics
        });
      } catch (error) {
        console.error('Organization analytics error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch organization analytics'
        });
      }
    }
  );

  /**
   * POST /api/players/:playerId/stats
   * Create or update player performance statistics
   */
  router.post('/:playerId/stats',
    [
      param('playerId').isUUID().withMessage('Valid player ID required')
      // Additional validation would be added based on the actual DTO structure
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { playerId } = req.params;
        const statsData = req.body;

        // Create new performance stat record
        const newStat = await playerPerformanceRepo.create({
          ...statsData,
          playerId
        });

        // Invalidate relevant caches
        await playerPerformanceRepo.invalidatePlayerCache(playerId);
        
        res.status(201).json({
          success: true,
          data: newStat
        });
      } catch (error) {
        console.error('Create player stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create player statistics'
        });
      }
    }
  );

  /**
   * PUT /api/players/stats/:statId
   * Update specific player performance statistic
   */
  router.put('/stats/:statId',
    [
      param('statId').isUUID().withMessage('Valid stat ID required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { statId } = req.params;
        const updateData = req.body;

        const updatedStat = await playerPerformanceRepo.update(statId, updateData);
        
        if (updatedStat) {
          // Invalidate relevant caches
          await playerPerformanceRepo.invalidatePlayerCache(updatedStat.playerId);
          
          res.json({
            success: true,
            data: updatedStat
          });
        } else {
          res.status(404).json({
            success: false,
            error: 'Player statistic not found'
          });
        }
      } catch (error) {
        console.error('Update player stats error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update player statistics'
        });
      }
    }
  );

  return router;
}