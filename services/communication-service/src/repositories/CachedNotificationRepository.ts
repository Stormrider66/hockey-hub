import { Repository } from 'typeorm';
import { AppDataSource, redisClient } from '../config/database';
import { 
  Notification, 
  NotificationType, 
  NotificationStatus, 
  NotificationPriority,
  NotificationChannel 
} from '../entities/Notification';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('cached-notification-repo');

export class CachedNotificationRepository {
  private repository: Repository<Notification>;
  private readonly defaultTTL = 300; // 5 minutes
  private readonly shortTTL = 60; // 1 minute for frequently changing data
  private readonly longTTL = 1800; // 30 minutes for analytics

  constructor() {
    this.repository = AppDataSource.getRepository(Notification);
  }

  // Notification retrieval
  async findById(id: string, useCache = true): Promise<Notification | null> {
    const cacheKey = `notification:${id}`;
    
    if (useCache) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`Cache hit for notification: ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn('Redis get error for notification:', error);
      }
    }

    const notification = await this.repository.findOne({
      where: { id }
    });

    if (notification && useCache) {
      try {
        await redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(notification));
      } catch (error) {
        logger.warn('Redis set error for notification:', error);
      }
    }

    return notification;
  }

  async findUserNotifications(
    userId: string, 
    limit = 20, 
    offset = 0,
    status?: NotificationStatus,
    priority?: NotificationPriority
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const cacheKey = `user_notifications:${userId}:${limit}:${offset}:${status || 'all'}:${priority || 'all'}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for user notifications: ${userId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for user notifications:', error);
    }

    let queryBuilder = this.repository
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC');

    if (status) {
      queryBuilder = queryBuilder.andWhere('notification.status = :status', { status });
    }

    if (priority) {
      queryBuilder = queryBuilder.andWhere('notification.priority = :priority', { priority });
    }

    const [notifications, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Get unread count
    const unreadCount = await this.repository
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :userId', { userId })
      .andWhere('notification.status IN (:...unreadStatuses)', { 
        unreadStatuses: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED] 
      })
      .getCount();

    const result = {
      notifications,
      total,
      unreadCount
    };

    try {
      await redisClient.setex(cacheKey, this.shortTTL, JSON.stringify(result));
    } catch (error) {
      logger.warn('Redis set error for user notifications:', error);
    }

    return result;
  }

