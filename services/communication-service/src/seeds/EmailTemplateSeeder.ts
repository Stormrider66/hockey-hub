import { DataSource } from 'typeorm';
import { NotificationTemplate, NotificationType, NotificationChannel, TemplateFormat } from '../entities';
import { Logger } from '@hockey-hub/shared-lib';

export class EmailTemplateSeeder {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('EmailTemplateSeeder');
  }

  async seed(dataSource: DataSource): Promise<void> {
    const templateRepository = dataSource.getRepository(NotificationTemplate);

    const templates: Partial<NotificationTemplate>[] = [
      {
        name: 'Message Received Email',
        description: 'Email sent when user receives a new message while offline',
        type: NotificationType.MESSAGE_RECEIVED,
        channel: NotificationChannel.EMAIL,
        subject_template: 'New message from {{senderName}} in Hockey Hub',
        body_template: `Hi {{recipientName}},

You have received a new message from {{senderName}}:

"{{messagePreview}}"

Click here to view the full conversation: {{actionUrl}}

Best regards,
Hockey Hub Team`,
        format: TemplateFormat.TEXT,
        variables: ['recipientName', 'senderName', 'messagePreview', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Mention Email',
        description: 'Email sent when user is mentioned in a conversation',
        type: NotificationType.MENTION,
        channel: NotificationChannel.EMAIL,
        subject_template: '{{mentionedBy}} mentioned you in Hockey Hub',
        body_template: `Hi {{recipientName}},

{{mentionedBy}} mentioned you in a conversation:

"{{messagePreview}}"

Click here to view the conversation: {{actionUrl}}

Best regards,
Hockey Hub Team`,
        format: TemplateFormat.TEXT,
        variables: ['recipientName', 'mentionedBy', 'messagePreview', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Training Scheduled Email',
        description: 'Email sent when a new training session is scheduled',
        type: NotificationType.TRAINING_SCHEDULED,
        channel: NotificationChannel.EMAIL,
        subject_template: 'New training session scheduled: {{sessionTitle}}',
        body_template: `Hi {{recipientName}},

A new training session has been scheduled:

Session: {{sessionTitle}}
Date: {{sessionDate}}
Time: {{sessionTime}}
Location: {{location}}
Coach: {{coachName}}

{{additionalInfo}}

Click here to view details: {{actionUrl}}

Best regards,
Hockey Hub Team`,
        format: TemplateFormat.TEXT,
        variables: ['recipientName', 'sessionTitle', 'sessionDate', 'sessionTime', 'location', 'coachName', 'additionalInfo', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Medical Appointment Email',
        description: 'Email sent for medical appointment reminders',
        type: NotificationType.MEDICAL_APPOINTMENT,
        channel: NotificationChannel.EMAIL,
        subject_template: 'Medical appointment reminder: {{appointmentType}}',
        body_template: `Hi {{recipientName}},

This is a reminder about your upcoming medical appointment:

Type: {{appointmentType}}
Date: {{appointmentDate}}
Time: {{appointmentTime}}
Location: {{location}}
With: {{staffName}}

{{instructions}}

Click here for more details: {{actionUrl}}

Best regards,
Hockey Hub Medical Team`,
        format: TemplateFormat.TEXT,
        variables: ['recipientName', 'appointmentType', 'appointmentDate', 'appointmentTime', 'location', 'staffName', 'instructions', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Payment Due Email',
        description: 'Email sent for payment reminders',
        type: NotificationType.PAYMENT_DUE,
        channel: NotificationChannel.EMAIL,
        subject_template: 'Payment reminder: {{amount}} due by {{dueDate}}',
        body_template: `Hi {{recipientName}},

This is a reminder that you have a payment due:

Amount: {{amount}}
Due Date: {{dueDate}}
Description: {{description}}

{{paymentInstructions}}

Click here to make a payment: {{actionUrl}}

If you have already made this payment, please disregard this reminder.

Best regards,
Hockey Hub Billing Team`,
        format: TemplateFormat.TEXT,
        variables: ['recipientName', 'amount', 'dueDate', 'description', 'paymentInstructions', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Team Announcement Email',
        description: 'Email sent for important team announcements',
        type: NotificationType.TEAM_ANNOUNCEMENT,
        channel: NotificationChannel.EMAIL,
        subject_template: 'Team announcement: {{announcementTitle}}',
        body_template: `Hi {{recipientName}},

{{coachName}} has posted an important team announcement:

{{announcementTitle}}

{{announcementContent}}

Click here to view the full announcement: {{actionUrl}}

Best regards,
{{teamName}} Coaching Staff`,
        format: TemplateFormat.TEXT,
        variables: ['recipientName', 'coachName', 'announcementTitle', 'announcementContent', 'teamName', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Daily Digest Email',
        description: 'Daily summary of notifications',
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        subject_template: 'Your daily Hockey Hub digest - {{notificationCount}} updates',
        body_template: `Hi {{recipientName}},

Here's your daily summary of Hockey Hub notifications:

{{digestContent}}

Click here to view all notifications: {{actionUrl}}

Best regards,
Hockey Hub Team`,
        format: TemplateFormat.HTML,
        variables: ['recipientName', 'notificationCount', 'digestContent', 'actionUrl'],
        is_active: true,
        is_system_template: true
      },
      {
        name: 'Weekly Digest Email',
        description: 'Weekly summary of notifications',
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        subject_template: 'Your weekly Hockey Hub digest - {{notificationCount}} updates',
        body_template: `Hi {{recipientName}},

Here's your weekly summary of Hockey Hub notifications:

{{digestContent}}

Click here to view all notifications: {{actionUrl}}

Best regards,
Hockey Hub Team`,
        format: TemplateFormat.HTML,
        variables: ['recipientName', 'notificationCount', 'digestContent', 'actionUrl'],
        is_active: true,
        is_system_template: true
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const templateData of templates) {
      try {
        // Check if template already exists
        const existingTemplate = await templateRepository.findOne({
          where: {
            type: templateData.type!,
            channel: templateData.channel!,
            name: templateData.name!
          }
        });

        if (existingTemplate) {
          skippedCount++;
          this.logger.debug(`Template already exists: ${templateData.name}`);
          continue;
        }

        // Create new template
        const template = templateRepository.create(templateData);
        await templateRepository.save(template);
        createdCount++;
        this.logger.info(`Created template: ${templateData.name}`);
      } catch (error) {
        this.logger.error(`Failed to create template: ${templateData.name}`, error);
      }
    }

    this.logger.info(`Email template seeding complete. Created: ${createdCount}, Skipped: ${skippedCount}`);
  }
}