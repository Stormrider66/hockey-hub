import { BaseBotService, BotMessageOptions } from './BaseBotService';
import { BotType, BotPermission } from './BotUser';
import { MessageType } from '../entities';

export interface SystemNotification {
  type: SystemNotificationType;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  userIds?: string[];
  metadata?: Record<string, any>;
}

export enum SystemNotificationType {
  MAINTENANCE = 'maintenance',
  UPDATE = 'update',
  SECURITY_ALERT = 'security_alert',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  ACCOUNT_LOCKED = 'account_locked',
  SYSTEM_STATUS = 'system_status',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
}

export class SystemBot extends BaseBotService {
  constructor() {
    super(BotType.SYSTEM);
  }

  public async initialize(): Promise<void> {
    this.logger.info('System Bot initialized');
  }

  /**
   * Send welcome message to new user
   */
  public async sendWelcomeMessage(userId: string, userName: string): Promise<void> {
    if (!this.hasPermission(BotPermission.SEND_SYSTEM_MESSAGES)) {
      throw new Error('Bot lacks permission to send system messages');
    }

    const welcomeContent = `Welcome to Hockey Hub, ${userName}! 🏒

I'm the System Bot, here to help you get started and keep you informed about important updates.

Here are some quick tips to get you started:
• Complete your profile to get personalized recommendations
• Join your team to access team-specific features
• Enable notifications to stay up-to-date
• Check out the FAQ section for common questions

If you need any help, feel free to use the Help Bot by typing /help in any conversation.

Enjoy your Hockey Hub experience! 🎉`;

    await this.sendDirectMessage(userId, welcomeContent, {
      type: MessageType.SYSTEM,
      metadata: {
        notification_type: SystemNotificationType.WELCOME,
      },
      actions: [
        {
          id: 'complete_profile',
          type: 'button',
          label: 'Complete Profile',
          value: '/profile',
          style: 'primary',
        },
        {
          id: 'view_faq',
          type: 'button',
          label: 'View FAQ',
          value: '/faq',
          style: 'secondary',
        },
      ],
    });

    this.logActivity('welcome_message_sent', { userId, userName });
  }

  /**
   * Send password reset notification
   */
  public async sendPasswordResetNotification(
    userId: string,
    resetToken: string,
    expiryMinutes: number = 60
  ): Promise<void> {
    const content = `🔐 Password Reset Request

A password reset has been requested for your account. If you did not make this request, please ignore this message and your password will remain unchanged.

To reset your password, click the button below:

This link will expire in ${expiryMinutes} minutes for security reasons.

If you're having trouble, contact support at support@hockeyhub.com`;

    await this.sendDirectMessage(userId, content, {
      type: MessageType.SYSTEM,
      metadata: {
        notification_type: SystemNotificationType.PASSWORD_RESET,
        reset_token: resetToken,
        expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
      },
      actions: [
        {
          id: 'reset_password',
          type: 'link',
          label: 'Reset Password',
          value: resetToken,
          url: `/reset-password?token=${resetToken}`,
          style: 'primary',
        },
      ],
    });

    this.logActivity('password_reset_sent', { userId });
  }

  /**
   * Send email verification notification
   */
  public async sendEmailVerificationNotification(
    userId: string,
    verificationToken: string
  ): Promise<void> {
    const content = `📧 Email Verification Required

Please verify your email address to unlock all features of Hockey Hub.

Click the button below to verify your email:`;

    await this.sendDirectMessage(userId, content, {
      type: MessageType.SYSTEM,
      metadata: {
        notification_type: SystemNotificationType.EMAIL_VERIFICATION,
        verification_token: verificationToken,
      },
      actions: [
        {
          id: 'verify_email',
          type: 'link',
          label: 'Verify Email',
          value: verificationToken,
          url: `/verify-email?token=${verificationToken}`,
          style: 'primary',
        },
      ],
    });

    this.logActivity('email_verification_sent', { userId });
  }

