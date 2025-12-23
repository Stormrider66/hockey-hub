// @ts-nocheck
import { Router, type Router as ExpressRouter } from 'express';
import { CachedPaymentService } from '../services/CachedPaymentService';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';
import { Logger } from '@hockey-hub/shared-lib/utils/logger';

const router: ExpressRouter = Router();
const paymentService = new CachedPaymentService();
const logger = new Logger('PaymentDashboardRoutes');

// Admin dashboard payment data
router.get('/dashboard/admin/:organizationId', authMiddleware(['admin', 'club_admin']), async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const data = await paymentService.getAdminDashboardData(organizationId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    next(error);
  }
});

// Player dashboard payment data  
router.get('/dashboard/player', authMiddleware(['player']), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    const data = await paymentService.getPlayerDashboardData(userId, organizationId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting player dashboard data:', error);
    next(error);
  }
});

// Parent dashboard payment data
router.get('/dashboard/parent', authMiddleware(['parent']), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = await paymentService.getParentDashboardData(userId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting parent dashboard data:', error);
    next(error);
  }
});

// Coach dashboard payment data
router.get('/dashboard/coach', authMiddleware(['coach', 'ice_coach']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const data = await paymentService.getCoachDashboardData(organizationId);
    res.json(data);
  } catch (error) {
    logger.error('Error getting coach dashboard data:', error);
    next(error);
  }
});

// Feature access check
router.get('/features/check/:feature', authMiddleware(), async (req, res, next) => {
  try {
    const { feature } = req.params;
    const organizationId = req.user!.organizationId;
    const hasAccess = await paymentService.checkFeatureAccess(organizationId, feature);
    res.json({ feature, hasAccess });
  } catch (error) {
    logger.error('Error checking feature access:', error);
    next(error);
  }
});

// Usage limit check
router.get('/usage/:resource', authMiddleware(['admin', 'club_admin']), async (req, res, next) => {
  try {
    const { resource } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!['users', 'teams', 'players'].includes(resource)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }
    
    const usage = await paymentService.checkUsageLimit(
      organizationId, 
      resource as 'users' | 'teams' | 'players'
    );
    res.json(usage);
  } catch (error) {
    logger.error('Error checking usage limits:', error);
    next(error);
  }
});

// Revenue metrics
router.get('/metrics/revenue/:organizationId', authMiddleware(['admin', 'club_admin']), async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { startDate, endDate } = req.query;
    
    const metrics = await paymentService.getRevenueMetrics(
      organizationId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting revenue metrics:', error);
    next(error);
  }
});

export default router;