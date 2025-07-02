import Bull from 'bull';
import { Logger } from '@hockey-hub/shared-lib';
import { SendGridEmailService, SendEmailOptionsWithTracking, EmailTrackingData } from './SendGridEmailService';
import { getRepository } from 'typeorm';
import { NotificationQueue, QueueStatus, Notification, NotificationChannel, NotificationPriority } from '../entities';

export interface EmailQueueJob {
  queueId: string;
  notificationId: string;
  email: SendEmailOptionsWithTracking;
  retryCount?: number;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface QueueOptions {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions?: Bull.JobOptions;
  concurrency?: number;
}

export class EmailQueueService {
  private queue: Bull.Queue<EmailQueueJob>;
  private emailService: SendGridEmailService;
  private logger: Logger;

  constructor(
    emailService: SendGridEmailService,
    options: QueueOptions
  ) {
    this.emailService = emailService;
    this.logger = new Logger('EmailQueueService');

    // Initialize Bull queue
    this.queue = new Bull('email-queue', {
      redis: options.redis,
      defaultJobOptions: options.defaultJobOptions || {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    // Process jobs
    this.setupJobProcessors(options.concurrency || 5);
    this.setupEventHandlers();
  }

  /**
   * Setup job processors
   */
  private setupJobProcessors(concurrency: number): void {
    this.queue.process(concurrency, async (job) => {
      const { email, id, userId, organizationId } = job.data;

      try {
        // Update queue status
        await this.updateQueueStatus(id, QueueStatus.PROCESSING);

        // Send email
        const trackingData = await this.emailService.sendEmail(email);

        // Update queue status
        await this.updateQueueStatus(id, QueueStatus.COMPLETED, {
          messageId: trackingData.messageId,
          sentAt: trackingData.sentAt
        });

        this.logger.info('Email job completed', {
          jobId: job.id,
          queueId: id,
          messageId: trackingData.messageId
        });

        return trackingData;
      } catch (error) {
        this.logger.error('Email job failed', {
          jobId: job.id,
          queueId: id,
          error
        });

        // Update queue status
        await this.updateQueueStatus(id, QueueStatus.FAILED, {
          error: error.message,
          failedAt: new Date()
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
      this.logger.info('Job completed', {
        jobId: job.id,
        messageId: result.messageId
      });
    });

    this.queue.on('failed', (job, err) => {
      this.logger.error('Job failed', {
        jobId: job.id,
        error: err.message,
        attemptsMade: job.attemptsMade
      });
    });

    this.queue.on('stalled', (job) => {
      this.logger.warn('Job stalled', { jobId: job.id });
    });

    this.queue.on('error', (error) => {
      this.logger.error('Queue error', error);
    });
  }

  /**
   * Add email to queue
   */
  async queueEmail(
    email: SendEmailOptionsWithTracking,
    options?: {
      priority?: number;
      delay?: number;
      userId?: string;
      organizationId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    try {
      // Create queue record
      const queueRepository = getRepository(NotificationQueue);
      const queueRecord = queueRepository.create({
        channel: 'email',
        recipient: Array.isArray(email.to) ? email.to.join(', ') : email.to,
        subject: email.subject,
        priority: email.priority || 'normal',
        status: QueueStatus.PENDING,
        metadata: {
          ...options?.metadata,
          categories: email.categories,
          customArgs: email.customArgs
        },
        userId: options?.userId,
        organizationId: options?.organizationId,
        scheduledAt: email.sendAt || new Date()
      });

      await queueRepository.save(queueRecord);

      // Add to Bull queue
      const job = await this.queue.add({
        id: queueRecord.id,
        email,
        userId: options?.userId,
        organizationId: options?.organizationId,
        metadata: options?.metadata
      }, {
        priority: options?.priority,
        delay: options?.delay
      });

      this.logger.info('Email queued', {
        queueId: queueRecord.id,
        jobId: job.id,
        recipient: queueRecord.recipient
      });

      return queueRecord.id;
    } catch (error) {
      this.logger.error('Failed to queue email', error);
      throw error;
    }
  }

  /**
   * Queue bulk emails
   */
  async queueBulkEmails(
    emails: Array<{
      email: SendEmailOptionsWithTracking;
      userId?: string;
      metadata?: Record<string, any>;
    }>,
    options?: {
      batchSize?: number;
      priority?: number;
      organizationId?: string;
    }
  ): Promise<string[]> {
    const queueIds: string[] = [];
    const batchSize = options?.batchSize || 100;

    try {
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        const promises = batch.map(({ email, userId, metadata }) =>
          this.queueEmail(email, {
            priority: options?.priority,
            userId,
            organizationId: options?.organizationId,
            metadata
          })
        );

        const ids = await Promise.all(promises);
        queueIds.push(...ids);

        // Add small delay between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.logger.info('Bulk emails queued', {
        totalEmails: emails.length,
        queueIds: queueIds.length
      });

      return queueIds;
    } catch (error) {
      this.logger.error('Failed to queue bulk emails', error);
      throw error;
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
      const queueRecord = await queueRepository.findOne({ where: { id: queueId } });

      if (queueRecord) {
        queueRecord.status = status;
        
        if (metadata) {
          queueRecord.metadata = {
            ...queueRecord.metadata,
            ...metadata
          };
        }

        if (status === QueueStatus.PROCESSING) {
          queueRecord.processedAt = new Date();
        } else if (status === QueueStatus.COMPLETED) {
          queueRecord.sentAt = new Date();
        } else if (status === QueueStatus.FAILED) {
          queueRecord.failedAt = new Date();
        }

        await queueRepository.save(queueRecord);
      }
    } catch (error) {
      this.logger.error('Failed to update queue status', { queueId, status, error });
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
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
   * Get job status
   */
  async getJobStatus(queueId: string): Promise<{
    status: string;
    progress: number;
    data: any;
  } | null> {
    try {
      const queueRepository = getRepository(NotificationQueue);
      const queueRecord = await queueRepository.findOne({ where: { id: queueId } });

      if (!queueRecord) {
        return null;
      }

      return {
        status: queueRecord.status,
        progress: queueRecord.status === QueueStatus.COMPLETED ? 100 : 0,
        data: queueRecord.metadata
      };
    } catch (error) {
      this.logger.error('Failed to get job status', { queueId, error });
      return null;
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(queueId: string): Promise<boolean> {
    try {
      const queueRepository = getRepository(NotificationQueue);
      const queueRecord = await queueRepository.findOne({ where: { id: queueId } });

      if (!queueRecord || queueRecord.status !== QueueStatus.PENDING) {
        return false;
      }

      // Find and remove job from Bull queue
      const jobs = await this.queue.getJobs(['waiting', 'delayed']);
      const job = jobs.find(j => j.data.id === queueId);

      if (job) {
        await job.remove();
      }

      // Update queue status
      queueRecord.status = QueueStatus.CANCELLED;
      await queueRepository.save(queueRecord);

      this.logger.info('Job cancelled', { queueId });
      return true;
    } catch (error) {
      this.logger.error('Failed to cancel job', { queueId, error });
      return false;
    }
  }

  /**
   * Retry failed job
   */
  async retryFailedJob(queueId: string): Promise<boolean> {
    try {
      const queueRepository = getRepository(NotificationQueue);
      const queueRecord = await queueRepository.findOne({ where: { id: queueId } });

      if (!queueRecord || queueRecord.status !== QueueStatus.FAILED) {
        return false;
      }

      // Find failed job
      const jobs = await this.queue.getJobs(['failed']);
      const job = jobs.find(j => j.data.id === queueId);

      if (job) {
        await job.retry();
        
        // Update queue status
        queueRecord.status = QueueStatus.PENDING;
        queueRecord.retryCount = (queueRecord.retryCount || 0) + 1;
        await queueRepository.save(queueRecord);

        this.logger.info('Job retry scheduled', { queueId });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to retry job', { queueId, error });
      return false;
    }
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Clean from Bull queue
      await this.queue.clean(daysToKeep * 24 * 60 * 60 * 1000);

      // Clean from database
      const queueRepository = getRepository(NotificationQueue);
      const result = await queueRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :cutoffDate', { cutoffDate })
        .andWhere('status IN (:...statuses)', {
          statuses: [QueueStatus.COMPLETED, QueueStatus.CANCELLED]
        })
        .execute();

      this.logger.info('Old jobs cleaned', {
        deletedCount: result.affected,
        daysToKeep
      });

      return result.affected || 0;
    } catch (error) {
      this.logger.error('Failed to clean old jobs', error);
      throw error;
    }
  }

  /**
   * Close queue
   */
  async close(): Promise<void> {
    await this.queue.close();
    this.logger.info('Email queue closed');
  }
}