import { Router, type Router as ExpressRouter } from 'express';
import { createHash } from 'crypto';
import { CachedAdminService } from '../services/CachedAdminService';
import { SharedAuthMiddleware } from '@hockey-hub/shared-lib/middleware/auth.middleware';
import { Logger } from '@hockey-hub/shared-lib/utils/Logger';
import { ConfigScope } from '../entities/SystemConfiguration';
import { MetricType } from '../entities/SystemMetrics';

const router: ExpressRouter = Router();
const auth = new SharedAuthMiddleware();
const adminService = new CachedAdminService();
const logger = new Logger('AdminDashboardRoutes');

// Admin dashboard data
router.get('/dashboard/admin', auth.requireRole('admin'), async (req, res, next): Promise<void> => {
  try {
    const data = await adminService.getAdminDashboardData();
    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=60');
    const etag = 'W/"' + createHash('md5').update(JSON.stringify(data)).digest('hex') + '"';
    const lastModified = new Date();
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s=>s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      res.status(304).end();
      return;
    }
    res.json(data);
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    next(error);
  }
});

// Organization admin dashboard data
router.get('/dashboard/organization/:organizationId', auth.requireAnyPermission(['admin','club_admin']), async (req, res, next): Promise<void> => {
  try {
    const { organizationId } = req.params;
    
    // Verify user has access to this organization
    if (!(req.user?.roles?.includes('admin')) && req.user!.organizationId !== organizationId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    const data = await adminService.getOrganizationDashboardData(organizationId);
    res.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=120');
    const etag = 'W/"' + createHash('md5').update(JSON.stringify(data)).digest('hex') + '"';
    const lastModified = new Date();
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s=>s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      res.status(304).end();
      return;
    }
    res.json(data);
  } catch (error) {
    logger.error('Error getting organization dashboard data:', error);
    next(error);
  }
});

// Service health monitoring
router.get('/health/services', auth.requireAnyPermission(['admin','club_admin']), async (_req, res, next): Promise<void> => {
  try {
    const data = await adminService.getServiceHealth();
    res.json(data);
  } catch (error) {
    logger.error('Error getting service health:', error);
    next(error);
  }
});

// Specific service health
router.get('/health/services/:serviceName', auth.requireRole('admin'), async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    const data = await adminService.getServiceHealth(serviceName as any);
    res.json(data);
  } catch (error) {
    logger.error('Error getting service health:', error);
    next(error);
  }
});

// System status overview
router.get('/system/status', auth.requireAnyPermission(['admin','club_admin']), async (_req, res, next): Promise<void> => {
  try {
    const data = await adminService.getSystemStatus();
    res.json(data);
  } catch (error) {
    logger.error('Error getting system status:', error);
    next(error);
  }
});

// Configuration management
router.get('/config/:key', auth.requireRole('admin'), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { scope, scopeId } = req.query;
    
    const value = await adminService.getConfiguration(
      key,
      scope as ConfigScope || ConfigScope.SYSTEM,
      scopeId as string
    );
    
    res.json({ key, value, scope: scope || ConfigScope.SYSTEM });
  } catch (error) {
    logger.error('Error getting configuration:', error);
    next(error);
  }
});

// Set configuration
router.put('/config/:key', auth.requireRole('admin'), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, scope, scopeId } = req.body;
    
    const config = await adminService.setConfiguration(
      key,
      value,
      scope || ConfigScope.SYSTEM,
      scopeId
    );
    
    res.json(config);
  } catch (error) {
    logger.error('Error setting configuration:', error);
    next(error);
  }
});

// Get configurations by category
router.get('/config/category/:category', auth.requireAnyPermission(['admin','club_admin']), async (req, res, next) => {
  try {
    const { category } = req.params;
    const organizationId = req.query.organizationId as string || req.user!.organizationId;
    
    const configs = await adminService.getConfigurationsByCategory(category, organizationId);
    res.json(configs);
  } catch (error) {
    logger.error('Error getting configurations by category:', error);
    next(error);
  }
});

// Feature flags
router.get('/features/:flag', auth.requireAuth(), async (req, res, next) => {
  try {
    const { flag } = req.params;
    const organizationId = req.user!.organizationId;
    
    const enabled = await adminService.getFeatureFlag(flag, organizationId);
    res.json({ flag, enabled });
  } catch (error) {
    logger.error('Error getting feature flag:', error);
    next(error);
  }
});

// Set feature flag
router.put('/features/:flag', auth.requireRole('admin'), async (req, res, next) => {
  try {
    const { flag } = req.params;
    const { enabled, organizationId } = req.body;
    
    await adminService.setFeatureFlag(flag, enabled, organizationId);
    res.json({ flag, enabled, organizationId });
  } catch (error) {
    logger.error('Error setting feature flag:', error);
    next(error);
  }
});

// Metrics trends
router.get('/metrics/:type/trends', auth.requireAnyPermission(['admin','club_admin']), async (req, res, next) => {
  try {
    const { type } = req.params;
    const { days, organizationId } = req.query;
    
    const trends = await adminService.getMetricTrends(
      type as MetricType,
      days ? parseInt(days as string) : 30,
      organizationId as string
    );
    
    res.json(trends);
  } catch (error) {
    logger.error('Error getting metric trends:', error);
    next(error);
  }
});

// Maintenance operations
router.post('/maintenance/health-check', auth.requireRole('admin'), async (_req, res, next): Promise<void> => {
  try {
    await adminService.performHealthCheck();
    res.json({ message: 'Health check initiated' });
  } catch (error) {
    logger.error('Error performing health check:', error);
    next(error);
  }
});

// Data cleanup
router.post('/maintenance/cleanup', auth.requireRole('admin'), async (req, res, next) => {
  try {
    const { daysToKeep } = req.body;
    const result = await adminService.cleanupOldData(daysToKeep || 30);
    res.json(result);
  } catch (error) {
    logger.error('Error cleaning up data:', error);
    next(error);
  }
});

export default router;