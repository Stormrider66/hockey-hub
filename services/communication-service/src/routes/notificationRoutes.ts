import { Router, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { NotificationService } from '../services';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationStatus 
} from '../entities';
import { authMiddleware, validateRequest } from '@hockey-hub/shared-lib';
import { body, query, param } from 'express-validator';

export function createNotificationRoutes(dataSource: DataSource): Router {
  const router = Router();
  const notificationService = new NotificationService(dataSource);

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /notifications - Get user notifications
   */
  router.get(
    '/',
    [
      query('type').optional().isIn(Object.values(NotificationType)),
      query('status').optional().isIn(Object.values(NotificationStatus)),
      query('priority').optional().isIn(Object.values(NotificationPriority)),
      query('unreadOnly').optional().isBoolean(),
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const filters = {
          recipientId: userId,
          organizationId: req.user?.organizationId,
          type: req.query.type as NotificationType,
          status: req.query.status as NotificationStatus,
          priority: req.query.priority as NotificationPriority,
          unreadOnly: req.query.unreadOnly === 'true',
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        };

        const result = await notificationService.getNotifications(filters);
        res.json(result);
      } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
      }
    }
  );

  /**
   * POST /notifications - Create a new notification
   */
  router.post(
    '/',
    [
      body('recipientId').isUUID().withMessage('Valid recipient ID required'),
      body('type').isIn(Object.values(NotificationType)).withMessage('Valid notification type required'),
      body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
      body('message').isLength({ min: 1 }).withMessage('Message is required'),
      body('priority').optional().isIn(Object.values(NotificationPriority)),
      body('channels').optional().isArray().custom((channels) => {
        return channels.every((channel: string) => Object.values(NotificationChannel).includes(channel as NotificationChannel));
      }),
      body('scheduledFor').optional().isISO8601(),
      body('expiresAt').optional().isISO8601(),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const notification = await notificationService.createNotification({
          recipientId: req.body.recipientId,
          organizationId: req.user?.organizationId,
          teamId: req.body.teamId,
          type: req.body.type,
          title: req.body.title,
          message: req.body.message,
          priority: req.body.priority,
          actionUrl: req.body.actionUrl,
          actionText: req.body.actionText,
          relatedEntityId: req.body.relatedEntityId,
          relatedEntityType: req.body.relatedEntityType,
          channels: req.body.channels,
          scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
          expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
          metadata: req.body.metadata,
        });

        res.status(201).json(notification);
      } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
      }
    }
  );

  /**
   * POST /notifications/bulk - Create bulk notifications
   */
  router.post(
    '/bulk',
    [
      body('recipientIds').isArray({ min: 1 }).withMessage('At least one recipient required'),
      body('recipientIds.*').isUUID().withMessage('All recipient IDs must be valid UUIDs'),
      body('type').isIn(Object.values(NotificationType)).withMessage('Valid notification type required'),
      body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
      body('message').isLength({ min: 1 }).withMessage('Message is required'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const notifications = await notificationService.createBulkNotifications(
          req.body.recipientIds,
          {
            organizationId: req.user?.organizationId,
            teamId: req.body.teamId,
            type: req.body.type,
            title: req.body.title,
            message: req.body.message,
            priority: req.body.priority,
            actionUrl: req.body.actionUrl,
            actionText: req.body.actionText,
            relatedEntityId: req.body.relatedEntityId,
            relatedEntityType: req.body.relatedEntityType,
            channels: req.body.channels,
            scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
            metadata: req.body.metadata,
          }
        );

        res.status(201).json({
          message: `${notifications.length} notifications created`,
          count: notifications.length,
        });
      } catch (error) {
        console.error('Error creating bulk notifications:', error);
        res.status(500).json({ error: 'Failed to create bulk notifications' });
      }
    }
  );

  /**
   * PUT /notifications/:id/read - Mark notification as read
   */
  router.put(
    '/:id/read',
    [
      param('id').isUUID().withMessage('Valid notification ID required'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        await notificationService.markAsRead(req.params.id, userId);
        res.json({ message: 'Notification marked as read' });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
      }
    }
  );

  /**
   * PUT /notifications/read-multiple - Mark multiple notifications as read
   */
  router.put(
    '/read-multiple',
    [
      body('notificationIds').isArray({ min: 1 }).withMessage('At least one notification ID required'),
      body('notificationIds.*').isUUID().withMessage('All notification IDs must be valid UUIDs'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        await notificationService.markMultipleAsRead(req.body.notificationIds, userId);
        res.json({ 
          message: `${req.body.notificationIds.length} notifications marked as read`,
          count: req.body.notificationIds.length 
        });
      } catch (error) {
        console.error('Error marking multiple notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
      }
    }
  );

  /**
   * DELETE /notifications/:id - Delete notification
   */
  router.delete(
    '/:id',
    [
      param('id').isUUID().withMessage('Valid notification ID required'),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        await notificationService.deleteNotification(req.params.id, userId);
        res.json({ message: 'Notification deleted' });
      } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
      }
    }
  );

  /**
   * GET /notifications/preferences - Get user notification preferences
   */
  router.get(
    '/preferences',
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const preferences = await notificationService.getUserPreferences(
          userId, 
          req.user?.organizationId
        );
        res.json(preferences);
      } catch (error) {
        console.error('Error getting notification preferences:', error);
        res.status(500).json({ error: 'Failed to get notification preferences' });
      }
    }
  );

  /**
   * PUT /notifications/preferences - Update user notification preferences
   */
  router.put(
    '/preferences',
    [
      body('preferences').isArray().withMessage('Preferences array required'),
      body('preferences.*.type').isIn(Object.values(NotificationType)),
      body('preferences.*.channel').isIn(Object.values(NotificationChannel)),
      body('preferences.*.isEnabled').isBoolean(),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        await notificationService.updateUserPreferences(
          userId,
          req.body.preferences,
          req.user?.organizationId
        );
        res.json({ message: 'Notification preferences updated' });
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Failed to update notification preferences' });
      }
    }
  );

  /**
   * GET /notifications/stats - Get notification statistics
   */
  router.get(
    '/stats',
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        const result = await notificationService.getNotifications({
          recipientId: userId,
          organizationId: req.user?.organizationId,
          limit: 1, // We only need the counts
        });

        res.json({
          totalNotifications: result.total,
          unreadCount: result.unreadCount,
          readCount: result.total - result.unreadCount,
        });
      } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ error: 'Failed to get notification stats' });
      }
    }
  );

  return router;
}