import { Repository, DataSource, In, Between, IsNull, Not } from 'typeorm';
import { 
  Notification, 
  NotificationType, 
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  UserPresence,
  PresenceStatus
} from '../entities';
import { EmailService, SendEmailOptions } from './EmailService';
import { Logger } from '@hockey-hub/shared-lib';
import axios from 'axios';

export interface EmailNotificationConfig {
  userServiceUrl: string;
  offlineThresholdMinutes: number;
  digestBatchSize: number;
  digestScheduleHours: number[];
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface DigestEmailData {
  recipientId: string;
  notifications: Notification[];
  period: 'daily' | 'weekly';
}

export class EmailNotificationService {
  private notificationRepository: Repository<Notification>;
  private presenceRepository: Repository<UserPresence>;
  private emailService: EmailService;
  private config: EmailNotificationConfig;
  private logger: Logger;
  private userCache: Map<string, UserInfo> = new Map();

  constructor(
    dataSource: DataSource,
    emailService: EmailService,
    config: EmailNotificationConfig
  ) {
    this.notificationRepository = dataSource.getRepository(Notification);
    this.presenceRepository = dataSource.getRepository(UserPresence);
    this.emailService = emailService;
    this.config = config;
    this.logger = new Logger('EmailNotificationService');
  }

  /**
   * Check if user is offline and should receive email notifications
   */
  async isUserOffline(userId: string): Promise<boolean> {
    try {
      const presence = await this.presenceRepository.findOne({
        where: { user_id: userId }
      });

      if (!presence) {
        return true; // No presence record means user hasn't been online
      }

      if (presence.status === PresenceStatus.OFFLINE) {
        return true;
      }

      // Check if user has been away for threshold time
      const threshold = new Date();
      threshold.setMinutes(threshold.getMinutes() - this.config.offlineThresholdMinutes);
      
      return presence.last_seen_at < threshold;
    } catch (error) {
      this.logger.error('Failed to check user presence', error);
      return true; // Default to sending email on error
    }
  }

  /**
   * Get user information from user service
   */
  async getUserInfo(userId: string): Promise<UserInfo | null> {
    try {
      // Check cache first
      if (this.userCache.has(userId)) {
        return this.userCache.get(userId)!;
      }

      const response = await axios.get(`${this.config.userServiceUrl}/api/users/${userId}`, {
        headers: {
          'X-Service-Name': 'communication-service',
          'X-Service-Key': process.env.SERVICE_API_KEY || ''
        }
      });

      const userInfo = response.data as UserInfo;
      
      // Cache user info for 5 minutes
      this.userCache.set(userId, userInfo);
      setTimeout(() => this.userCache.delete(userId), 5 * 60 * 1000);

      return userInfo;
    } catch (error) {
      this.logger.error('Failed to get user info', { userId, error });
      return null;
    }
  }

  /**
   * Send email notification for offline user
   */
  async sendOfflineNotification(notification: Notification): Promise<void> {
    try {
      // Check if user is actually offline
      const isOffline = await this.isUserOffline(notification.recipient_id);
      if (!isOffline) {
        this.logger.debug('User is online, skipping email', {
          notificationId: notification.id,
          recipientId: notification.recipient_id
        });
        return;
      }

      // Get user info
      const userInfo = await this.getUserInfo(notification.recipient_id);
      if (!userInfo || !userInfo.email) {
        this.logger.warn('No email address found for user', {
          recipientId: notification.recipient_id
        });
        return;
      }

      // Get email template
      const emailContent = await this.getEmailContent(notification, userInfo);

      // Send email
      await this.emailService.sendEmail({
        to: userInfo.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        priority: notification.priority === NotificationPriority.URGENT ? 'high' : 'normal'
      });

      this.logger.info('Offline notification email sent', {
        notificationId: notification.id,
        recipientEmail: userInfo.email,
        type: notification.type
      });
    } catch (error) {
      this.logger.error('Failed to send offline notification email', error);
      throw error;
    }
  }

  /**
   * Generate email content based on notification type
   */
  private async getEmailContent(
    notification: Notification, 
    userInfo: UserInfo
  ): Promise<{ subject: string; html: string; text: string }> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const userName = `${userInfo.firstName} ${userInfo.lastName}`.trim();

