// @ts-nocheck - Email queue processor with Bull patterns
import Bull from 'bull';
import { Logger } from '@hockey-hub/shared-lib';
import { SendGridEmailService, SendEmailOptionsWithTracking } from './SendGridEmailService';
import { getRepository } from 'typeorm';
import { NotificationQueue, QueueStatus, Notification, NotificationChannel } from '../entities';

export interface EmailJobData {
  queueId: string;
  notificationId: string;
  processingData: {
    recipient_email: string;
    sender_email: string;
    subject: string;
    body: string;
    html_body?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      contentType: string;
    }>;
  };
  metadata?: Record<string, any>;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency?: number;
  maxAttempts?: number;
}

export class EmailQueueProcessor {
  private queue: Bull.Queue<EmailJobData>;
  private emailService: SendGridEmailService;
  private logger: Logger;

  constructor(emailService: SendGridEmailService, config: QueueConfig) {
    this.emailService = emailService;
    this.logger = new Logger('EmailQueueProcessor');

    // Initialize Bull queue
    this.queue = new Bull('email-processing', {
      redis: config.redis,
      defaultJobOptions: {
        attempts: config.maxAttempts || 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    // Start processing
    this.setupProcessor(config.concurrency || 5);
    this.setupEventHandlers();
  }

  /**
   * Setup job processor
   */
  private setupProcessor(concurrency: number): void {
    this.queue.process(concurrency, async (job) => {
      const { queueId, notificationId, processingData } = job.data;

      try {
        // Update queue status
        await this.updateQueueStatus(queueId, QueueStatus.PROCESSING);

        // Convert processing data to email options
        const emailOptions: SendEmailOptionsWithTracking = {
          to: processingData.recipient_email,
          subject: processingData.subject,
          text: processingData.body,
          html: processingData.html_body,
          attachments: processingData.attachments?.map(att => ({
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            contentType: att.contentType
          }))
        };

        // Send email via SendGrid
        const trackingData = await this.emailService.sendEmail(emailOptions);

        // Update queue status to completed
        await this.updateQueueStatus(queueId, QueueStatus.COMPLETED, {
          messageId: trackingData.messageId,
          sentAt: trackingData.sentAt.toISOString()
        });

        // Update notification status
        await this.updateNotificationStatus(notificationId, true);

        this.logger.info('Email sent successfully', {
          queueId,
          notificationId,
          messageId: trackingData.messageId
        });

        return trackingData;
      } catch (error) {
        this.logger.error('Failed to process email', {
          queueId,
          notificationId,
          error: error.message
        });

        // Update queue status to failed
        await this.updateQueueStatus(queueId, QueueStatus.FAILED, {
          error: error.message,
          attemptCount: job.attemptsMade
        });

        throw error;
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', (job, result) => {
      this.logger.info('Email job completed', {
        jobId: job.id,
        queueId: job.data.queueId
      });
    });

    this.queue.on('failed', (job, err) => {
      this.logger.error('Email job failed', {
        jobId: job.id,
        queueId: job.data.queueId,
        attempts: job.attemptsMade,
        error: err.message
      });
    });

    this.queue.on('stalled', (job) => {
      this.logger.warn('Email job stalled', {
        jobId: job.id,
        queueId: job.data.queueId
      });
    });
  }

  /**
   * Add notification to email queue
   */
  async queueEmailNotification(
    notification: Notification,
    processingData: any
  ): Promise<string> {
    try {
      const queueRepository = getRepository(NotificationQueue);

      // Create queue entry
      const queueEntry = queueRepository.create({
        notification_id: notification.id,
        channel: NotificationChannel.EMAIL,
        priority: notification.priority,
        status: QueueStatus.PENDING,
        scheduled_for: new Date(),
        processing_data: {
          email: processingData
        }
      });

      await queueRepository.save(queueEntry);

      // Add to Bull queue
      const job = await this.queue.add({
        queueId: queueEntry.id,
        notificationId: notification.id,
        processingData: processingData
      }, {
        priority: this.getPriorityValue(notification.priority),
        delay: 0
      });

      this.logger.info('Email notification queued', {
        queueId: queueEntry.id,
        notificationId: notification.id,
        jobId: job.id
      });

      return queueEntry.id;
    } catch (error) {
      this.logger.error('Failed to queue email notification', error);
      throw error;
    }
  }

  /**
   * Process pending email notifications
   */
  async processPendingEmails(): Promise<void> {
    try {
      const queueRepository = getRepository(NotificationQueue);
      
      // Find pending email notifications
      const pendingQueues = await queueRepository.find({
        where: {
          channel: NotificationChannel.EMAIL,
          status: QueueStatus.PENDING,
          scheduled_for: new Date()
        },
        take: 100
      });

      for (const queue of pendingQueues) {
        if (queue.processing_data?.email) {
          await this.queue.add({
            queueId: queue.id,
            notificationId: queue.notification_id,
            processingData: queue.processing_data.email
          });
        }
      }

      this.logger.info('Processed pending emails', {
        count: pendingQueues.length
      });
    } catch (error) {
      this.logger.error('Failed to process pending emails', error);
    }
  }

  /**
   * Update queue status
   */
  private async updateQueueStatus(
    queueId: string,
    status: QueueStatus,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const queueRepository = getRepository(NotificationQueue);
      const queue = await queueRepository.findOne({ where: { id: queueId } });

      if (queue) {
        queue.status = status;

        switch (status) {
          case QueueStatus.PROCESSING:
            queue.started_at = new Date();
            break;
          case QueueStatus.COMPLETED:
            queue.completed_at = new Date();
            break;
          case QueueStatus.FAILED:
            queue.error_message = metadata?.error;
            queue.attempt_count = metadata?.attemptCount || queue.attempt_count + 1;
            queue.next_attempt_at = new Date(Date.now() + 60000 * Math.pow(2, queue.attempt_count));
            break;
        }

        if (metadata) {
          queue.processing_data = {
            ...queue.processing_data,
            metadata
          };
        }

        await queueRepository.save(queue);
      }
    } catch (error) {
      this.logger.error('Failed to update queue status', {
        queueId,
        status,
        error
      });
    }
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    delivered: boolean
  ): Promise<void> {
    try {
      const notificationRepository = getRepository(Notification);
      const notification = await notificationRepository.findOne({ 
        where: { id: notificationId } 
      });

      if (notification) {
        notification.is_delivered = delivered;
        notification.delivered_at = delivered ? new Date() : undefined;
        await notificationRepository.save(notification);
      }
    } catch (error) {
      this.logger.error('Failed to update notification status', {
        notificationId,
        error
      });
    }
  }

  /**
   * Convert priority to numeric value
   */
  private getPriorityValue(priority: any): number {
    switch (priority) {
      case 'urgent': return 1;
      case 'high': return 2;
      case 'normal': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount()
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Clean old completed jobs
   */
  async cleanOldJobs(daysToKeep: number = 7): Promise<void> {
    await this.queue.clean(daysToKeep * 24 * 60 * 60 * 1000, 'completed');
    await this.queue.clean(daysToKeep * 24 * 60 * 60 * 1000, 'failed');
    
    this.logger.info('Cleaned old jobs', { daysToKeep });
  }

  /**
   * Close queue
   */
  async close(): Promise<void> {
    await this.queue.close();
    this.logger.info('Email queue processor closed');
  }
}