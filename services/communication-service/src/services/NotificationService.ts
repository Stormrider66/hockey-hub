import { Repository, DataSource, In, LessThan, MoreThan } from 'typeorm';
import { 
  Notification, 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus,
  NotificationPriority,
  NotificationTemplate,
  NotificationPreference,
  NotificationQueue,
  QueueStatus
} from '../entities';
import { Logger } from '@hockey-hub/shared-lib';
import { NotificationGroupingService } from './NotificationGroupingService';

export interface CreateNotificationInput {
  recipientId: string;
  organizationId?: string;
  teamId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  channels?: NotificationChannel[];
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  recipientId?: string;
  organizationId?: string;
  teamId?: string;
  type?: NotificationType | NotificationType[];
  status?: NotificationStatus | NotificationStatus[];
  priority?: NotificationPriority | NotificationPriority[];
  channels?: NotificationChannel[];
  unreadOnly?: boolean;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private templateRepository: Repository<NotificationTemplate>;
  private preferenceRepository: Repository<NotificationPreference>;
  private queueRepository: Repository<NotificationQueue>;
  private groupingService: NotificationGroupingService;
  private logger: Logger;

  constructor(dataSource: DataSource) {
    this.notificationRepository = dataSource.getRepository(Notification);
    this.templateRepository = dataSource.getRepository(NotificationTemplate);
    this.preferenceRepository = dataSource.getRepository(NotificationPreference);
    this.queueRepository = dataSource.getRepository(NotificationQueue);
    this.groupingService = new NotificationGroupingService(dataSource);
    this.logger = new Logger('NotificationService');
  }

  /**
   * Create a new notification
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    try {
      // Check if notification should be sent, grouped, or batched
      const groupingResult = await this.groupingService.shouldSendNotification(input);
      
      if (!groupingResult.shouldSend) {
        this.logger.info('Notification not sent', {
          recipientId: input.recipientId,
          type: input.type,
          reason: groupingResult.reason
        });
        
        // Return a placeholder notification (won't be saved to DB)
        return {
          id: 'pending',
          recipient_id: input.recipientId,
          type: input.type,
          title: input.title,
          message: input.message,
          status: NotificationStatus.PENDING,
          metadata: { ...input.metadata, batched: true }
        } as Notification;
      }

      // Use grouped notification if available
      const notificationInput = groupingResult.groupedNotification || input;

      // Get user preferences to determine channels if not specified
      const channels = notificationInput.channels || await this.getPreferredChannels(
        notificationInput.recipientId, 
        notificationInput.type,
        notificationInput.organizationId
      );

      const notification = this.notificationRepository.create({
        recipient_id: notificationInput.recipientId,
        organization_id: notificationInput.organizationId,
        team_id: notificationInput.teamId,
        type: notificationInput.type,
        title: notificationInput.title,
        message: notificationInput.message,
        priority: notificationInput.priority || NotificationPriority.NORMAL,
        action_url: notificationInput.actionUrl,
        action_text: notificationInput.actionText,
        related_entity_id: notificationInput.relatedEntityId,
        related_entity_type: notificationInput.relatedEntityType,
        channels,
        scheduled_for: notificationInput.scheduledFor || new Date(),
        expires_at: notificationInput.expiresAt,
        metadata: notificationInput.metadata,
      });

      const savedNotification = await this.notificationRepository.save(notification);

      // Queue the notification for delivery
      await this.queueNotification(savedNotification);

      this.logger.info('Notification created', {
        notificationId: savedNotification.id,
        recipientId: notificationInput.recipientId,
        type: notificationInput.type,
        channels: channels.length,
        grouped: groupingResult.shouldGroup
      });

      return savedNotification;
    } catch (error) {
      this.logger.error('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Queue notification for delivery across channels
   */
  private async queueNotification(notification: Notification): Promise<void> {
    const queueEntries = notification.channels.map(channel => 
      this.queueRepository.create({
        notification_id: notification.id,
        channel,
        priority: notification.priority,
        scheduled_for: notification.scheduled_for || new Date(),
      })
    );

    await this.queueRepository.save(queueEntries);
  }

