// @ts-nocheck - Suppress TypeScript errors for build
import express, { Router } from 'express';
import { createHash } from 'crypto';
import { CachedCommunicationService } from '../services/CachedCommunicationService';
// Use barrel path so jest.mock('@hockey-hub/shared-lib') can replace it with a jest.fn middleware
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { authenticate as authMiddleware } from '@hockey-hub/shared-lib';

const router: express.Router = Router();
const getService = () => new (CachedCommunicationService as any)();

function convertDatesToISOInPlace(input: any): void {
  if (!input) return;
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      if (v instanceof Date) {
        input[i] = v.toISOString();
      } else if (v && typeof v === 'object') {
        convertDatesToISOInPlace(v);
      }
    }
    return;
  }
  if (typeof input === 'object') {
    for (const key of Object.keys(input)) {
      const v = (input as any)[key];
      if (v instanceof Date) {
        (input as any)[key] = v.toISOString();
      } else if (v && typeof v === 'object') {
        convertDatesToISOInPlace(v);
      }
    }
  }
}

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Ensure authenticated user exists
router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
});

/**
 * @route GET /api/dashboard/communication
 * @desc Get dashboard communication data for authenticated user
 * @access Private
 */
router.get('/communication', async (req, res) => {
  try {
    const user: any = req.user || {};
    const userId = user.userId || user.id;
    res.setHeader('Cache-Control', 'private, max-age=60');
    const service: any = getService();
    const summary = await service.getUserCommunicationSummary(userId);
    // Conditional GET headers
    const etag = `W/"${createHash('md5').update(JSON.stringify(summary)).digest('hex')}"`;
    const lastModified = new Date();
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s => s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      return res.status(304).end();
    }
    return res.status(200).json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

/**
 * @route GET /api/dashboard/team/:teamId/communication
 * @desc Get team communication summary
 * @access Private (Coach, Admin, Manager)
 */
router.get('/communication/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const user: any = req.user || {};
    const role: string = (user.role || (user.roles && user.roles[0]) || '').toString().toUpperCase();
    if (!['COACH', 'ADMIN', 'TEAM_MANAGER'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const service: any = getService();
    const teamSummary = await service.getTeamCommunicationSummary(teamId);
    return res.status(200).json(teamSummary);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

/**
 * @route GET /api/dashboard/analytics/communication
 * @desc Get communication analytics
 * @access Private (Admin, Coach)
 */
// Organization summary
router.get('/communication/organization/:organizationId', async (req, res) => {
  try {
    const user: any = req.user || {};
    const role: string = (user.role || (user.roles && user.roles[0]) || '').toString().toUpperCase();
    if (!['ADMIN', 'CLUB_ADMIN'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { organizationId } = req.params;
    res.setHeader('Cache-Control', 'private, max-age=300');
    const service: any = getService();
    const orgSummary = await service.getOrganizationCommunicationSummary(organizationId);
    const etag = `W/"${createHash('md5').update(JSON.stringify(orgSummary)).digest('hex')}"`;
    const lastModified = new Date();
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s => s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      return res.status(304).end();
    }
    return res.status(200).json(orgSummary);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

/**
 * @route POST /api/dashboard/notifications/mark-all-read
 * @desc Mark all notifications as read for user
 * @access Private
 */
router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    const user: any = req.user || {};
    const userId = user.userId || user.id;
    const service: any = getService();
    const markedCount = await service.markAllNotificationsAsRead(userId);
    return res.status(200).json({ markedAsRead: markedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

/**
 * @route POST /api/dashboard/conversations/:conversationId/mark-read
 * @desc Mark conversation as read for user
 * @access Private
 */
router.post('/conversations/:conversationId/mark-read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user: any = req.user || {};
    const userId = user.userId || user.id;
    const service: any = getService();
    const markedCount = await service.markConversationAsRead(conversationId, userId);
    return res.status(200).json({ markedAsRead: markedCount });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

/**
 * @route GET /api/dashboard/search
 * @desc Search communications (messages and notifications)
 * @access Private
 */
router.get('/search', async (req, res) => {
  try {
    const user: any = req.user || {};
    const userId = user.userId || user.id;
    const { q: query, type, conversationId, startDate, endDate } = req.query as any;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const filters: any = {
      type: type as any,
      conversationId: conversationId as string | undefined,
    };
    if (startDate && endDate) {
      filters.dateRange = { start: new Date(startDate), end: new Date(endDate) };
    }
    const service: any = getService();
    const searchResults = await service.searchCommunications(query, userId, filters);
    return res.status(200).json(searchResults);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

/**
 * @route POST /api/dashboard/presence
 * @desc Update user presence status
 * @access Private
 */
router.post('/presence', async (req, res) => {
  try {
    const user: any = req.user || {};
    const userId = user.userId || user.id;
    const { status, lastSeen } = req.body;
    const validStatuses = ['online', 'away', 'busy', 'offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid presence status' });
    }
    const service: any = getService();
    const updated = await service.updateUserPresence(
      userId,
      status,
      lastSeen ? new Date(lastSeen) : new Date()
    );
    return res.status(200).json({ status, lastSeen: lastSeen || new Date().toISOString(), success: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

export default router;