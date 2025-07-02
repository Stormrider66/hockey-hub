import { Router, Request, Response } from 'express';
import { CachedStatisticsService } from '../services/CachedStatisticsService';
import { authMiddleware, validateRequest } from '@hockey-hub/shared-lib';
import { query, param } from 'express-validator';

export function createDashboardRoutes(statisticsService: CachedStatisticsService): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authMiddleware);

  /**
   * GET /api/dashboard/analytics
   * Get comprehensive dashboard analytics for organization/team/player
   * This is the KEY endpoint that will speed up ALL dashboards
   */
  router.get('/analytics',
    [
      query('organizationId').isUUID().withMessage('Valid organization ID required'),
      query('teamId').optional().isUUID().withMessage('Team ID must be valid UUID'),
      query('playerId').optional().isUUID().withMessage('Player ID must be valid UUID')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { organizationId, teamId, playerId } = req.query;

        const analytics = await statisticsService.getDashboardAnalytics(
          organizationId as string,
          teamId as string,
          playerId as string
        );

        res.json({
          success: true,
          data: analytics
        });
      } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch dashboard analytics'
        });
      }
    }
  );

  /**
   * GET /api/dashboard/player/:playerId
   * Optimized player dashboard data
   */
  router.get('/player/:playerId',
    [
      param('playerId').isUUID().withMessage('Valid player ID required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { playerId } = req.params;

        const dashboardData = await statisticsService.getPlayerDashboardData(playerId);

        res.json({
          success: true,
          data: dashboardData
        });
      } catch (error) {
        console.error('Player dashboard error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch player dashboard data'
        });
      }
    }
  );

  /**
   * GET /api/dashboard/coach/:teamId
   * Optimized coach dashboard data
   */
  router.get('/coach/:teamId',
    [
      param('teamId').isUUID().withMessage('Valid team ID required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { teamId } = req.params;

        const dashboardData = await statisticsService.getCoachDashboardData(teamId);

        res.json({
          success: true,
          data: dashboardData
        });
      } catch (error) {
        console.error('Coach dashboard error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch coach dashboard data'
        });
      }
    }
  );

  /**
   * GET /api/dashboard/trainer
   * Optimized physical trainer dashboard data
   */
  router.get('/trainer',
    [
      query('organizationId').isUUID().withMessage('Valid organization ID required'),
      query('teamId').optional().isUUID().withMessage('Team ID must be valid UUID')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { organizationId, teamId } = req.query;

        const dashboardData = await statisticsService.getPhysicalTrainerDashboardData(
          organizationId as string,
          teamId as string
        );

        res.json({
          success: true,
          data: dashboardData
        });
      } catch (error) {
        console.error('Trainer dashboard error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch trainer dashboard data'
        });
      }
    }
  );

  /**
   * GET /api/dashboard/admin/:organizationId
   * Optimized admin dashboard data
   */
  router.get('/admin/:organizationId',
    [
      param('organizationId').isUUID().withMessage('Valid organization ID required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { organizationId } = req.params;

        const dashboardData = await statisticsService.getAdminDashboardData(organizationId);

        res.json({
          success: true,
          data: dashboardData
        });
      } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch admin dashboard data'
        });
      }
    }
  );

  /**
   * POST /api/dashboard/invalidate
   * Invalidate dashboard caches when data changes
   */
  router.post('/invalidate',
    [
      query('type').isIn(['player', 'team', 'organization']).withMessage('Type must be player, team, or organization'),
      query('id').isUUID().withMessage('Valid ID required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const { type, id } = req.query;

        switch (type) {
          case 'player':
            await statisticsService.invalidatePlayerData(id as string);
            break;
          case 'team':
            await statisticsService.invalidateTeamData(id as string);
            break;
          case 'organization':
            await statisticsService.invalidateOrganizationData(id as string);
            break;
        }

        res.json({
          success: true,
          message: `${type} cache invalidated successfully`
        });
      } catch (error) {
        console.error('Cache invalidation error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to invalidate cache'
        });
      }
    }
  );

  return router;
}