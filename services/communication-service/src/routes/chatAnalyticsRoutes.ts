import { Router } from 'express';
import { ChatAnalyticsService, AnalyticsFilters } from '../services/ChatAnalyticsService';
import { authMiddleware } from '@hockey-hub/shared-lib';
import { Logger } from '@hockey-hub/shared-lib';

const router = Router();
const chatAnalyticsService = new ChatAnalyticsService();
const logger = new Logger('ChatAnalyticsRoutes');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Admin-only middleware
const adminOnly = (req: any, res: any, next: any) => {
  if (!req.user?.roles?.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get analytics overview
router.get('/overview', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const overview = await chatAnalyticsService.getAnalyticsOverview(filters);
    res.json(overview);
  } catch (error) {
    logger.error('Failed to get analytics overview', error);
    res.status(500).json({ error: error.message });
  }
});

// Get message volume data
router.get('/message-volume', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const data = await chatAnalyticsService.getMessageVolumeData(filters);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get message volume data', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user engagement metrics
router.get('/user-engagement', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const metrics = await chatAnalyticsService.getUserEngagementMetrics(filters);
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get user engagement metrics', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation analytics
router.get('/conversations', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const analytics = await chatAnalyticsService.getConversationAnalytics(filters);
    res.json(analytics);
  } catch (error) {
    logger.error('Failed to get conversation analytics', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage patterns
router.get('/usage-patterns', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const patterns = await chatAnalyticsService.getUsagePatterns(filters);
    res.json(patterns);
  } catch (error) {
    logger.error('Failed to get usage patterns', error);
    res.status(500).json({ error: error.message });
  }
});

// Get content analytics
router.get('/content', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const analytics = await chatAnalyticsService.getContentAnalytics(filters);
    res.json(analytics);
  } catch (error) {
    logger.error('Failed to get content analytics', error);
    res.status(500).json({ error: error.message });
  }
});

// Export all analytics data
router.get('/export', adminOnly, async (req: any, res: any) => {
  try {
    const filters = buildFiltersFromQuery(req.query);
    const data = await chatAnalyticsService.exportAnalyticsData(filters);
    
    // Set headers for file download
    const filename = `chat-analytics-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(data);
  } catch (error) {
    logger.error('Failed to export analytics data', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to build filters from query parameters
function buildFiltersFromQuery(query: any): AnalyticsFilters {
  const filters: AnalyticsFilters = {};

  if (query.startDate) {
    filters.startDate = new Date(query.startDate);
  }

  if (query.endDate) {
    filters.endDate = new Date(query.endDate);
  }

  if (query.organizationId) {
    filters.organizationId = query.organizationId;
  }

  if (query.teamId) {
    filters.teamId = query.teamId;
  }

  if (query.conversationType) {
    filters.conversationType = query.conversationType;
  }

  if (query.userId) {
    filters.userId = query.userId;
  }

  return filters;
}

export default router;