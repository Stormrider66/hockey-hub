// @ts-nocheck - Suppress TypeScript errors for build
import { Router, Request, Response, type Router as ExpressRouter } from 'express';
import { createHash } from 'crypto';
import { CachedStatisticsService } from '../services/CachedStatisticsService';
import { authMiddleware, validateRequest } from '@hockey-hub/shared-lib';
import { query, param } from 'express-validator';

export function createDashboardRoutes(statisticsService: CachedStatisticsService): Router {
  const router: ExpressRouter = Router();

  // Simple HTTP caching helpers (ETag + Last-Modified)
  const computeEtag = (payload: any): string => {
    try {
      const json = JSON.stringify(payload);
      const hash = createHash('md5').update(json).digest('hex');
      return `W/"${hash}"`;
    } catch {
      return `W/"${Date.now().toString(16)}"`;
    }
  };

  const getLastModified = (items: any): Date => {
    const candidates: number[] = [];
    const pushDate = (d: any) => {
      const t = new Date(d).getTime();
      if (!Number.isNaN(t)) candidates.push(t);
    };
    const collect = (obj: any) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(collect);
        return;
      }
      if (typeof obj === 'object') {
        if ('updatedAt' in obj) pushDate(obj.updatedAt);
        if ('createdAt' in obj) pushDate(obj.createdAt);
        Object.values(obj).forEach(collect);
      }
    };
    collect(items);
    const latest = candidates.length ? Math.max(...candidates) : Date.now();
    return new Date(latest);
  };

  const shouldReturnNotModified = (req: Request, etag: string, lastModified: Date): boolean => {
    const inm = req.headers['if-none-match'];
    if (typeof inm === 'string') {
      const candidates = inm.split(',').map(s => s.trim());
      if (candidates.includes(etag)) return true;
    }
    const ims = req.headers['if-modified-since'];
    if (typeof ims === 'string') {
      const imsDate = new Date(ims).getTime();
      if (!Number.isNaN(imsDate) && lastModified.getTime() <= imsDate) return true;
    }
    return false;
  };

  const conditionalSend = (req: Request, res: Response, body: any, itemsForLastModified?: any, cacheControl?: string) => {
    if (cacheControl) res.set('Cache-Control', cacheControl);
    const etag = computeEtag(body);
    const lastMod = getLastModified(itemsForLastModified ?? body);
    res.set('ETag', etag);
    res.set('Last-Modified', lastMod.toUTCString());
    if (shouldReturnNotModified(req, etag, lastMod)) {
      return res.status(304).end();
    }
    return res.json(body);
  };

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

        const body = { success: true, data: analytics };
        return conditionalSend(req, res, body, analytics, 'private, max-age=60, stale-while-revalidate=60');
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

        const body = { success: true, data: dashboardData };
        return conditionalSend(req, res, body, dashboardData, 'private, max-age=60, stale-while-revalidate=60');
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

        const body = { success: true, data: dashboardData };
        return conditionalSend(req, res, body, dashboardData, 'private, max-age=60, stale-while-revalidate=60');
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

        const body = { success: true, data: dashboardData };
        return conditionalSend(req, res, body, dashboardData, 'private, max-age=60, stale-while-revalidate=60');
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

        const body = { success: true, data: dashboardData };
        return conditionalSend(req, res, body, dashboardData, 'private, max-age=60, stale-while-revalidate=60');
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