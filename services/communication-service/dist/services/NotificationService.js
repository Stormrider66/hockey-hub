"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const typeorm_1 = require("typeorm");
const entities_1 = require("../entities");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class NotificationService {
    constructor(dataSource) {
        this.notificationRepository = dataSource.getRepository(entities_1.Notification);
        this.templateRepository = dataSource.getRepository(entities_1.NotificationTemplate);
        this.preferenceRepository = dataSource.getRepository(entities_1.NotificationPreference);
        this.queueRepository = dataSource.getRepository(entities_1.NotificationQueue);
        this.logger = new shared_lib_1.Logger('NotificationService');
    }
    /**
     * Create a new notification
     */
    async createNotification(input) {
        try {
            // Get user preferences to determine channels if not specified
            const channels = input.channels || await this.getPreferredChannels(input.recipientId, input.type, input.organizationId);
            const notification = this.notificationRepository.create({
                recipient_id: input.recipientId,
                organization_id: input.organizationId,
                team_id: input.teamId,
                type: input.type,
                title: input.title,
                message: input.message,
                priority: input.priority || entities_1.NotificationPriority.NORMAL,
                action_url: input.actionUrl,
                action_text: input.actionText,
                related_entity_id: input.relatedEntityId,
                related_entity_type: input.relatedEntityType,
                channels,
                scheduled_for: input.scheduledFor || new Date(),
                expires_at: input.expiresAt,
                metadata: input.metadata,
            });
            const savedNotification = await this.notificationRepository.save(notification);
            // Queue the notification for delivery
            await this.queueNotification(savedNotification);
            this.logger.info('Notification created', {
                notificationId: savedNotification.id,
                recipientId: input.recipientId,
                type: input.type,
                channels: channels.length
            });
            return savedNotification;
        }
        catch (error) {
            this.logger.error('Failed to create notification', error);
            throw error;
        }
    }
    /**
     * Queue notification for delivery across channels
     */
    async queueNotification(notification) {
        const queueEntries = notification.channels.map(channel => this.queueRepository.create({
            notification_id: notification.id,
            channel,
            priority: notification.priority,
            scheduled_for: notification.scheduled_for || new Date(),
        }));
        await this.queueRepository.save(queueEntries);
    }
    /**
     * Get user's preferred notification channels for a specific type
     */
    async getPreferredChannels(userId, type, organizationId) {
        const preferences = await this.preferenceRepository.find({
            where: {
                user_id: userId,
                type,
                organization_id: organizationId || undefined,
                is_enabled: true,
            },
        });
        if (preferences.length === 0) {
            // Return default channels if no preferences set
            return [entities_1.NotificationChannel.IN_APP, entities_1.NotificationChannel.EMAIL];
        }
        return preferences.map(pref => pref.channel);
    }
    /**
     * Get notifications for a user with filtering
     */
    async getNotifications(filters) {
        try {
            const whereClause = {};
            if (filters.recipientId) {
                whereClause.recipient_id = filters.recipientId;
            }
            if (filters.organizationId) {
                whereClause.organization_id = filters.organizationId;
            }
            if (filters.teamId) {
                whereClause.team_id = filters.teamId;
            }
            if (filters.type) {
                whereClause.type = Array.isArray(filters.type)
                    ? (0, typeorm_1.In)(filters.type)
                    : filters.type;
            }
            if (filters.status) {
                whereClause.status = Array.isArray(filters.status)
                    ? (0, typeorm_1.In)(filters.status)
                    : filters.status;
            }
            if (filters.priority) {
                whereClause.priority = Array.isArray(filters.priority)
                    ? (0, typeorm_1.In)(filters.priority)
                    : filters.priority;
            }
            if (filters.unreadOnly) {
                whereClause.read_at = null;
            }
            if (filters.scheduledAfter) {
                whereClause.scheduled_for = (0, typeorm_1.MoreThan)(filters.scheduledAfter);
            }
            if (filters.scheduledBefore) {
                whereClause.scheduled_for = (0, typeorm_1.LessThan)(filters.scheduledBefore);
            }
            const [notifications, total] = await this.notificationRepository.findAndCount({
                where: whereClause,
                order: {
                    created_at: 'DESC',
                    priority: 'DESC',
                },
                take: filters.limit || 50,
                skip: filters.offset || 0,
            });
            // Get unread count
            const unreadCount = await this.notificationRepository.count({
                where: {
                    ...whereClause,
                    read_at: null,
                },
            });
            return { notifications, total, unreadCount };
        }
        catch (error) {
            this.logger.error('Failed to get notifications', error);
            throw error;
        }
    }
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        try {
            await this.notificationRepository.update({
                id: notificationId,
                recipient_id: userId,
                read_at: null
            }, {
                read_at: new Date(),
                status: entities_1.NotificationStatus.READ
            });
            this.logger.info('Notification marked as read', {
                notificationId,
                userId
            });
        }
        catch (error) {
            this.logger.error('Failed to mark notification as read', error);
            throw error;
        }
    }
    /**
     * Mark multiple notifications as read
     */
    async markMultipleAsRead(notificationIds, userId) {
        try {
            await this.notificationRepository.update({
                id: (0, typeorm_1.In)(notificationIds),
                recipient_id: userId,
                read_at: null
            }, {
                read_at: new Date(),
                status: entities_1.NotificationStatus.READ
            });
            this.logger.info('Multiple notifications marked as read', {
                count: notificationIds.length,
                userId
            });
        }
        catch (error) {
            this.logger.error('Failed to mark multiple notifications as read', error);
            throw error;
        }
    }
    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            const result = await this.notificationRepository.delete({
                id: notificationId,
                recipient_id: userId,
            });
            if (result.affected === 0) {
                throw new Error('Notification not found or not owned by user');
            }
            this.logger.info('Notification deleted', {
                notificationId,
                userId
            });
        }
        catch (error) {
            this.logger.error('Failed to delete notification', error);
            throw error;
        }
    }
    /**
     * Get user notification preferences
     */
    async getUserPreferences(userId, organizationId) {
        try {
            return await this.preferenceRepository.find({
                where: {
                    user_id: userId,
                    organization_id: organizationId || undefined,
                },
                order: {
                    type: 'ASC',
                    channel: 'ASC',
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to get user preferences', error);
            throw error;
        }
    }
    /**
     * Update user notification preferences
     */
    async updateUserPreferences(userId, preferences, organizationId) {
        try {
            // Delete existing preferences for this user/org
            await this.preferenceRepository.delete({
                user_id: userId,
                organization_id: organizationId || undefined,
            });
            // Create new preferences
            const newPreferences = preferences.map(pref => this.preferenceRepository.create({
                ...pref,
                user_id: userId,
                organization_id: organizationId,
            }));
            await this.preferenceRepository.save(newPreferences);
            this.logger.info('User preferences updated', {
                userId,
                organizationId,
                count: preferences.length
            });
        }
        catch (error) {
            this.logger.error('Failed to update user preferences', error);
            throw error;
        }
    }
    /**
     * Create bulk notifications (for team/organization events)
     */
    async createBulkNotifications(recipientIds, notificationData) {
        try {
            const notifications = recipientIds.map(recipientId => this.notificationRepository.create({
                recipient_id: recipientId,
                organization_id: notificationData.organizationId,
                team_id: notificationData.teamId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
                priority: notificationData.priority || entities_1.NotificationPriority.NORMAL,
                action_url: notificationData.actionUrl,
                action_text: notificationData.actionText,
                related_entity_id: notificationData.relatedEntityId,
                related_entity_type: notificationData.relatedEntityType,
                channels: notificationData.channels || [entities_1.NotificationChannel.IN_APP, entities_1.NotificationChannel.EMAIL],
                scheduled_for: notificationData.scheduledFor || new Date(),
                expires_at: notificationData.expiresAt,
                metadata: notificationData.metadata,
            }));
            const savedNotifications = await this.notificationRepository.save(notifications);
            // Queue all notifications
            for (const notification of savedNotifications) {
                await this.queueNotification(notification);
            }
            this.logger.info('Bulk notifications created', {
                count: savedNotifications.length,
                type: notificationData.type
            });
            return savedNotifications;
        }
        catch (error) {
            this.logger.error('Failed to create bulk notifications', error);
            throw error;
        }
    }
    /**
     * Clean up old notifications
     */
    async cleanupOldNotifications(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await this.notificationRepository.delete({
                created_at: (0, typeorm_1.LessThan)(cutoffDate),
            });
            this.logger.info('Old notifications cleaned up', {
                deleted: result.affected,
                daysToKeep
            });
        }
        catch (error) {
            this.logger.error('Failed to cleanup old notifications', error);
            throw error;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map