    // Email templates for different notification types
    const templates: Record<NotificationType, { subject: string; html: string }> = {
      [NotificationType.MESSAGE_RECEIVED]: {
        subject: 'New message in Hockey Hub',
        html: this.generateMessageReceivedEmail(notification, userName, baseUrl)
      },
      [NotificationType.MENTION]: {
        subject: 'You were mentioned in Hockey Hub',
        html: this.generateMentionEmail(notification, userName, baseUrl)
      },
      [NotificationType.TRAINING_SCHEDULED]: {
        subject: 'New training session scheduled',
        html: this.generateTrainingScheduledEmail(notification, userName, baseUrl)
      },
      [NotificationType.TRAINING_UPDATED]: {
        subject: 'Training session updated',
        html: this.generateTrainingUpdatedEmail(notification, userName, baseUrl)
      },
      [NotificationType.TRAINING_CANCELLED]: {
        subject: 'Training session cancelled',
        html: this.generateTrainingCancelledEmail(notification, userName, baseUrl)
      },
      [NotificationType.MEDICAL_APPOINTMENT]: {
        subject: 'Medical appointment scheduled',
        html: this.generateMedicalAppointmentEmail(notification, userName, baseUrl)
      },
      [NotificationType.INJURY_UPDATE]: {
        subject: 'Injury status update',
        html: this.generateInjuryUpdateEmail(notification, userName, baseUrl)
      },
      [NotificationType.EQUIPMENT_FITTING]: {
        subject: 'Equipment fitting scheduled',
        html: this.generateEquipmentFittingEmail(notification, userName, baseUrl)
      },
      [NotificationType.PAYMENT_DUE]: {
        subject: 'Payment due reminder',
        html: this.generatePaymentDueEmail(notification, userName, baseUrl)
      },
      [NotificationType.PAYMENT_RECEIVED]: {
        subject: 'Payment received',
        html: this.generatePaymentReceivedEmail(notification, userName, baseUrl)
      },
      [NotificationType.TEAM_ANNOUNCEMENT]: {
        subject: 'Team announcement',
        html: this.generateTeamAnnouncementEmail(notification, userName, baseUrl)
      },
      [NotificationType.SCHEDULE_CHANGE]: {
        subject: 'Schedule change notification',
        html: this.generateScheduleChangeEmail(notification, userName, baseUrl)
      },
      [NotificationType.WELLNESS_REMINDER]: {
        subject: 'Complete your wellness check',
        html: this.generateWellnessReminderEmail(notification, userName, baseUrl)
      },
      [NotificationType.PERFORMANCE_REPORT]: {
        subject: 'New performance report available',
        html: this.generatePerformanceReportEmail(notification, userName, baseUrl)
      },
      [NotificationType.CALENDAR_REMINDER]: {
        subject: 'Upcoming event reminder',
        html: this.generateCalendarReminderEmail(notification, userName, baseUrl)
      },
      [NotificationType.SYSTEM_ALERT]: {
        subject: 'System notification',
        html: this.generateSystemAlertEmail(notification, userName, baseUrl)
      },
      [NotificationType.REACTION_ADDED]: {
        subject: 'Someone reacted to your message',
        html: this.generateReactionAddedEmail(notification, userName, baseUrl)
      },
      [NotificationType.TASK_ASSIGNED]: {
        subject: 'New task assigned to you',
        html: this.generateTaskAssignedEmail(notification, userName, baseUrl)
      },
      [NotificationType.DOCUMENT_SHARED]: {
        subject: 'Document shared with you',
        html: this.generateDocumentSharedEmail(notification, userName, baseUrl)
      },
      [NotificationType.FEEDBACK_RECEIVED]: {
        subject: 'New feedback received',
        html: this.generateFeedbackReceivedEmail(notification, userName, baseUrl)
      }
    };

    const template = templates[notification.type];
    const text = this.htmlToText(template.html);

    return {
      subject: template.subject,
      html: this.wrapInEmailLayout(template.html, userName),
      text
    };
  }