  /**
   * Send security alert
   */
  public async sendSecurityAlert(
    userId: string,
    alertType: string,
    details: string
  ): Promise<void> {
    const content = `⚠️ Security Alert

We detected unusual activity on your account:

**${alertType}**
${details}

If this was you, you can safely ignore this message. If you don't recognize this activity, please take action immediately.`;

    await this.sendDirectMessage(userId, content, {
      type: MessageType.SYSTEM,
      metadata: {
        notification_type: SystemNotificationType.SECURITY_ALERT,
        alert_type: alertType,
      },
      actions: [
        {
          id: 'secure_account',
          type: 'button',
          label: 'Secure My Account',
          value: '/security',
          style: 'danger',
        },
        {
          id: 'change_password',
          type: 'button',
          label: 'Change Password',
          value: '/change-password',
          style: 'primary',
        },
      ],
    });

    this.logActivity('security_alert_sent', { userId, alertType });
  }

  /**
   * Send system maintenance notification
   */
  public async sendMaintenanceNotification(
    notification: SystemNotification
  ): Promise<void> {
    const { title, message, userIds, metadata } = notification;

    const content = `🔧 ${title}

${message}

We apologize for any inconvenience this may cause.`;

    if (userIds && userIds.length > 0) {
      // Send to specific users
      await this.sendBroadcast(userIds, content, {
        type: MessageType.SYSTEM,
        metadata: {
          notification_type: SystemNotificationType.MAINTENANCE,
          ...metadata,
        },
      });
    } else {
      // Would normally send to all users, but for demo purposes, log it
      this.logger.info('System-wide maintenance notification:', { title, message });
    }

    this.logActivity('maintenance_notification_sent', { title, userCount: userIds?.length || 'all' });
  }

  /**
   * Send system update announcement
   */
  public async sendUpdateAnnouncement(
    notification: SystemNotification
  ): Promise<void> {
    const { title, message, userIds, metadata } = notification;

    const content = `🎉 ${title}

${message}

Check out what's new in Hockey Hub!`;

    const actions = metadata?.features
      ? [
          {
            id: 'view_updates',
            type: 'link',
            label: 'View Update Details',
            value: '/updates',
            url: '/updates',
            style: 'primary' as const,
          },
        ]
      : undefined;

    if (userIds && userIds.length > 0) {
      await this.sendBroadcast(userIds, content, {
        type: MessageType.SYSTEM,
        metadata: {
          notification_type: SystemNotificationType.UPDATE,
          ...metadata,
        },
        actions,
      });
    }

    this.logActivity('update_announcement_sent', { title, userCount: userIds?.length || 'all' });
  }

  /**
   * Send account locked notification
   */
  public async sendAccountLockedNotification(
    userId: string,
    reason: string,
    unlockInstructions: string
  ): Promise<void> {
    const content = `🔒 Account Locked

Your account has been temporarily locked for security reasons.

**Reason:** ${reason}

**To unlock your account:**
${unlockInstructions}

If you believe this is an error, please contact support.`;

    await this.sendDirectMessage(userId, content, {
      type: MessageType.SYSTEM,
      metadata: {
        notification_type: SystemNotificationType.ACCOUNT_LOCKED,
        reason,
      },
      actions: [
        {
          id: 'contact_support',
          type: 'link',
          label: 'Contact Support',
          value: '/support',
          url: '/support',
          style: 'primary',
        },
      ],
    });

    this.logActivity('account_locked_notification_sent', { userId, reason });
  }

  /**
   * Send system status update
   */
  public async sendSystemStatusUpdate(
    status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage',
    affectedServices: string[],
    estimatedResolution?: Date
  ): Promise<void> {
    const statusEmoji = {
      operational: '✅',
      degraded: '⚡',
      partial_outage: '⚠️',
      major_outage: '🔴',
    }[status];

    const statusText = {
      operational: 'All Systems Operational',
      degraded: 'Degraded Performance',
      partial_outage: 'Partial Service Outage',
      major_outage: 'Major Service Outage',
    }[status];

    let content = `${statusEmoji} System Status: ${statusText}`;

    if (affectedServices.length > 0) {
      content += `\n\nAffected services:\n${affectedServices.map((s) => `• ${s}`).join('\n')}`;
    }

    if (estimatedResolution) {
      content += `\n\nEstimated resolution time: ${estimatedResolution.toLocaleString()}`;
    }

    content += '\n\nFor real-time updates, visit our status page.';

    // In production, this would broadcast to all users
    this.logger.info('System status update:', { status, affectedServices });

    this.logActivity('system_status_update', { status, affectedServices });
  }
}