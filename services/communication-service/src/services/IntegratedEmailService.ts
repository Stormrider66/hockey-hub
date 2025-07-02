import { Logger } from '@hockey-hub/shared-lib';
import { SendGridEmailService, SendGridConfig } from './SendGridEmailService';
import { EmailQueueProcessor, QueueConfig } from './EmailQueueProcessor';
import { getRepository } from 'typeorm';
import { 
  Notification, 
  NotificationTemplate, 
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '../entities';
import * as path from 'path';

export interface EmailServiceConfig {
  sendGrid: SendGridConfig;
  queue: QueueConfig;
  templatesPath?: string;
  baseUrl: string;
  logoUrl: string;
}

export interface EmailOptions {
  to: string | string[];
  type: NotificationType;
  priority?: NotificationPriority;
  data: Record<string, any>;
  userId?: string;
  organizationId?: string;
  teamId?: string;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export class IntegratedEmailService {
  private sendGridService: SendGridEmailService;
  private queueProcessor: EmailQueueProcessor;
  private logger: Logger;
  private config: EmailServiceConfig;
  private templateMap: Map<NotificationType, string> = new Map();

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.logger = new Logger('IntegratedEmailService');

    // Initialize SendGrid service
    this.sendGridService = new SendGridEmailService(config.sendGrid);

    // Initialize queue processor
    this.queueProcessor = new EmailQueueProcessor(this.sendGridService, config.queue);

    // Initialize template mappings
    this.initializeTemplateMap();
  }

  /**
   * Initialize template mappings
   */
  private initializeTemplateMap(): void {
    // Map notification types to template files
    this.templateMap.set(NotificationType.ANNOUNCEMENT, 'notification.hbs');
    this.templateMap.set(NotificationType.EVENT_REMINDER, 'notification.hbs');
    this.templateMap.set(NotificationType.EVENT_CREATED, 'notification.hbs');
    this.templateMap.set(NotificationType.EVENT_UPDATED, 'notification.hbs');
    this.templateMap.set(NotificationType.EVENT_CANCELLED, 'notification.hbs');
    this.templateMap.set(NotificationType.TRAINING_ASSIGNED, 'notification.hbs');
    this.templateMap.set(NotificationType.TRAINING_COMPLETED, 'notification.hbs');
    this.templateMap.set(NotificationType.MEDICAL_APPOINTMENT, 'notification.hbs');
    this.templateMap.set(NotificationType.EQUIPMENT_DUE, 'notification.hbs');
    this.templateMap.set(NotificationType.PAYMENT_DUE, 'notification.hbs');
    // Add more mappings as needed
  }

  /**
   * Send email notification
   */
  async sendEmail(options: EmailOptions): Promise<string> {
    try {
      // Create notification record
      const notification = await this.createNotification(options);

      // Get or create template
      const template = await this.getTemplate(options.type);

      // Prepare email data
      const emailData = this.prepareEmailData(options, template);

      // Queue the email
      const queueId = await this.queueProcessor.queueEmailNotification(
        notification,
        emailData
      );

      this.logger.info('Email queued successfully', {
        notificationId: notification.id,
        queueId,
        type: options.type
      });

      return queueId;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      organizationName: string;
    },
    temporaryPassword?: string
  ): Promise<string> {
    const emailOptions: EmailOptions = {
      to: user.email,
      type: NotificationType.ANNOUNCEMENT,
      priority: NotificationPriority.HIGH,
      userId: user.id,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationName: user.organizationName,
        temporaryPassword,
        dashboardUrl: `${this.config.baseUrl}/dashboard`,
        helpUrl: `${this.config.baseUrl}/help`,
        changePasswordUrl: `${this.config.baseUrl}/account/security`,
        appStoreUrl: 'https://apps.apple.com/app/hockey-hub',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hockeyhub'
      }
    };

    // Create notification with welcome template
    const notification = await this.createNotification({
      ...emailOptions,
      data: {
        ...emailOptions.data,
        templatePath: 'welcome.hbs',
        subject: `Welcome to Hockey Hub, ${user.firstName}!`
      }
    });

    // Prepare welcome email data
    const emailData = {
      recipient_email: user.email,
      sender_email: this.config.sendGrid.from.email,
      subject: `Welcome to Hockey Hub, ${user.firstName}!`,
      body: 'Welcome to Hockey Hub!', // Plain text fallback
      html_body: 'welcome.hbs', // Template indicator
      templateData: {
        ...emailOptions.data,
        baseUrl: this.config.baseUrl,
        logoUrl: this.config.logoUrl,
        currentYear: new Date().getFullYear()
      }
    };

    return await this.queueProcessor.queueEmailNotification(notification, emailData);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    user: {
      id: string;
      email: string;
      firstName: string;
    },
    resetToken: string,
    requestInfo: {
      ipAddress: string;
      userAgent: string;
      location?: string;
    }
  ): Promise<string> {
    const resetUrl = `${this.config.baseUrl}/reset-password?token=${resetToken}`;
    const expirationHours = 2;

    const emailOptions: EmailOptions = {
      to: user.email,
      type: NotificationType.SYSTEM_ALERT,
      priority: NotificationPriority.URGENT,
      userId: user.id,
      data: {
        firstName: user.firstName,
        resetUrl,
        expirationHours,
        requestTime: new Date().toLocaleString(),
        ipAddress: requestInfo.ipAddress,
        location: requestInfo.location || 'Unknown',
        deviceInfo: this.parseUserAgent(requestInfo.userAgent),
        helpUrl: `${this.config.baseUrl}/help`
      }
    };

    const notification = await this.createNotification({
      ...emailOptions,
      data: {
        ...emailOptions.data,
        templatePath: 'password-reset.hbs',
        subject: 'Password Reset Request - Hockey Hub'
      }
    });

    const emailData = {
      recipient_email: user.email,
      sender_email: this.config.sendGrid.from.email,
      subject: 'Password Reset Request - Hockey Hub',
      body: `Click here to reset your password: ${resetUrl}`,
      html_body: 'password-reset.hbs',
      templateData: {
        ...emailOptions.data,
        baseUrl: this.config.baseUrl,
        logoUrl: this.config.logoUrl,
        currentYear: new Date().getFullYear()
      }
    };

    return await this.queueProcessor.queueEmailNotification(notification, emailData);
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(
    user: {
      id: string;
      email: string;
      firstName: string;
    },
    summaryData: {
      weekStart: string;
      weekEnd: string;
      highlights?: string[];
      statistics?: Array<{
        label: string;
        value: string | number;
        change?: string;
        positive?: boolean;
      }>;
      upcomingEvents?: Array<{
        title: string;
        date: string;
        time: string;
        location: string;
        notes?: string;
        rsvpRequired?: boolean;
        rsvpUrl?: string;
      }>;
      activitySummary?: Array<{
        activity: string;
        description?: string;
        count: number;
      }>;
      achievements?: Array<{
        title: string;
        recipient: string;
        description?: string;
      }>;
      reminders?: string[];
    }
  ): Promise<string> {
    const emailOptions: EmailOptions = {
      to: user.email,
      type: NotificationType.ANNOUNCEMENT,
      priority: NotificationPriority.LOW,
      userId: user.id,
      data: {
        firstName: user.firstName,
        ...summaryData,
        dashboardUrl: `${this.config.baseUrl}/dashboard`,
        fullScheduleUrl: `${this.config.baseUrl}/schedule`,
        notificationPreferencesUrl: `${this.config.baseUrl}/account/notifications`,
        mobileAppUrl: `${this.config.baseUrl}/mobile`
      }
    };

    const notification = await this.createNotification({
      ...emailOptions,
      data: {
        ...emailOptions.data,
        templatePath: 'weekly-summary.hbs',
        subject: `Your Weekly Hockey Hub Summary - ${summaryData.weekStart}`
      }
    });

    const emailData = {
      recipient_email: user.email,
      sender_email: this.config.sendGrid.from.email,
      subject: `Your Weekly Hockey Hub Summary - ${summaryData.weekStart}`,
      body: 'Your weekly summary is ready!',
      html_body: 'weekly-summary.hbs',
      templateData: {
        ...emailOptions.data,
        baseUrl: this.config.baseUrl,
        logoUrl: this.config.logoUrl,
        currentYear: new Date().getFullYear(),
        unsubscribeUrl: `${this.config.baseUrl}/unsubscribe?type=weekly-summary&user=${user.id}`,
        preferencesUrl: `${this.config.baseUrl}/account/notifications`
      }
    };

    return await this.queueProcessor.queueEmailNotification(notification, emailData);
  }

  /**
   * Create notification record
   */
  private async createNotification(options: EmailOptions): Promise<Notification> {
    const notificationRepository = getRepository(Notification);

    const notification = notificationRepository.create({
      type: options.type,
      channel: NotificationChannel.EMAIL,
      priority: options.priority || NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
      title: options.data.subject || this.getDefaultTitle(options.type),
      message: options.data.message || '',
      data: options.data,
      user_id: options.userId,
      organization_id: options.organizationId,
      team_id: options.teamId,
      scheduled_for: options.scheduledFor || new Date(),
      metadata: options.metadata
    });

    return await notificationRepository.save(notification);
  }

  /**
   * Get or create template
   */
  private async getTemplate(type: NotificationType): Promise<NotificationTemplate | null> {
    const templateRepository = getRepository(NotificationTemplate);
    
    // Try to find existing template
    let template = await templateRepository.findOne({
      where: {
        type,
        channel: NotificationChannel.EMAIL,
        is_active: true
      }
    });

    if (!template) {
      // Use default template mapping
      const templateFile = this.templateMap.get(type) || 'notification.hbs';
      this.logger.debug('Using template file', { type, templateFile });
    }

    return template;
  }

  /**
   * Prepare email data
   */
  private prepareEmailData(
    options: EmailOptions,
    template: NotificationTemplate | null
  ): any {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    return {
      recipient_email: recipients.join(', '),
      sender_email: this.config.sendGrid.from.email,
      subject: options.data.subject || template?.subject_template || this.getDefaultTitle(options.type),
      body: options.data.message || template?.body_template || '',
      html_body: options.data.templatePath || this.templateMap.get(options.type) || 'notification.hbs',
      templateData: {
        ...options.data,
        baseUrl: this.config.baseUrl,
        logoUrl: this.config.logoUrl,
        currentYear: new Date().getFullYear(),
        doNotReply: true
      }
    };
  }

  /**
   * Get default title for notification type
   */
  private getDefaultTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.EVENT_REMINDER]: 'Event Reminder',
      [NotificationType.EVENT_CREATED]: 'New Event Created',
      [NotificationType.EVENT_UPDATED]: 'Event Updated',
      [NotificationType.EVENT_CANCELLED]: 'Event Cancelled',
      [NotificationType.TRAINING_ASSIGNED]: 'Training Assigned',
      [NotificationType.TRAINING_COMPLETED]: 'Training Completed',
      [NotificationType.TRAINING_OVERDUE]: 'Training Overdue',
      [NotificationType.MEDICAL_APPOINTMENT]: 'Medical Appointment',
      [NotificationType.EQUIPMENT_DUE]: 'Equipment Due',
      [NotificationType.PAYMENT_DUE]: 'Payment Due',
      [NotificationType.ANNOUNCEMENT]: 'Announcement',
      [NotificationType.SYSTEM_ALERT]: 'System Alert',
      [NotificationType.TEAM_UPDATE]: 'Team Update',
      [NotificationType.RSVP_REQUEST]: 'RSVP Request',
      [NotificationType.SCHEDULE_CONFLICT]: 'Schedule Conflict',
      [NotificationType.INJURY_UPDATE]: 'Injury Update',
      [NotificationType.MEDICAL_CLEARANCE]: 'Medical Clearance',
      [NotificationType.EQUIPMENT_READY]: 'Equipment Ready',
      [NotificationType.MAINTENANCE_REQUIRED]: 'Maintenance Required'
    };

    return titles[type] || 'Notification';
  }

  /**
   * Parse user agent string
   */
  private parseUserAgent(userAgent: string): string {
    // Simple parsing - in production, use a proper user agent parser
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Browser';
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await this.queueProcessor.getStats();
  }

  /**
   * Process pending emails
   */
  async processPendingEmails() {
    return await this.queueProcessor.processPendingEmails();
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(daysToKeep: number = 7) {
    return await this.queueProcessor.cleanOldJobs(daysToKeep);
  }

  /**
   * Validate configuration
   */
  async validateConfiguration(): Promise<boolean> {
    return await this.sendGridService.validateConfiguration();
  }

  /**
   * Close services
   */
  async close() {
    await this.queueProcessor.close();
    this.logger.info('Integrated email service closed');
  }
}