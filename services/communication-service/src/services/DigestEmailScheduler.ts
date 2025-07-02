import { DataSource } from 'typeorm';
import { EmailService } from './EmailService';
import { EmailNotificationService } from './EmailNotificationService';
import { Logger } from '@hockey-hub/shared-lib';
import * as cron from 'node-cron';

export interface DigestSchedulerConfig {
  dailySchedule: string;  // Cron format, e.g., '0 8 * * *' for 8 AM daily
  weeklySchedule: string; // Cron format, e.g., '0 9 * * 1' for 9 AM Monday
  enabled: boolean;
}

export class DigestEmailScheduler {
  private emailNotificationService: EmailNotificationService;
  private logger: Logger;
  private config: DigestSchedulerConfig;
  private dailyTask?: cron.ScheduledTask;
  private weeklyTask?: cron.ScheduledTask;

  constructor(
    dataSource: DataSource,
    emailService: EmailService,
    config?: Partial<DigestSchedulerConfig>
  ) {
    this.logger = new Logger('DigestEmailScheduler');
    
    this.config = {
      dailySchedule: process.env.DIGEST_DAILY_SCHEDULE || '0 8 * * *',
      weeklySchedule: process.env.DIGEST_WEEKLY_SCHEDULE || '0 9 * * 1',
      enabled: process.env.DIGEST_EMAILS_ENABLED === 'true',
      ...config
    };

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
   * Start the digest email scheduler
   */
  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Digest email scheduler is disabled');
      return;
    }

    // Schedule daily digest
    this.dailyTask = cron.schedule(this.config.dailySchedule, async () => {
      this.logger.info('Starting daily digest processing');
      try {
        await this.emailNotificationService.processPendingDigests('daily');
      } catch (error) {
        this.logger.error('Failed to process daily digests', error);
      }
    });

    // Schedule weekly digest
    this.weeklyTask = cron.schedule(this.config.weeklySchedule, async () => {
      this.logger.info('Starting weekly digest processing');
      try {
        await this.emailNotificationService.processPendingDigests('weekly');
      } catch (error) {
        this.logger.error('Failed to process weekly digests', error);
      }
    });

    this.logger.info('Digest email scheduler started', {
      dailySchedule: this.config.dailySchedule,
      weeklySchedule: this.config.weeklySchedule
    });
  }

  /**
   * Stop the digest email scheduler
   */
  stop(): void {
    if (this.dailyTask) {
      this.dailyTask.stop();
      this.dailyTask = undefined;
    }

    if (this.weeklyTask) {
      this.weeklyTask.stop();
      this.weeklyTask = undefined;
    }

    this.logger.info('Digest email scheduler stopped');
  }

  /**
   * Manually trigger digest processing
   */
  async triggerDigest(period: 'daily' | 'weekly'): Promise<void> {
    this.logger.info(`Manually triggering ${period} digest`);
    await this.emailNotificationService.processPendingDigests(period);
  }
}