  async findTeamNotifications(
    teamId: string, 
    limit = 20, 
    offset = 0,
    type?: NotificationType
  ): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    const cacheKey = `team_notifications:${teamId}:${limit}:${offset}:${type || 'all'}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for team notifications: ${teamId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for team notifications:', error);
    }

    let queryBuilder = this.repository
      .createQueryBuilder('notification')
      .where('notification.team_id = :teamId', { teamId })
      .orderBy('notification.created_at', 'DESC');

    if (type) {
      queryBuilder = queryBuilder.andWhere('notification.type = :type', { type });
    }

    const [notifications, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const result = { notifications, total };

    try {
      await redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
    } catch (error) {
      logger.warn('Redis set error for team notifications:', error);
    }

    return result;
  }

  async findPendingNotifications(limit = 100): Promise<Notification[]> {
    const cacheKey = `pending_notifications:${limit}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for pending notifications');
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for pending notifications:', error);
    }

    const notifications = await this.repository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: NotificationStatus.PENDING })
      .andWhere('(notification.scheduled_for IS NULL OR notification.scheduled_for <= :now)', { 
        now: new Date() 
      })
      .orderBy('notification.priority', 'DESC')
      .addOrderBy('notification.created_at', 'ASC')
      .take(limit)
      .getMany();

    try {
      // Cache for very short time as this changes frequently
      await redisClient.setex(cacheKey, 30, JSON.stringify(notifications));
    } catch (error) {
      logger.warn('Redis set error for pending notifications:', error);
    }

    return notifications;
  }

  async findFailedNotifications(limit = 50): Promise<Notification[]> {
    const cacheKey = `failed_notifications:${limit}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for failed notifications');
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for failed notifications:', error);
    }

    const notifications = await this.repository
      .createQueryBuilder('notification')
      .where('notification.status = :status', { status: NotificationStatus.FAILED })
      .andWhere('notification.retry_count < notification.max_retries')
      .andWhere('(notification.next_retry_at IS NULL OR notification.next_retry_at <= :now)', { 
        now: new Date() 
      })
      .orderBy('notification.priority', 'DESC')
      .addOrderBy('notification.next_retry_at', 'ASC')
      .take(limit)
      .getMany();

    try {
      await redisClient.setex(cacheKey, this.shortTTL, JSON.stringify(notifications));
    } catch (error) {
      logger.warn('Redis set error for failed notifications:', error);
    }

    return notifications;
  }

  // Notification creation and updates
  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.repository.create(notificationData);
    const savedNotification = await this.repository.save(notification);

    // Invalidate related caches
    await this.invalidateUserNotificationCache(notificationData.recipient_id!);
    if (notificationData.team_id) {
      await this.invalidateTeamNotificationCache(notificationData.team_id);
    }
    await this.invalidatePendingNotificationCache();

    return savedNotification;
  }

  async update(id: string, updates: Partial<Notification>): Promise<Notification | null> {
    const notification = await this.repository.findOne({ where: { id } });
    if (!notification) return null;

    await this.repository.update(id, updates);
    const updatedNotification = await this.repository.findOne({ where: { id } });

    // Invalidate caches
    await this.invalidateNotificationCache(id);
    await this.invalidateUserNotificationCache(notification.recipient_id);
    if (notification.team_id) {
      await this.invalidateTeamNotificationCache(notification.team_id);
    }
    
    // If status changed, invalidate status-specific caches
    if (updates.status) {
      await this.invalidatePendingNotificationCache();
      await this.invalidateFailedNotificationCache();
    }

    return updatedNotification;
  }

  async markAsRead(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: NotificationStatus.READ,
      read_at: new Date()
    });

    if (result.affected && result.affected > 0) {
      const notification = await this.repository.findOne({ where: { id } });
      if (notification) {
        await this.invalidateNotificationCache(id);
        await this.invalidateUserNotificationCache(notification.recipient_id);
      }
      return true;
    }

    return false;
  }

  async markAsDelivered(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: NotificationStatus.DELIVERED,
      delivered_at: new Date()
    });

    if (result.affected && result.affected > 0) {
      const notification = await this.repository.findOne({ where: { id } });
      if (notification) {
        await this.invalidateNotificationCache(id);
        await this.invalidateUserNotificationCache(notification.recipient_id);
        await this.invalidatePendingNotificationCache();
      }
      return true;
    }

    return false;
  }

  async markAsSent(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      status: NotificationStatus.SENT,
      sent_at: new Date()
    });

    if (result.affected && result.affected > 0) {
      const notification = await this.repository.findOne({ where: { id } });
      if (notification) {
        await this.invalidateNotificationCache(id);
        await this.invalidateUserNotificationCache(notification.recipient_id);
        await this.invalidatePendingNotificationCache();
      }
      return true;
    }

    return false;
  }

  async markAsFailed(id: string, errorMessage: string): Promise<boolean> {
    const notification = await this.repository.findOne({ where: { id } });
    if (!notification) return false;

    const nextRetryAt = this.calculateNextRetryTime(notification.retry_count + 1);

    const result = await this.repository.update(id, { 
      status: NotificationStatus.FAILED,
      error_message: errorMessage,
      retry_count: notification.retry_count + 1,
      next_retry_at: nextRetryAt
    });

    if (result.affected && result.affected > 0) {
      await this.invalidateNotificationCache(id);
      await this.invalidateUserNotificationCache(notification.recipient_id);
      await this.invalidatePendingNotificationCache();
      await this.invalidateFailedNotificationCache();
      return true;
    }

    return false;
  }

  async bulkMarkAsRead(userId: string, notificationIds?: string[]): Promise<number> {
    let queryBuilder = this.repository
      .createQueryBuilder()
      .update(Notification)
      .set({ 
        status: NotificationStatus.READ,
        read_at: new Date()
      })
      .where('recipient_id = :userId', { userId })
      .andWhere('status IN (:...unreadStatuses)', { 
        unreadStatuses: [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED] 
      });

    if (notificationIds && notificationIds.length > 0) {
      queryBuilder = queryBuilder.andWhere('id IN (:...ids)', { ids: notificationIds });
    }

    const result = await queryBuilder.execute();

    // Invalidate caches
    await this.invalidateUserNotificationCache(userId);

    return result.affected || 0;
  }

  // Analytics methods
  async getNotificationStats(
    userId?: string, 
    teamId?: string, 
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalNotifications: number;
    byStatus: Record<NotificationStatus, number>;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
    deliveryRate: number;
    avgDeliveryTime: number;
  }> {
    const cacheKey = `notification_stats:${userId || 'all'}:${teamId || 'all'}:${timeRange ? `${timeRange.start.getTime()}-${timeRange.end.getTime()}` : 'all'}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit for notification stats');
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for notification stats:', error);
    }

    let queryBuilder = this.repository.createQueryBuilder('notification');

    if (userId) {
      queryBuilder = queryBuilder.where('notification.recipient_id = :userId', { userId });
    }

    if (teamId) {
      const condition = userId ? 'andWhere' : 'where';
      queryBuilder = queryBuilder[condition]('notification.team_id = :teamId', { teamId });
    }

    if (timeRange) {
      const condition = userId || teamId ? 'andWhere' : 'where';
      queryBuilder = queryBuilder[condition]('notification.created_at >= :start', { start: timeRange.start })
        .andWhere('notification.created_at <= :end', { end: timeRange.end });
    }

    const notifications = await queryBuilder.getMany();

    const totalNotifications = notifications.length;
    
    const byStatus = notifications.reduce((acc, notification) => {
      acc[notification.status] = (acc[notification.status] || 0) + 1;
      return acc;
    }, {} as Record<NotificationStatus, number>);

    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    const byPriority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {} as Record<NotificationPriority, number>);

    // Calculate delivery rate
    const deliveredCount = (byStatus[NotificationStatus.DELIVERED] || 0) + (byStatus[NotificationStatus.READ] || 0);
    const deliveryRate = totalNotifications > 0 ? Math.round((deliveredCount / totalNotifications) * 100) : 0;

    // Calculate average delivery time
    const deliveredNotifications = notifications.filter(n => n.delivered_at && n.sent_at);
    const avgDeliveryTime = deliveredNotifications.length > 0
      ? Math.round(
          deliveredNotifications.reduce((sum, n) => 
            sum + (n.delivered_at!.getTime() - n.sent_at!.getTime()), 0
          ) / deliveredNotifications.length / 1000
        )
      : 0;

    const stats = {
      totalNotifications,
      byStatus,
      byType,
      byPriority,
      deliveryRate,
      avgDeliveryTime
    };

    try {
      await redisClient.setex(cacheKey, this.longTTL, JSON.stringify(stats));
    } catch (error) {
      logger.warn('Redis set error for notification stats:', error);
    }

    return stats;
  }

  // Utility methods
  private calculateNextRetryTime(retryCount: number): Date {
    // Exponential backoff: 1min, 5min, 15min, 60min
    const delays = [60, 300, 900, 3600]; // in seconds
    const delayIndex = Math.min(retryCount - 1, delays.length - 1);
    const delay = delays[delayIndex];
    
    return new Date(Date.now() + delay * 1000);
  }

  // Cache invalidation
  private async invalidateNotificationCache(notificationId: string): Promise<void> {
    try {
      const pattern = `notification:${notificationId}*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} notification cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating notification cache:', error);
    }
  }

  private async invalidateUserNotificationCache(userId: string): Promise<void> {
    try {
      const pattern = `user_notifications:${userId}*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} user notification cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating user notification cache:', error);
    }
  }

  private async invalidateTeamNotificationCache(teamId: string): Promise<void> {
    try {
      const pattern = `team_notifications:${teamId}*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} team notification cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating team notification cache:', error);
    }
  }

  private async invalidatePendingNotificationCache(): Promise<void> {
    try {
      const pattern = 'pending_notifications:*';
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} pending notification cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating pending notification cache:', error);
    }
  }

  private async invalidateFailedNotificationCache(): Promise<void> {
    try {
      const pattern = 'failed_notifications:*';
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} failed notification cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating failed notification cache:', error);
    }
  }
}