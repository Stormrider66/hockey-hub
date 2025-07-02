"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedNotificationRepository = void 0;
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedNotificationRepository {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
        this.shortTTL = 60; // 1 minute for frequently changing data
        this.longTTL = 1800; // 30 minutes for analytics
        this.repository = database_1.AppDataSource.getRepository(Notification_1.Notification);
    }
    // Notification retrieval
    async findById(id, useCache = true) {
        const cacheKey = `notification:${id}`;
        if (useCache) {
            try {
                const cached = await database_1.redisClient.get(cacheKey);
                if (cached) {
                    shared_lib_1.logger.debug(`Cache hit for notification: ${id}`);
                    return JSON.parse(cached);
                }
            }
            catch (error) {
                shared_lib_1.logger.warn('Redis get error for notification:', error);
            }
        }
        const notification = await this.repository.findOne({
            where: { id }
        });
        if (notification && useCache) {
            try {
                await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(notification));
            }
            catch (error) {
                shared_lib_1.logger.warn('Redis set error for notification:', error);
            }
        }
        return notification;
    }
    async findUserNotifications(userId, limit = 20, offset = 0, status, priority) {
        const cacheKey = `user_notifications:${userId}:${limit}:${offset}:${status || 'all'}:${priority || 'all'}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for user notifications: ${userId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for user notifications:', error);
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
            unreadStatuses: [Notification_1.NotificationStatus.PENDING, Notification_1.NotificationStatus.SENT, Notification_1.NotificationStatus.DELIVERED]
        })
            .getCount();
        const result = {
            notifications,
            total,
            unreadCount
        };
        try {
            await database_1.redisClient.setex(cacheKey, this.shortTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for user notifications:', error);
        }
        return result;
    }
    async findTeamNotifications(teamId, limit = 20, offset = 0, type) {
        const cacheKey = `team_notifications:${teamId}:${limit}:${offset}:${type || 'all'}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for team notifications: ${teamId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for team notifications:', error);
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
            await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for team notifications:', error);
        }
        return result;
    }
    async findPendingNotifications(limit = 100) {
        const cacheKey = `pending_notifications:${limit}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug('Cache hit for pending notifications');
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for pending notifications:', error);
        }
        const notifications = await this.repository
            .createQueryBuilder('notification')
            .where('notification.status = :status', { status: Notification_1.NotificationStatus.PENDING })
            .andWhere('(notification.scheduled_for IS NULL OR notification.scheduled_for <= :now)', {
            now: new Date()
        })
            .orderBy('notification.priority', 'DESC')
            .addOrderBy('notification.created_at', 'ASC')
            .take(limit)
            .getMany();
        try {
            // Cache for very short time as this changes frequently
            await database_1.redisClient.setex(cacheKey, 30, JSON.stringify(notifications));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for pending notifications:', error);
        }
        return notifications;
    }
    async findFailedNotifications(limit = 50) {
        const cacheKey = `failed_notifications:${limit}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug('Cache hit for failed notifications');
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for failed notifications:', error);
        }
        const notifications = await this.repository
            .createQueryBuilder('notification')
            .where('notification.status = :status', { status: Notification_1.NotificationStatus.FAILED })
            .andWhere('notification.retry_count < notification.max_retries')
            .andWhere('(notification.next_retry_at IS NULL OR notification.next_retry_at <= :now)', {
            now: new Date()
        })
            .orderBy('notification.priority', 'DESC')
            .addOrderBy('notification.next_retry_at', 'ASC')
            .take(limit)
            .getMany();
        try {
            await database_1.redisClient.setex(cacheKey, this.shortTTL, JSON.stringify(notifications));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for failed notifications:', error);
        }
        return notifications;
    }
    // Notification creation and updates
    async create(notificationData) {
        const notification = this.repository.create(notificationData);
        const savedNotification = await this.repository.save(notification);
        // Invalidate related caches
        await this.invalidateUserNotificationCache(notificationData.recipient_id);
        if (notificationData.team_id) {
            await this.invalidateTeamNotificationCache(notificationData.team_id);
        }
        await this.invalidatePendingNotificationCache();
        return savedNotification;
    }
    async update(id, updates) {
        const notification = await this.repository.findOne({ where: { id } });
        if (!notification)
            return null;
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
    async markAsRead(id) {
        const result = await this.repository.update(id, {
            status: Notification_1.NotificationStatus.READ,
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
    async markAsDelivered(id) {
        const result = await this.repository.update(id, {
            status: Notification_1.NotificationStatus.DELIVERED,
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
    async markAsSent(id) {
        const result = await this.repository.update(id, {
            status: Notification_1.NotificationStatus.SENT,
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
    async markAsFailed(id, errorMessage) {
        const notification = await this.repository.findOne({ where: { id } });
        if (!notification)
            return false;
        const nextRetryAt = this.calculateNextRetryTime(notification.retry_count + 1);
        const result = await this.repository.update(id, {
            status: Notification_1.NotificationStatus.FAILED,
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
    async bulkMarkAsRead(userId, notificationIds) {
        let queryBuilder = this.repository
            .createQueryBuilder()
            .update(Notification_1.Notification)
            .set({
            status: Notification_1.NotificationStatus.READ,
            read_at: new Date()
        })
            .where('recipient_id = :userId', { userId })
            .andWhere('status IN (:...unreadStatuses)', {
            unreadStatuses: [Notification_1.NotificationStatus.PENDING, Notification_1.NotificationStatus.SENT, Notification_1.NotificationStatus.DELIVERED]
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
    async getNotificationStats(userId, teamId, timeRange) {
        const cacheKey = `notification_stats:${userId || 'all'}:${teamId || 'all'}:${timeRange ? `${timeRange.start.getTime()}-${timeRange.end.getTime()}` : 'all'}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug('Cache hit for notification stats');
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for notification stats:', error);
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
        }, {});
        const byType = notifications.reduce((acc, notification) => {
            acc[notification.type] = (acc[notification.type] || 0) + 1;
            return acc;
        }, {});
        const byPriority = notifications.reduce((acc, notification) => {
            acc[notification.priority] = (acc[notification.priority] || 0) + 1;
            return acc;
        }, {});
        // Calculate delivery rate
        const deliveredCount = (byStatus[Notification_1.NotificationStatus.DELIVERED] || 0) + (byStatus[Notification_1.NotificationStatus.READ] || 0);
        const deliveryRate = totalNotifications > 0 ? Math.round((deliveredCount / totalNotifications) * 100) : 0;
        // Calculate average delivery time
        const deliveredNotifications = notifications.filter(n => n.delivered_at && n.sent_at);
        const avgDeliveryTime = deliveredNotifications.length > 0
            ? Math.round(deliveredNotifications.reduce((sum, n) => sum + (n.delivered_at.getTime() - n.sent_at.getTime()), 0) / deliveredNotifications.length / 1000)
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
            await database_1.redisClient.setex(cacheKey, this.longTTL, JSON.stringify(stats));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for notification stats:', error);
        }
        return stats;
    }
    // Utility methods
    calculateNextRetryTime(retryCount) {
        // Exponential backoff: 1min, 5min, 15min, 60min
        const delays = [60, 300, 900, 3600]; // in seconds
        const delayIndex = Math.min(retryCount - 1, delays.length - 1);
        const delay = delays[delayIndex];
        return new Date(Date.now() + delay * 1000);
    }
    // Cache invalidation
    async invalidateNotificationCache(notificationId) {
        try {
            const pattern = `notification:${notificationId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} notification cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating notification cache:', error);
        }
    }
    async invalidateUserNotificationCache(userId) {
        try {
            const pattern = `user_notifications:${userId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} user notification cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating user notification cache:', error);
        }
    }
    async invalidateTeamNotificationCache(teamId) {
        try {
            const pattern = `team_notifications:${teamId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} team notification cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating team notification cache:', error);
        }
    }
    async invalidatePendingNotificationCache() {
        try {
            const pattern = 'pending_notifications:*';
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} pending notification cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating pending notification cache:', error);
        }
    }
    async invalidateFailedNotificationCache() {
        try {
            const pattern = 'failed_notifications:*';
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} failed notification cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating failed notification cache:', error);
        }
    }
}
exports.CachedNotificationRepository = CachedNotificationRepository;
//# sourceMappingURL=CachedNotificationRepository.js.map