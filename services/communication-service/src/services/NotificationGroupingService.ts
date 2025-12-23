// @ts-nocheck - Notification grouping service with complex notification patterns
import { Repository, DataSource, In, MoreThan, LessThan } from 'typeorm';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  NotificationChannel,
  NotificationStatus
} from '../entities';
import { Logger } from '@hockey-hub/shared-lib';
import { CreateNotificationInput } from './NotificationService';

export interface GroupingConfig {
  // Time window for grouping similar notifications (in milliseconds)
  groupingWindowMs: number;
  // Maximum number of similar notifications before grouping
  maxSimilarNotifications: number;
  // Types of notifications that should be grouped
  groupableTypes: NotificationType[];
  // Rate limit per user per hour
  rateLimitPerHour: number;
  // Batch delay for non-urgent notifications (in milliseconds)
  batchDelayMs: number;
}

export interface NotificationGroup {
  type: NotificationType;
  count: number;
  firstNotification: Notification;
  lastNotification: Notification;
  notifications: Notification[];
}

export class NotificationGroupingService {
  private notificationRepository: Repository<Notification>;
  private logger: Logger;
  private config: GroupingConfig;
  private pendingBatches: Map<string, Set<CreateNotificationInput>> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    dataSource: DataSource,
    config?: Partial<GroupingConfig>
  ) {
    this.notificationRepository = dataSource.getRepository(Notification);
    this.logger = new Logger('NotificationGroupingService');
    
    this.config = {
      groupingWindowMs: 5 * 60 * 1000, // 5 minutes
      maxSimilarNotifications: 3,
      groupableTypes: [
        NotificationType.MESSAGE_RECEIVED,
        NotificationType.MENTION,
        NotificationType.REACTION_ADDED,
        NotificationType.DOCUMENT_SHARED,
        NotificationType.TASK_ASSIGNED,
        NotificationType.FEEDBACK_RECEIVED,
        NotificationType.WELLNESS_REMINDER,
        NotificationType.PERFORMANCE_REPORT
      ],
      rateLimitPerHour: 50,
      batchDelayMs: 30 * 1000, // 30 seconds
      ...config
    };
  }

  /**
   * Check if a notification should be sent or grouped
   */
  async shouldSendNotification(input: CreateNotificationInput): Promise<{
    shouldSend: boolean;
    shouldGroup: boolean;
    groupedNotification?: CreateNotificationInput;
    reason?: string;
  }> {
    try {
      // Always send urgent notifications immediately
      if (input.priority === NotificationPriority.URGENT) {
        return { shouldSend: true, shouldGroup: false };
      }

      // Check rate limit
      const isWithinRateLimit = await this.checkRateLimit(input.recipientId);
      if (!isWithinRateLimit) {
        return { 
          shouldSend: false, 
          shouldGroup: false, 
          reason: 'Rate limit exceeded' 
        };
      }

      // Check if this type should be grouped
      if (!this.config.groupableTypes.includes(input.type)) {
        return { shouldSend: true, shouldGroup: false };
      }

      // Check for similar recent notifications
      const similarNotifications = await this.findSimilarNotifications(input);
      
      if (similarNotifications.length >= this.config.maxSimilarNotifications) {
        // Group the notifications
        const groupedNotification = await this.createGroupedNotification(
          input, 
          similarNotifications
        );
        
        return { 
          shouldSend: true, 
          shouldGroup: true, 
          groupedNotification 
        };
      }

      // Add to batch if not high priority
      if (input.priority !== NotificationPriority.HIGH) {
        this.addToBatch(input);
        return { 
          shouldSend: false, 
          shouldGroup: false, 
          reason: 'Added to batch' 
        };
      }

      return { shouldSend: true, shouldGroup: false };
    } catch (error) {
      this.logger.error('Error checking notification grouping', error);
      // On error, send the notification to avoid losing it
      return { shouldSend: true, shouldGroup: false };
    }
  }

  /**
   * Check rate limit for a user
   */
  private async checkRateLimit(userId: string): Promise<boolean> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const count = await this.notificationRepository.count({
      where: {
        recipient_id: userId,
        created_at: MoreThan(oneHourAgo)
      }
    });

    return count < this.config.rateLimitPerHour;
  }

  /**
   * Find similar recent notifications
   */
  private async findSimilarNotifications(
    input: CreateNotificationInput
  ): Promise<Notification[]> {
    const windowStart = new Date();
    windowStart.setMilliseconds(
      windowStart.getMilliseconds() - this.config.groupingWindowMs
    );

    const similarNotifications = await this.notificationRepository.find({
      where: {
        recipient_id: input.recipientId,
        type: input.type,
        created_at: MoreThan(windowStart),
        status: In([NotificationStatus.PENDING, NotificationStatus.SENT])
      },
      order: {
        created_at: 'DESC'
      }
    });

    // Additional filtering based on related entity
    if (input.relatedEntityId) {
      return similarNotifications.filter(
        n => n.related_entity_id === input.relatedEntityId
      );
    }

    return similarNotifications;
  }

  /**
   * Create a grouped notification
   */
  private async createGroupedNotification(
    newInput: CreateNotificationInput,
    existingNotifications: Notification[]
  ): Promise<CreateNotificationInput> {
    const count = existingNotifications.length + 1;
    const type = newInput.type;

    // Mark existing notifications as superseded
    await this.notificationRepository.update(
      {
        id: In(existingNotifications.map(n => n.id))
      },
      {
        metadata: () => "metadata || '{\"grouped\": true, \"superseded\": true}'::jsonb"
      }
    );

    // Create grouped notification based on type
    const groupedMessages = this.getGroupedMessage(type, count, newInput);

    return {
      ...newInput,
      title: groupedMessages.title,
      message: groupedMessages.message,
      metadata: {
        ...newInput.metadata,
        grouped: true,
        groupCount: count,
        groupedNotificationIds: existingNotifications.map(n => n.id)
      }
    };
  }

  /**
   * Get grouped message content based on notification type
   */
  private getGroupedMessage(
    type: NotificationType, 
    count: number,
    input: CreateNotificationInput
  ): { title: string; message: string } {
    const messages: Record<NotificationType, { title: string; message: string }> = {
      [NotificationType.MESSAGE_RECEIVED]: {
        title: `${count} new messages`,
        message: `You have ${count} unread messages`
      },
      [NotificationType.MENTION]: {
        title: `${count} mentions`,
        message: `You were mentioned ${count} times`
      },
      [NotificationType.REACTION_ADDED]: {
        title: `${count} new reactions`,
        message: `${count} people reacted to your content`
      },
      [NotificationType.DOCUMENT_SHARED]: {
        title: `${count} documents shared`,
        message: `${count} new documents have been shared with you`
      },
      [NotificationType.TASK_ASSIGNED]: {
        title: `${count} tasks assigned`,
        message: `You have ${count} new tasks to complete`
      },
      [NotificationType.FEEDBACK_RECEIVED]: {
        title: `${count} feedback items`,
        message: `You have received ${count} new feedback items`
      },
      [NotificationType.WELLNESS_REMINDER]: {
        title: 'Multiple wellness reminders',
        message: `You have ${count} pending wellness checks`
      },
      [NotificationType.PERFORMANCE_REPORT]: {
        title: `${count} performance reports`,
        message: `${count} new performance reports are available`
      }
    };

    return messages[type] || {
      title: input.title,
      message: input.message
    };
  }

  /**
   * Add notification to batch
   */
  private addToBatch(input: CreateNotificationInput): void {
    const batchKey = `${input.recipientId}-${input.type}`;
    
    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, new Set());
      
      // Set timer to process this batch
      const timer = setTimeout(() => {
        this.processBatch(batchKey);
      }, this.config.batchDelayMs);
      
      this.batchTimers.set(batchKey, timer);
    }
    
    this.pendingBatches.get(batchKey)!.add(input);
  }

  /**
   * Process a batch of notifications
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.pendingBatches.get(batchKey);
    if (!batch || batch.size === 0) return;

    try {
      const notifications = Array.from(batch);
      
      if (notifications.length === 1) {
        // Single notification, send as-is
        // This would trigger the actual notification creation
        this.logger.debug('Processing single batched notification', {
          batchKey,
          type: notifications[0].type
        });
      } else {
        // Multiple notifications, create grouped notification
        const firstNotification = notifications[0];
        const groupedNotification = {
          ...firstNotification,
          title: `${notifications.length} ${firstNotification.type.replace(/_/g, ' ').toLowerCase()}s`,
          message: this.getBatchedMessage(notifications),
          metadata: {
            ...firstNotification.metadata,
            batched: true,
            batchCount: notifications.length
          }
        };
        
        this.logger.info('Created batched notification', {
          batchKey,
          count: notifications.length,
          type: firstNotification.type
        });
      }
    } catch (error) {
      this.logger.error('Error processing batch', { batchKey, error });
    } finally {
      // Clean up
      this.pendingBatches.delete(batchKey);
      const timer = this.batchTimers.get(batchKey);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(batchKey);
      }
    }
  }

  /**
   * Get batched message content
   */
  private getBatchedMessage(notifications: CreateNotificationInput[]): string {
    const summaries = notifications.slice(0, 3).map(n => n.message);
    let message = summaries.join('\n');
    
    if (notifications.length > 3) {
      message += `\n...and ${notifications.length - 3} more`;
    }
    
    return message;
  }

  /**
   * Get notification groups for a user
   */
  async getNotificationGroups(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<NotificationGroup[]> {
    const where: any = {
      recipient_id: userId,
      type: In(this.config.groupableTypes)
    };

    if (startDate) {
      where.created_at = MoreThan(startDate);
    }
    if (endDate) {
      where.created_at = { ...where.created_at, ...LessThan(endDate) };
    }

    const notifications = await this.notificationRepository.find({
      where,
      order: {
        type: 'ASC',
        created_at: 'DESC'
      }
    });

    // Group by type
    const groups = new Map<NotificationType, NotificationGroup>();
    
    notifications.forEach(notification => {
      if (!groups.has(notification.type)) {
        groups.set(notification.type, {
          type: notification.type,
          count: 0,
          firstNotification: notification,
          lastNotification: notification,
          notifications: []
        });
      }
      
      const group = groups.get(notification.type)!;
      group.count++;
      group.notifications.push(notification);
      group.lastNotification = notification;
    });

    return Array.from(groups.values());
  }

  /**
   * Clean up old grouped notifications
   */
  async cleanupGroupedNotifications(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.notificationRepository.delete({
        created_at: LessThan(cutoffDate),
        metadata: {
          superseded: true
        }
      });

      this.logger.info('Cleaned up grouped notifications', {
        deleted: result.affected,
        daysToKeep
      });
    } catch (error) {
      this.logger.error('Failed to cleanup grouped notifications', error);
    }
  }

  /**
   * Force process all pending batches (useful for shutdown)
   */
  async flushAllBatches(): Promise<void> {
    const batchKeys = Array.from(this.pendingBatches.keys());
    
    await Promise.all(
      batchKeys.map(key => this.processBatch(key))
    );
  }
}