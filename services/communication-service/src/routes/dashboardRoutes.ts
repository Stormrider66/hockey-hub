import { Router } from 'express';
import { CachedCommunicationService } from '../services/CachedCommunicationService';
import { asyncHandler } from '@hockey-hub/shared-lib';
import { authMiddleware } from '@hockey-hub/shared-lib';

const router = Router();
const cachedService = new CachedCommunicationService();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route GET /api/dashboard/communication
 * @desc Get dashboard communication data for authenticated user
 * @access Private
 */
router.get('/communication', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const userRole = req.user!.roles[0] || 'player';

  const dashboardData = await cachedService.getDashboardData(userId, userRole);

  res.json({
    success: true,
    data: dashboardData,
    cached: true,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/dashboard/team/:teamId/communication
 * @desc Get team communication summary
 * @access Private (Coach, Admin, Manager)
 */
router.get('/team/:teamId/communication', asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user!.userId;
  const userRole = req.user!.roles[0] || 'player';

  // Check if user has access to team data
  // In production, you'd verify team membership/permissions
  if (!['coach', 'admin', 'team_manager'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to view team communication data'
    });
  }

  const teamSummary = await cachedService.getTeamCommunicationSummary(teamId);

  res.json({
    success: true,
    data: teamSummary,
    cached: true,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route GET /api/dashboard/analytics/communication
 * @desc Get communication analytics
 * @access Private (Admin, Coach)
 */
router.get('/analytics/communication', asyncHandler(async (req, res) => {
  const userRole = req.user!.roles[0] || 'player';
  const { organizationId, teamId, startDate, endDate } = req.query;

  // Check permissions
  if (!['admin', 'coach'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions to view communication analytics'
    });
  }

  const timeRange = startDate && endDate ? {
    start: new Date(startDate as string),
    end: new Date(endDate as string)
  } : undefined;

  const analytics = await cachedService.getCommunicationAnalytics(
    organizationId as string,
    teamId as string,
    timeRange
  );

  res.json({
    success: true,
    data: analytics,
    cached: true,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/dashboard/notifications/mark-all-read
 * @desc Mark all notifications as read for user
 * @access Private
 */
router.post('/notifications/mark-all-read', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const markedCount = await cachedService.markAllNotificationsAsRead(userId);

  res.json({
    success: true,
    data: {
      markedAsRead: markedCount
    },
    message: `Marked ${markedCount} notifications as read`
  });
}));

/**
 * @route POST /api/dashboard/conversations/:conversationId/mark-read
 * @desc Mark conversation as read for user
 * @access Private
 */
router.post('/conversations/:conversationId/mark-read', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user!.userId;

  const markedCount = await cachedService.markConversationAsRead(conversationId, userId);

  res.json({
    success: true,
    data: {
      markedAsRead: markedCount
    },
    message: `Marked ${markedCount} messages as read`
  });
}));

/**
 * @route GET /api/dashboard/search
 * @desc Search communications (messages and notifications)
 * @access Private
 */
router.get('/search', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { q: query, type, conversationId, startDate, endDate } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const filters: any = {
    type: type as 'messages' | 'notifications' | 'all' | undefined,
    conversationId: conversationId as string | undefined
  };

  if (startDate && endDate) {
    filters.dateRange = {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    };
  }

  const searchResults = await cachedService.searchCommunications(query, userId, filters);

  res.json({
    success: true,
    data: searchResults,
    cached: true,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route POST /api/dashboard/presence
 * @desc Update user presence status
 * @access Private
 */
router.post('/presence', asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { status, lastSeen } = req.body;

  const validStatuses = ['online', 'away', 'busy', 'offline'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid presence status'
    });
  }

  const updated = await cachedService.updateUserPresence(
    userId, 
    status, 
    lastSeen ? new Date(lastSeen) : new Date()
  );

  res.json({
    success: updated,
    data: {
      status,
      lastSeen: lastSeen || new Date().toISOString()
    },
    message: updated ? 'Presence updated successfully' : 'Failed to update presence'
  });
}));

export default router;