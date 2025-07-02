import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { authMiddleware } from '@hockey-hub/shared-lib';
import PushNotificationService from '../services/PushNotificationService';
import { Logger } from '@hockey-hub/shared-lib';

const router = Router();
const pushService = new PushNotificationService();
const logger = new Logger('PushRoutes');

// Get VAPID public key
router.get('/vapid-public-key', authMiddleware, async (req: Request, res: Response) => {
  try {
    const publicKey = pushService.getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    logger.error('Failed to get VAPID public key:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
});

// Subscribe to push notifications
router.post('/push-subscription',
  authMiddleware,
  [
    body('endpoint').isURL().withMessage('Valid endpoint URL is required'),
    body('keys.p256dh').isLength({ min: 1 }).withMessage('p256dh key is required'),
    body('keys.auth').isLength({ min: 1 }).withMessage('auth key is required')
  ],
  validationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { endpoint, keys } = req.body;
      const userId = req.user!.id;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip || req.connection.remoteAddress;

      const subscription = await pushService.saveSubscription(
        userId,
        { endpoint, keys },
        userAgent,
        ipAddress
      );

      res.status(201).json({
        message: 'Push subscription saved successfully',
        subscription: {
          id: subscription.id,
          endpoint: subscription.endpoint,
          browserName: subscription.browserName,
          deviceType: subscription.deviceType,
          createdAt: subscription.createdAt
        }
      });
    } catch (error) {
      logger.error('Failed to save push subscription:', error);
      res.status(500).json({ error: 'Failed to save push subscription' });
    }
  }
);

// Unsubscribe from push notifications
router.delete('/push-subscription',
  authMiddleware,
  [
    body('endpoint').isURL().withMessage('Valid endpoint URL is required')
  ],
  validationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;
      const userId = req.user!.id;

      await pushService.removeSubscription(userId, endpoint);

      res.json({ message: 'Push subscription removed successfully' });
    } catch (error) {
      logger.error('Failed to remove push subscription:', error);
      res.status(500).json({ error: 'Failed to remove push subscription' });
    }
  }
);

// Get user's push subscriptions
router.get('/push-subscriptions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const subscriptions = await pushService.getUserSubscriptions(userId);

    const sanitizedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      endpoint: sub.endpoint,
      browserName: sub.browserName,
      deviceType: sub.deviceType,
      lastUsedAt: sub.lastUsedAt,
      createdAt: sub.createdAt,
      isActive: sub.isActive
    }));

    res.json({ subscriptions: sanitizedSubscriptions });
  } catch (error) {
    logger.error('Failed to get push subscriptions:', error);
    res.status(500).json({ error: 'Failed to get push subscriptions' });
  }
});

// Send test notification
router.post('/test-notification', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await pushService.sendTestNotification(userId);

    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    logger.error('Failed to send test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Admin: Get push notification statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user has admin permissions
    if (!req.user!.permissions?.includes('ADMIN_NOTIFICATIONS')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stats = await pushService.getSubscriptionStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get push notification stats:', error);
    res.status(500).json({ error: 'Failed to get push notification stats' });
  }
});

// Admin: Send notification to specific user
router.post('/send/:userId',
  authMiddleware,
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 chars)'),
    body('body').isLength({ min: 1, max: 300 }).withMessage('Body is required (max 300 chars)'),
    body('icon').optional().isURL().withMessage('Icon must be a valid URL'),
    body('data').optional().isObject().withMessage('Data must be an object'),
    body('tag').optional().isLength({ max: 50 }).withMessage('Tag max 50 chars')
  ],
  validationMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Check if user has admin permissions
      if (!req.user!.permissions?.includes('ADMIN_NOTIFICATIONS')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { userId } = req.params;
      const { title, body, icon, data, tag, actions } = req.body;

      const result = await pushService.sendNotificationToUser(userId, {
        title,
        body,
        icon,
        data,
        tag,
        actions
      });

      res.json({
        message: 'Notification sent successfully',
        result
      });
    } catch (error) {
      logger.error('Failed to send notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }
);

// Admin: Send notification to multiple users
router.post('/send-bulk',
  authMiddleware,
  [
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('userIds.*').isUUID().withMessage('All user IDs must be valid UUIDs'),
    body('title').isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 chars)'),
    body('body').isLength({ min: 1, max: 300 }).withMessage('Body is required (max 300 chars)'),
    body('icon').optional().isURL().withMessage('Icon must be a valid URL'),
    body('data').optional().isObject().withMessage('Data must be an object'),
    body('tag').optional().isLength({ max: 50 }).withMessage('Tag max 50 chars')
  ],
  validationMiddleware,
  async (req: Request, res: Response) => {
    try {
      // Check if user has admin permissions
      if (!req.user!.permissions?.includes('ADMIN_NOTIFICATIONS')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { userIds, title, body, icon, data, tag, actions } = req.body;

      const results = await pushService.sendNotificationToMultipleUsers(userIds, {
        title,
        body,
        icon,
        data,
        tag,
        actions
      });

      const totalSent = Object.values(results).reduce((sum, result) => sum + result.sent, 0);
      const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);

      res.json({
        message: 'Bulk notification sent',
        totalSent,
        totalFailed,
        results
      });
    } catch (error) {
      logger.error('Failed to send bulk notification:', error);
      res.status(500).json({ error: 'Failed to send bulk notification' });
    }
  }
);

// Admin: Cleanup inactive subscriptions
router.post('/cleanup', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user has admin permissions
    if (!req.user!.permissions?.includes('ADMIN_NOTIFICATIONS')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const cleanedUp = await pushService.cleanupInactiveSubscriptions();

    res.json({
      message: 'Cleanup completed successfully',
      cleanedUp
    });
  } catch (error) {
    logger.error('Failed to cleanup subscriptions:', error);
    res.status(500).json({ error: 'Failed to cleanup subscriptions' });
  }
});

export default router;