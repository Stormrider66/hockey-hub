import { Twilio } from 'twilio';
import { Logger } from '@hockey-hub/shared-lib';

export interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export interface SmsMessage {
  to: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface SmsDeliveryStatus {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  errorCode?: string;
  errorMessage?: string;
  deliveredAt?: Date;
}

export interface SmsResponse {
  messageId: string;
  status: string;
  to: string;
  success: boolean;
  error?: string;
}

export class TwilioSmsService {
  private client: Twilio;
  private fromPhoneNumber: string;
  private isEnabled: boolean;
  private logger: any;

  constructor() {
    this.logger = new Logger('twilio-sms');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.isEnabled = !!(accountSid && authToken && this.fromPhoneNumber);

    if (this.isEnabled) {
      this.client = new Twilio(accountSid, authToken);
      this.logger.info('TwilioSmsService initialized successfully');
    } else {
      this.logger.warn('TwilioSmsService disabled - missing configuration');
    }
  }

  /**
   * SMS Templates for different notification types
   */
  private templates: Record<string, SmsTemplate> = {
    welcome: {
      id: 'welcome',
      name: 'Welcome Message',
      content: 'Welcome to Hockey Hub, {{name}}! Your account is now active. Team: {{team}}',
      variables: ['name', 'team']
    },
    trainingReminder: {
      id: 'trainingReminder',
      name: 'Training Reminder',
      content: 'Training reminder: {{session}} at {{time}} on {{date}}. Location: {{location}}',
      variables: ['session', 'time', 'date', 'location']
    },
    gameAlert: {
      id: 'gameAlert',
      name: 'Game Alert',
      content: 'Game alert: {{homeTeam}} vs {{awayTeam}} at {{time}}. {{message}}',
      variables: ['homeTeam', 'awayTeam', 'time', 'message']
    },
    injuryAlert: {
      id: 'injuryAlert',
      name: 'Injury Alert',
      content: 'Injury alert for {{player}}. Contact medical staff immediately. Ref: {{reference}}',
      variables: ['player', 'reference']
    },
    emergencyAlert: {
      id: 'emergencyAlert',
      name: 'Emergency Alert',
      content: 'EMERGENCY: {{message}}. Please respond immediately.',
      variables: ['message']
    },
    scheduleChange: {
      id: 'scheduleChange',
      name: 'Schedule Change',
      content: 'Schedule change: {{event}} moved to {{newTime}} on {{newDate}}. Location: {{location}}',
      variables: ['event', 'newTime', 'newDate', 'location']
    },
    paymentReminder: {
      id: 'paymentReminder',
      name: 'Payment Reminder',
      content: 'Payment reminder: ${{amount}} due on {{dueDate}} for {{description}}.',
      variables: ['amount', 'dueDate', 'description']
    },
    teamAnnouncement: {
      id: 'teamAnnouncement',
      name: 'Team Announcement',
      content: 'Team announcement from {{sender}}: {{message}}',
      variables: ['sender', 'message']
    }
  };

  /**
   * Get all available SMS templates
   */
  getTemplates(): SmsTemplate[] {
    return Object.values(this.templates);
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(templateId: string): SmsTemplate | null {
    return this.templates[templateId] || null;
  }

  /**
   * Process template variables in message content
   */
  private processTemplate(content: string, variables: Record<string, string>): string {
    let processedContent = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    }
    
    return processedContent;
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }
    
    // Add country code if missing (assume US/Canada +1)
    if (cleaned.length === 10) {
      return true;
    }
    
    return true;
  }

  /**
   * Format phone number for Twilio
   */
  private formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Send a single SMS message
   */
  async sendSms(smsMessage: SmsMessage): Promise<SmsResponse> {
    if (!this.isEnabled) {
      this.logger.warn('SMS service is disabled');
      return {
        messageId: '',
        status: 'failed',
        to: smsMessage.to,
        success: false,
        error: 'SMS service is disabled'
      };
    }

    try {
      // Validate phone number
      if (!this.validatePhoneNumber(smsMessage.to)) {
        throw new Error('Invalid phone number format');
      }

      const formattedTo = this.formatPhoneNumber(smsMessage.to);
      
      // Process message content
      let messageContent = smsMessage.message;
      
      if (smsMessage.templateId && smsMessage.variables) {
        const template = this.getTemplate(smsMessage.templateId);
        if (template) {
          messageContent = this.processTemplate(template.content, smsMessage.variables);
        }
      }

      // Send SMS via Twilio
      const message = await this.client.messages.create({
        body: messageContent,
        from: this.fromPhoneNumber,
        to: formattedTo,
        statusCallback: `${process.env.API_BASE_URL}/api/sms/webhooks/status`,
      });

      this.logger.info('SMS sent successfully', {
        messageId: message.sid,
        to: formattedTo,
        status: message.status
      });

      return {
        messageId: message.sid,
        status: message.status,
        to: formattedTo,
        success: true
      };

    } catch (error: any) {
      this.logger.error('Failed to send SMS', {
        to: smsMessage.to,
        error: error.message,
        templateId: smsMessage.templateId
      });

      return {
        messageId: '',
        status: 'failed',
        to: smsMessage.to,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSms(messages: SmsMessage[]): Promise<SmsResponse[]> {
    const results: SmsResponse[] = [];
    
    // Process messages in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(message => this.sendSms(message));
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            messageId: '',
            status: 'failed',
            to: '',
            success: false,
            error: result.reason.message
          });
        }
      }
      
      // Small delay between batches
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Send SMS using template
   */
  async sendTemplatedSms(
    to: string,
    templateId: string,
    variables: Record<string, string>,
    metadata?: Record<string, any>
  ): Promise<SmsResponse> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate that all required variables are provided
    const missingVars = template.variables.filter(variable => !(variable in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing template variables: ${missingVars.join(', ')}`);
    }

    return this.sendSms({
      to,
      message: template.content,
      templateId,
      variables,
      metadata
    });
  }

  /**
   * Get delivery status for a message
   */
  async getDeliveryStatus(messageId: string): Promise<SmsDeliveryStatus | null> {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      
      return {
        messageId: message.sid,
        status: message.status as any,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage || undefined,
        deliveredAt: message.dateUpdated
      };
    } catch (error) {
      this.logger.error('Failed to get SMS delivery status', {
        messageId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Handle Twilio webhook for delivery status updates
   */
  handleDeliveryWebhook(webhookData: any): SmsDeliveryStatus {
    return {
      messageId: webhookData.MessageSid,
      status: webhookData.MessageStatus,
      errorCode: webhookData.ErrorCode,
      errorMessage: webhookData.ErrorMessage,
      deliveredAt: webhookData.MessageStatus === 'delivered' ? new Date() : undefined
    };
  }

  /**
   * Check if SMS service is enabled and configured
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get SMS service status and configuration
   */
  getServiceStatus() {
    return {
      enabled: this.isEnabled,
      fromNumber: this.fromPhoneNumber ? `***${this.fromPhoneNumber.slice(-4)}` : 'Not configured',
      templatesCount: Object.keys(this.templates).length,
      availableTemplates: Object.keys(this.templates)
    };
  }
}

export const twilioSmsService = new TwilioSmsService();