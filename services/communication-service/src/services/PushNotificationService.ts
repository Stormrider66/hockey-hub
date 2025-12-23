// @ts-nocheck - Push notification service with web-push
import webpush from 'web-push';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PushSubscription } from '../entities/PushSubscription';
import { UserPresence } from '../entities/UserPresence';
import { Logger } from '@hockey-hub/shared-lib';
import UAParser from 'ua-parser-js';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class PushNotificationService {
  private pushSubscriptionRepository: Repository<PushSubscription>;
  private userPresenceRepository: Repository<UserPresence>;
  private logger: Logger;

  constructor() {
    this.pushSubscriptionRepository = AppDataSource.getRepository(PushSubscription);
    this.userPresenceRepository = AppDataSource.getRepository(UserPresence);
    this.logger = new Logger('PushNotificationService');

    // Configure web-push with VAPID keys
    this.initializeWebPush();
  }

  private initializeWebPush(): void {
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@hockeyhub.com';
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured. Push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    this.logger.info('Web-push configured successfully');
  }

  public getVapidPublicKey(): string {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('VAPID public key not configured');
    }
    return publicKey;
  }

  public async saveSubscription(
    userId: string,
    subscriptionData: PushSubscriptionData,
    userAgent?: string,
    ipAddress?: string
  ): Promise<PushSubscription> {
    try {
      // Parse user agent for device info
      const parser = new UAParser(userAgent);
      const browserName = parser.getBrowser().name;
      const deviceType = parser.getDevice().type || 'desktop';

      // Check if subscription already exists
      let subscription = await this.pushSubscriptionRepository.findOne({
        where: { endpoint: subscriptionData.endpoint }
      });

      if (subscription) {
        // Update existing subscription
        subscription.userId = userId;
        subscription.p256dhKey = subscriptionData.keys.p256dh;
        subscription.authKey = subscriptionData.keys.auth;
        subscription.userAgent = userAgent;
        subscription.browserName = browserName;
        subscription.deviceType = deviceType;
        subscription.ipAddress = ipAddress;
        subscription.lastUsedAt = new Date();
        subscription.isActive = true;
      } else {
        // Create new subscription
        subscription = this.pushSubscriptionRepository.create({
          userId,
          endpoint: subscriptionData.endpoint,
          p256dhKey: subscriptionData.keys.p256dh,
          authKey: subscriptionData.keys.auth,
          userAgent,
          browserName,
          deviceType,
          ipAddress,
          lastUsedAt: new Date(),
          isActive: true
        });
      }

      await this.pushSubscriptionRepository.save(subscription);
      this.logger.info(`Push subscription saved for user ${userId}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to save push subscription:', error);
      throw error;
    }
  }

  public async removeSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      await this.pushSubscriptionRepository.update(
        { userId, endpoint },
        { isActive: false }
      );
      this.logger.info(`Push subscription removed for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to remove push subscription:', error);
      throw error;
    }
  }

  public async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    try {
      return await this.pushSubscriptionRepository.find({
        where: { userId, isActive: true }
      });
    } catch (error) {
      this.logger.error('Failed to get user subscriptions:', error);
      throw error;
    }
  }

  public async sendNotificationToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Check if user is offline before sending push notification
      const userPresence = await this.userPresenceRepository.findOne({
        where: { userId }
      });

      // Don't send push notification if user is online (they'll see in-app notification)
      if (userPresence?.status === 'online') {
        this.logger.debug(`User ${userId} is online, skipping push notification`);
        return { sent: 0, failed: 0 };
      }

      const subscriptions = await this.getUserSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        this.logger.debug(`No active push subscriptions for user ${userId}`);
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      const sendPromises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            {
              TTL: 24 * 60 * 60, // 24 hours
              urgency: 'normal',
              topic: payload.tag || 'default'
            }
          );

          // Update last used timestamp
          await this.pushSubscriptionRepository.update(subscription.id, {
            lastUsedAt: new Date()
          });

          sent++;
          this.logger.debug(`Push notification sent to subscription ${subscription.id}`);
        } catch (error: any) {
          failed++;
          this.logger.error(`Failed to send push notification to subscription ${subscription.id}:`, error);

          // Handle invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.pushSubscriptionRepository.update(subscription.id, {
              isActive: false
            });
            this.logger.info(`Deactivated invalid subscription ${subscription.id}`);
          }
        }
      });

      await Promise.allSettled(sendPromises);
      
      this.logger.info(`Push notifications sent to user ${userId}: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      this.logger.error('Failed to send push notifications:', error);
      throw error;
    }
  }

  public async sendNotificationToMultipleUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ): Promise<{ [userId: string]: { sent: number; failed: number } }> {
    const results: { [userId: string]: { sent: number; failed: number } } = {};

    const sendPromises = userIds.map(async (userId) => {
      try {
        results[userId] = await this.sendNotificationToUser(userId, payload);
      } catch (error) {
        this.logger.error(`Failed to send notification to user ${userId}:`, error);
        results[userId] = { sent: 0, failed: 1 };
      }
    });

    await Promise.allSettled(sendPromises);
    return results;
  }

  public async sendTestNotification(userId: string): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'Hockey Hub Test Notification',
      body: 'This is a test notification from Hockey Hub!',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'test',
      data: {
        type: 'test',
        userId,
        timestamp: Date.now()
      },
      actions: [
        { action: 'view', title: 'View App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    await this.sendNotificationToUser(userId, payload);
  }

  public async cleanupInactiveSubscriptions(): Promise<number> {
    try {
      // Remove subscriptions that haven't been used in 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.pushSubscriptionRepository.update(
        {
          lastUsedAt: {
            $lt: thirtyDaysAgo
          } as any,
          isActive: true
        },
        { isActive: false }
      );

      const cleanedUp = result.affected || 0;
      this.logger.info(`Cleaned up ${cleanedUp} inactive push subscriptions`);
      return cleanedUp;
    } catch (error) {
      this.logger.error('Failed to cleanup inactive subscriptions:', error);
      throw error;
    }
  }

  public async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    byBrowser: { [browser: string]: number };
    byDevice: { [device: string]: number };
  }> {
    try {
      const subscriptions = await this.pushSubscriptionRepository.find();
      
      const stats = {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.isActive).length,
        byBrowser: {} as { [browser: string]: number },
        byDevice: {} as { [device: string]: number }
      };

      subscriptions.forEach(subscription => {
        if (subscription.isActive) {
          const browser = subscription.browserName || 'Unknown';
          const device = subscription.deviceType || 'Unknown';
          
          stats.byBrowser[browser] = (stats.byBrowser[browser] || 0) + 1;
          stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get subscription stats:', error);
      throw error;
    }
  }
}

export default PushNotificationService;