  /**
   * Get user's preferred notification channels for a specific type
   */
  private async getPreferredChannels(
    userId: string, 
    type: NotificationType,
    organizationId?: string
  ): Promise<NotificationChannel[]> {
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
      return [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
    }

    return preferences.map(pref => pref.channel);
  }

  /**
   * Get notifications for a user with filtering
   */
  async getNotifications(filters: NotificationFilters): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const whereClause: any = {};

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
          ? In(filters.type) 
          : filters.type;
      }

      if (filters.status) {
        whereClause.status = Array.isArray(filters.status) 
          ? In(filters.status) 
          : filters.status;
      }

      if (filters.priority) {
        whereClause.priority = Array.isArray(filters.priority) 
          ? In(filters.priority) 
          : filters.priority;
      }

      if (filters.unreadOnly) {
        whereClause.read_at = null;
      }

      if (filters.scheduledAfter) {
        whereClause.scheduled_for = MoreThan(filters.scheduledAfter);
      }

      if (filters.scheduledBefore) {
        whereClause.scheduled_for = LessThan(filters.scheduledBefore);
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
    } catch (error) {
      this.logger.error('Failed to get notifications', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await this.notificationRepository.update(
        { 
          id: notificationId, 
          recipient_id: userId,
          read_at: null 
        },
        { 
          read_at: new Date(),
          status: NotificationStatus.READ 
        }
      );

      this.logger.info('Notification marked as read', {
        notificationId,
        userId
      });
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      await this.notificationRepository.update(
        { 
          id: In(notificationIds), 
          recipient_id: userId,
          read_at: null 
        },
        { 
          read_at: new Date(),
          status: NotificationStatus.READ 
        }
      );

      this.logger.info('Multiple notifications marked as read', {
        count: notificationIds.length,
        userId
      });
    } catch (error) {
      this.logger.error('Failed to mark multiple notifications as read', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to delete notification', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string, organizationId?: string): Promise<NotificationPreference[]> {
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
    } catch (error) {
      this.logger.error('Failed to get user preferences', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreference>[],
    organizationId?: string
  ): Promise<void> {
    try {
      // Delete existing preferences for this user/org
      await this.preferenceRepository.delete({
        user_id: userId,
        organization_id: organizationId || undefined,
      });

      // Create new preferences
      const newPreferences = preferences.map(pref => 
        this.preferenceRepository.create({
          ...pref,
          user_id: userId,
          organization_id: organizationId,
        })
      );

      await this.preferenceRepository.save(newPreferences);

      this.logger.info('User preferences updated', {
        userId,
        organizationId,
        count: preferences.length
      });
    } catch (error) {
      this.logger.error('Failed to update user preferences', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications (for team/organization events)
   */
  async createBulkNotifications(
    recipientIds: string[],
    notificationData: Omit<CreateNotificationInput, 'recipientId'>
  ): Promise<Notification[]> {
    try {
      const notifications = recipientIds.map(recipientId =>
        this.notificationRepository.create({
          recipient_id: recipientId,
          organization_id: notificationData.organizationId,
          team_id: notificationData.teamId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || NotificationPriority.NORMAL,
          action_url: notificationData.actionUrl,
          action_text: notificationData.actionText,
          related_entity_id: notificationData.relatedEntityId,
          related_entity_type: notificationData.relatedEntityType,
          channels: notificationData.channels || [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          scheduled_for: notificationData.scheduledFor || new Date(),
          expires_at: notificationData.expiresAt,
          metadata: notificationData.metadata,
        })
      );

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
    } catch (error) {
      this.logger.error('Failed to create bulk notifications', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.notificationRepository.delete({
        created_at: LessThan(cutoffDate),
      });

      this.logger.info('Old notifications cleaned up', {
        deleted: result.affected,
        daysToKeep
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications', error);
      throw error;
    }
  }
}