  /**
   * Email template generators
   */
  private generateMessageReceivedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/chat`;
    return `
      <h2>Hi ${userName},</h2>
      <p>${notification.message}</p>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Message
        </a>
      </p>
    `;
  }

  private generateMentionEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/chat`;
    return `
      <h2>Hi ${userName},</h2>
      <p>You were mentioned in a conversation:</p>
      <blockquote style="border-left: 4px solid #2563eb; padding-left: 15px; margin: 20px 0;">
        ${notification.message}
      </blockquote>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Conversation
        </a>
      </p>
    `;
  }

  private generateTrainingScheduledEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/calendar`;
    return `
      <h2>Hi ${userName},</h2>
      <p>A new training session has been scheduled:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Details
        </a>
      </p>
    `;
  }

  // ... Additional email template generators for other notification types ...

  /**
   * Wrap email content in standard layout
   */
  private wrapInEmailLayout(content: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hockey Hub Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">Hockey Hub</h1>
          </div>
          ${content}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            You're receiving this email because you have notifications enabled for Hockey Hub.
            <br>
            <a href="${process.env.FRONTEND_URL}/settings/notifications" style="color: #2563eb;">Manage your notification preferences</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<h[1-6].*?>(.*?)<\/h[1-6]>/gi, '$1\n\n')
      .replace(/<p.*?>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/gi, '$2 ($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Send digest email with multiple notifications
   */
  async sendDigestEmail(digestData: DigestEmailData): Promise<void> {
    try {
      const userInfo = await this.getUserInfo(digestData.recipientId);
      if (!userInfo || !userInfo.email) {
        this.logger.warn('No email address found for digest recipient', {
          recipientId: digestData.recipientId
        });
        return;
      }

      const subject = `Your ${digestData.period} Hockey Hub digest - ${digestData.notifications.length} notifications`;
      const html = this.generateDigestEmail(digestData.notifications, userInfo, digestData.period);
      const text = this.htmlToText(html);

      await this.emailService.sendEmail({
        to: userInfo.email,
        subject,
        html: this.wrapInEmailLayout(html, `${userInfo.firstName} ${userInfo.lastName}`),
        text
      });

      // Mark notifications as having digest sent
      await this.notificationRepository.update(
        {
          id: In(digestData.notifications.map(n => n.id))
        },
        {
          metadata: () => "metadata || '{}'::jsonb || '{\"digest_sent\": true}'::jsonb"
        }
      );

      this.logger.info('Digest email sent', {
        recipientEmail: userInfo.email,
        notificationCount: digestData.notifications.length,
        period: digestData.period
      });
    } catch (error) {
      this.logger.error('Failed to send digest email', error);
      throw error;
    }
  }

  /**
   * Generate digest email content
   */
  private generateDigestEmail(
    notifications: Notification[], 
    userInfo: UserInfo,
    period: 'daily' | 'weekly'
  ): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const userName = `${userInfo.firstName} ${userInfo.lastName}`.trim();

    // Group notifications by type
    const grouped = notifications.reduce((acc, notif) => {
      if (!acc[notif.type]) {
        acc[notif.type] = [];
      }
      acc[notif.type].push(notif);
      return acc;
    }, {} as Record<NotificationType, Notification[]>);

    let content = `
      <h2>Hi ${userName},</h2>
      <p>Here's your ${period} summary of notifications from Hockey Hub:</p>
    `;

    // Add sections for each notification type
    Object.entries(grouped).forEach(([type, notifs]) => {
      const typeTitle = this.getNotificationTypeTitle(type as NotificationType);
      content += `
        <div style="margin: 30px 0;">
          <h3 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${typeTitle} (${notifs.length})
          </h3>
      `;

      notifs.slice(0, 5).forEach(notif => {
        content += `
          <div style="margin: 15px 0; padding: 15px; background-color: #f9fafb; border-radius: 5px;">
            <p style="margin: 0;"><strong>${notif.title}</strong></p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${notif.message}</p>
            ${notif.action_url ? `<a href="${notif.action_url}" style="color: #2563eb; font-size: 14px;">View details →</a>` : ''}
          </div>
        `;
      });

      if (notifs.length > 5) {
        content += `<p style="color: #6b7280; font-size: 14px;">... and ${notifs.length - 5} more</p>`;
      }

      content += `</div>`;
    });

    content += `
      <div style="margin-top: 30px; text-align: center;">
        <a href="${baseUrl}/notifications" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          View All Notifications
        </a>
      </div>
    `;

    return content;
  }

  /**
   * Get friendly title for notification type
   */
  private getNotificationTypeTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.MESSAGE_RECEIVED]: 'Messages',
      [NotificationType.MENTION]: 'Mentions',
      [NotificationType.TRAINING_SCHEDULED]: 'Training Sessions',
      [NotificationType.TRAINING_UPDATED]: 'Training Updates',
      [NotificationType.TRAINING_CANCELLED]: 'Cancelled Sessions',
      [NotificationType.MEDICAL_APPOINTMENT]: 'Medical Appointments',
      [NotificationType.INJURY_UPDATE]: 'Injury Updates',
      [NotificationType.EQUIPMENT_FITTING]: 'Equipment Fittings',
      [NotificationType.PAYMENT_DUE]: 'Payment Reminders',
      [NotificationType.PAYMENT_RECEIVED]: 'Payment Confirmations',
      [NotificationType.TEAM_ANNOUNCEMENT]: 'Team Announcements',
      [NotificationType.SCHEDULE_CHANGE]: 'Schedule Changes',
      [NotificationType.WELLNESS_REMINDER]: 'Wellness Reminders',
      [NotificationType.PERFORMANCE_REPORT]: 'Performance Reports',
      [NotificationType.CALENDAR_REMINDER]: 'Calendar Reminders',
      [NotificationType.SYSTEM_ALERT]: 'System Alerts',
      [NotificationType.REACTION_ADDED]: 'Reactions',
      [NotificationType.TASK_ASSIGNED]: 'Tasks',
      [NotificationType.DOCUMENT_SHARED]: 'Shared Documents',
      [NotificationType.FEEDBACK_RECEIVED]: 'Feedback'
    };
    return titles[type] || 'Notifications';
  }

  /**
   * Generate remaining email templates
   */
  private generateTrainingUpdatedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/calendar`;
    return `
      <h2>Hi ${userName},</h2>
      <p>A training session has been updated:</p>
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p><strong>⚠️ ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Updated Details
        </a>
      </p>
    `;
  }

  private generateTrainingCancelledEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/calendar`;
    return `
      <h2>Hi ${userName},</h2>
      <p>A training session has been cancelled:</p>
      <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p><strong>❌ ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Calendar
        </a>
      </p>
    `;
  }

  private generateMedicalAppointmentEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/medical`;
    return `
      <h2>Hi ${userName},</h2>
      <p>You have a medical appointment scheduled:</p>
      <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p><strong>🏥 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Appointment Details
        </a>
      </p>
    `;
  }

  private generateInjuryUpdateEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/medical`;
    return `
      <h2>Hi ${userName},</h2>
      <p>There's an update regarding your injury status:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Medical Record
        </a>
      </p>
    `;
  }

  private generateEquipmentFittingEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/equipment`;
    return `
      <h2>Hi ${userName},</h2>
      <p>You have an equipment fitting scheduled:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>🏒 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Appointment
        </a>
      </p>
    `;
  }

  private generatePaymentDueEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/payments`;
    return `
      <h2>Hi ${userName},</h2>
      <p>You have a payment due:</p>
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p><strong>💳 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Make Payment
        </a>
      </p>
    `;
  }

  private generatePaymentReceivedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/payments`;
    return `
      <h2>Hi ${userName},</h2>
      <p>Your payment has been received:</p>
      <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p><strong>✅ ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Receipt
        </a>
      </p>
    `;
  }

  private generateTeamAnnouncementEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/team`;
    return `
      <h2>Hi ${userName},</h2>
      <p>Important team announcement:</p>
      <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p><strong>📢 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Full Announcement
        </a>
      </p>
    `;
  }

  private generateScheduleChangeEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/calendar`;
    return `
      <h2>Hi ${userName},</h2>
      <p>There has been a change to your schedule:</p>
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p><strong>📅 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Updated Schedule
        </a>
      </p>
    `;
  }

  private generateWellnessReminderEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/wellness`;
    return `
      <h2>Hi ${userName},</h2>
      <p>Please complete your wellness check:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>❤️ ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Complete Wellness Check
        </a>
      </p>
    `;
  }

  private generatePerformanceReportEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/performance`;
    return `
      <h2>Hi ${userName},</h2>
      <p>Your performance report is ready:</p>
      <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p><strong>📊 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Report
        </a>
      </p>
    `;
  }

  private generateCalendarReminderEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/calendar`;
    return `
      <h2>Hi ${userName},</h2>
      <p>Reminder about your upcoming event:</p>
      <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p><strong>⏰ ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Event Details
        </a>
      </p>
    `;
  }

  private generateSystemAlertEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || baseUrl;
    return `
      <h2>Hi ${userName},</h2>
      <p>System notification:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>ℹ️ ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      ${actionUrl ? `
        <p style="margin-top: 20px;">
          <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Learn More
          </a>
        </p>
      ` : ''}
    `;
  }

  private generateReactionAddedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/chat`;
    return `
      <h2>Hi ${userName},</h2>
      <p>Someone reacted to your message:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Message
        </a>
      </p>
    `;
  }

  private generateTaskAssignedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/tasks`;
    return `
      <h2>Hi ${userName},</h2>
      <p>You have been assigned a new task:</p>
      <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p><strong>📋 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Task
        </a>
      </p>
    `;
  }

  private generateDocumentSharedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/documents`;
    return `
      <h2>Hi ${userName},</h2>
      <p>A document has been shared with you:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>📄 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Document
        </a>
      </p>
    `;
  }

  private generateFeedbackReceivedEmail(notification: Notification, userName: string, baseUrl: string): string {
    const actionUrl = notification.action_url || `${baseUrl}/feedback`;
    return `
      <h2>Hi ${userName},</h2>
      <p>You've received new feedback:</p>
      <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p><strong>💬 ${notification.title}</strong></p>
        <p>${notification.message}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${actionUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Feedback
        </a>
      </p>
    `;
  }

  /**
   * Get pending digest notifications for users
   */
  async getPendingDigestNotifications(period: 'daily' | 'weekly'): Promise<DigestEmailData[]> {
    try {
      const cutoffDate = new Date();
      if (period === 'daily') {
        cutoffDate.setDate(cutoffDate.getDate() - 1);
      } else {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      }

      // Get unread notifications that haven't been included in a digest
      const notifications = await this.notificationRepository.find({
        where: {
          created_at: Between(cutoffDate, new Date()),
          read_at: IsNull(),
          channels: () => `channels @> '["${NotificationChannel.EMAIL}"]'::jsonb`,
          metadata: () => `(metadata->>'digest_sent') IS NULL OR (metadata->>'digest_sent')::boolean = false`
        },
        order: {
          recipient_id: 'ASC',
          created_at: 'DESC'
        }
      });

      // Group by recipient
      const grouped = notifications.reduce((acc, notif) => {
        if (!acc[notif.recipient_id]) {
          acc[notif.recipient_id] = [];
        }
        acc[notif.recipient_id].push(notif);
        return acc;
      }, {} as Record<string, Notification[]>);

      // Create digest data for each recipient
      return Object.entries(grouped)
        .filter(([_, notifs]) => notifs.length >= 3) // Only send digest if 3+ notifications
        .map(([recipientId, notifs]) => ({
          recipientId,
          notifications: notifs,
          period
        }));
    } catch (error) {
      this.logger.error('Failed to get pending digest notifications', error);
      throw error;
    }
  }

  /**
   * Process and send all pending digest emails
   */
  async processPendingDigests(period: 'daily' | 'weekly'): Promise<void> {
    try {
      const digests = await this.getPendingDigestNotifications(period);
      
      this.logger.info('Processing digest emails', {
        period,
        recipientCount: digests.length,
        totalNotifications: digests.reduce((sum, d) => sum + d.notifications.length, 0)
      });

      // Send digests in batches
      for (const digest of digests) {
        await this.sendDigestEmail(digest);
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.info('Digest processing complete', {
        period,
        sent: digests.length
      });
    } catch (error) {
      this.logger.error('Failed to process digest emails', error);
      throw error;
    }
  }
}