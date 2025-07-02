import { Repository, DataSource, LessThanOrEqual, In } from 'typeorm';
import { 
  NotificationQueue, 
  QueueStatus, 
  Notification,
  NotificationChannel,
  NotificationTemplate,
  NotificationStatus
} from '../entities';
import { EmailService } from './EmailService';
import { EmailNotificationService } from './EmailNotificationService';
import PushNotificationService from './PushNotificationService';
import { Logger } from '@hockey-hub/shared-lib';
import { Server as SocketIOServer } from 'socket.io';

export interface ProcessorConfig {
  batchSize: number;
  processingInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export class NotificationProcessor {
  private queueRepository: Repository<NotificationQueue>;
  private notificationRepository: Repository<Notification>;
  private templateRepository: Repository<NotificationTemplate>;
  private emailService: EmailService;
  private emailNotificationService: EmailNotificationService;
  private pushNotificationService: PushNotificationService;
  private socketIO?: SocketIOServer;
  private logger: Logger;
  private config: ProcessorConfig;
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(
    dataSource: DataSource,
    emailService: EmailService,
    socketIO?: SocketIOServer,
    config: Partial<ProcessorConfig> = {}
  ) {
    this.queueRepository = dataSource.getRepository(NotificationQueue);
    this.notificationRepository = dataSource.getRepository(Notification);
    this.templateRepository = dataSource.getRepository(NotificationTemplate);
    this.emailService = emailService;
    this.socketIO = socketIO;
    this.logger = new Logger('NotificationProcessor');
    
    // Initialize services
    this.pushNotificationService = new PushNotificationService();
    
    this.config = {
      batchSize: 10,
      processingInterval: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 60000, // 1 minute
      ...config,
    };

    // Initialize EmailNotificationService
    this.emailNotificationService = new EmailNotificationService(
      dataSource,
      emailService,
      {
        userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
        offlineThresholdMinutes: parseInt(process.env.OFFLINE_THRESHOLD_MINUTES || '15'),
        digestBatchSize: parseInt(process.env.DIGEST_BATCH_SIZE || '50'),
        digestScheduleHours: (process.env.DIGEST_SCHEDULE_HOURS || '8,20').split(',').map(h => parseInt(h)),
        fromEmail: process.env.EMAIL_FROM || 'noreply@hockeyhub.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Hockey Hub',
        replyToEmail: process.env.EMAIL_REPLY_TO
      }
    );
  }

  /**
   * Start the notification processor
   */
  start(): void {
    if (this.isProcessing) {
      this.logger.warn('Notification processor already running');
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(
      () => this.processQueue(),
      this.config.processingInterval
    );

    this.logger.info('Notification processor started', {
      batchSize: this.config.batchSize,
      interval: this.config.processingInterval
    });
  }

  /**
   * Stop the notification processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.isProcessing = false;
    this.logger.info('Notification processor stopped');
  }

  /**
   * Process the notification queue
   */
  private async processQueue(): Promise<void> {
    try {
      // Get pending notifications that are ready to be sent
      const pendingNotifications = await this.queueRepository.find({
        where: [
          {
            status: QueueStatus.PENDING,
            scheduled_for: LessThanOrEqual(new Date()),
          },
          {
            status: QueueStatus.FAILED,
            next_attempt_at: LessThanOrEqual(new Date()),
          },
        ],
        order: {
          priority: 'DESC',
          scheduled_for: 'ASC',
        },
        take: this.config.batchSize,
      });

      if (pendingNotifications.length === 0) {
        return;
      }

      this.logger.debug('Processing notification queue', {
        count: pendingNotifications.length
      });

      // Process each notification
      await Promise.all(
        pendingNotifications.map(queueItem => 
          this.processNotification(queueItem)
        )
      );
    } catch (error) {
      this.logger.error('Error processing notification queue', error);
    }
  }

  /**
   * Process a single notification queue item
   */
  private async processNotification(queueItem: NotificationQueue): Promise<void> {
    try {
      // Mark as processing
      await this.queueRepository.update(queueItem.id, {
        status: QueueStatus.PROCESSING,
        started_at: new Date(),
        attempt_count: queueItem.attempt_count + 1,
      });

      // Get the full notification
      const notification = await this.notificationRepository.findOne({
        where: { id: queueItem.notification_id },
      });

      if (!notification) {
        await this.markQueueItemFailed(queueItem, 'Notification not found');
        return;
      }

      // Process based on channel
      switch (queueItem.channel) {
        case NotificationChannel.EMAIL:
          await this.processEmailNotification(queueItem, notification);
          break;
        case NotificationChannel.IN_APP:
          await this.processInAppNotification(queueItem, notification);
          break;
        case NotificationChannel.SMS:
          await this.processSMSNotification(queueItem, notification);
          break;
        case NotificationChannel.PUSH:
          await this.processPushNotification(queueItem, notification);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${queueItem.channel}`);
      }

      // Mark as completed
      await this.queueRepository.update(queueItem.id, {
        status: QueueStatus.COMPLETED,
        completed_at: new Date(),
      });

      // Update notification status
      await this.updateNotificationStatus(notification.id, NotificationStatus.SENT);

      this.logger.info('Notification processed successfully', {
        notificationId: notification.id,
        channel: queueItem.channel,
        attemptCount: queueItem.attempt_count + 1
      });
    } catch (error) {
      await this.handleProcessingError(queueItem, error);
    }
  }

  /**
   * Process email notification
   */
  private async processEmailNotification(
    queueItem: NotificationQueue,
    notification: Notification
  ): Promise<void> {
    // Use the enhanced email notification service
    await this.emailNotificationService.sendOfflineNotification(notification);
  }

  /**
   * Process in-app notification
   */
  private async processInAppNotification(
    queueItem: NotificationQueue,
    notification: Notification
  ): Promise<void> {
    if (!this.socketIO) {
      throw new Error('Socket.IO not configured for in-app notifications');
    }

    // Send real-time notification via WebSocket
    this.socketIO.to(`user:${notification.recipient_id}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionUrl: notification.action_url,
      actionText: notification.action_text,
      createdAt: notification.created_at,
      metadata: notification.metadata,
    });

    this.logger.debug('In-app notification sent', {
      notificationId: notification.id,
      recipientId: notification.recipient_id
    });
  }

  /**
   * Process SMS notification (placeholder)
   */
  private async processSMSNotification(
    queueItem: NotificationQueue,
    notification: Notification
  ): Promise<void> {
    // TODO: Implement SMS service (Twilio, AWS SNS, etc.)
    this.logger.warn('SMS notifications not implemented yet', {
      notificationId: notification.id
    });
    throw new Error('SMS notifications not implemented');
  }

  /**
   * Process push notification
   */
  private async processPushNotification(
    queueItem: NotificationQueue,
    notification: Notification
  ): Promise<void> {
    try {
      // Create push notification payload
      const payload = {
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: `${notification.type}-${notification.id}`,
        data: {
          notificationId: notification.id,
          type: notification.type,
          actionUrl: notification.action_url,
          timestamp: Date.now(),
          ...notification.metadata
        },
        actions: notification.action_url ? [
          { action: 'view', title: notification.action_text || 'View' },
          { action: 'dismiss', title: 'Dismiss' }
        ] : [
          { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: notification.priority === 'high'
      };

      // Send push notification
      const result = await this.pushNotificationService.sendNotificationToUser(
        notification.recipient_id,
        payload
      );

      this.logger.info('Push notification sent', {
        notificationId: notification.id,
        recipientId: notification.recipient_id,
        sent: result.sent,
        failed: result.failed
      });

      // If no push subscriptions were found, don't consider it a failure
      if (result.sent === 0 && result.failed === 0) {
        this.logger.debug('No active push subscriptions found for user', {
          recipientId: notification.recipient_id
        });
      }
    } catch (error) {
      this.logger.error('Failed to send push notification', {
        notificationId: notification.id,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Handle processing errors and retry logic
   */
  private async handleProcessingError(
    queueItem: NotificationQueue,
    error: any
  ): Promise<void> {
    const attemptCount = queueItem.attempt_count + 1;
    const maxRetries = queueItem.max_attempts || this.config.maxRetries;

    this.logger.error('Notification processing failed', {
      queueItemId: queueItem.id,
      notificationId: queueItem.notification_id,
      channel: queueItem.channel,
      attemptCount,
      maxRetries,
      error: error.message
    });

    if (attemptCount >= maxRetries) {
      await this.markQueueItemFailed(queueItem, error.message);
      await this.updateNotificationStatus(queueItem.notification_id, NotificationStatus.FAILED);
    } else {
      // Schedule retry
      const nextAttempt = new Date();
      nextAttempt.setMilliseconds(
        nextAttempt.getMilliseconds() + (this.config.retryDelay * attemptCount)
      );

      await this.queueRepository.update(queueItem.id, {
        status: QueueStatus.FAILED,
        next_attempt_at: nextAttempt,
        error_message: error.message,
      });
    }
  }

  /**
   * Mark queue item as permanently failed
   */
  private async markQueueItemFailed(queueItem: NotificationQueue, errorMessage: string): Promise<void> {
    await this.queueRepository.update(queueItem.id, {
      status: QueueStatus.FAILED,
      completed_at: new Date(),
      error_message: errorMessage,
    });
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === NotificationStatus.SENT) {
      updateData.sent_at = new Date();
    }

    await this.notificationRepository.update(notificationId, updateData);
  }

  /**
   * Get recipient email address (mock implementation)
   */
  private async getRecipientEmail(userId: string): Promise<string> {
    // TODO: Integrate with user service to get actual email
    // For now, return a mock email
    return `user-${userId}@example.com`;
  }

  /**
   * Clean up old queue items
   */
  async cleanupOldQueueItems(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.queueRepository.delete({
        status: In([QueueStatus.COMPLETED, QueueStatus.FAILED]),
        completed_at: LessThanOrEqual(cutoffDate),
      });

      this.logger.info('Old queue items cleaned up', {
        deleted: result.affected,
        daysToKeep
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old queue items', error);
      throw error;
    }
  }
}