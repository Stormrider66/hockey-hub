import sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import { Logger } from '@hockey-hub/shared-lib';
import * as fs from 'fs/promises';
import * as path from 'path';
import { NotificationTemplate, TemplateFormat } from '../entities';

export interface SendGridConfig {
  apiKey: string;
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  sandboxMode?: boolean;
  trackingSettings?: {
    clickTracking?: boolean;
    openTracking?: boolean;
    subscriptionTracking?: boolean;
  };
}

export interface EmailTrackingData {
  messageId: string;
  to: string[];
  subject: string;
  sentAt: Date;
  opens?: number;
  clicks?: number;
  unsubscribed?: boolean;
}

export interface SendEmailOptionsWithTracking {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: NotificationTemplate;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: Date;
  batchId?: string;
  asm?: {
    groupId: number;
    groupsToDisplay?: number[];
  };
}

export class SendGridEmailService {
  private config: SendGridConfig;
  private logger: Logger;
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private templateCache: Map<string, string> = new Map();

  constructor(config: SendGridConfig) {
    this.config = config;
    this.logger = new Logger('SendGridEmailService');
    
    if (!config.apiKey) {
      throw new Error('SendGrid API key is required');
    }
    
    sgMail.setApiKey(config.apiKey);
    this.registerHandlebarsHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    // Format currency helper
    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Capitalize helper
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    });

    // Pluralize helper
    Handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });
  }

  /**
   * Load and compile Handlebars template from file
   */
  private async loadTemplate(templatePath: string): Promise<Handlebars.TemplateDelegate> {
    try {
      // Check cache first
      if (this.compiledTemplates.has(templatePath)) {
        return this.compiledTemplates.get(templatePath)!;
      }

      const fullPath = path.resolve(process.cwd(), 'templates', templatePath);
      const templateContent = await fs.readFile(fullPath, 'utf-8');
      
      const compiled = Handlebars.compile(templateContent);
      this.compiledTemplates.set(templatePath, compiled);
      
      return compiled;
    } catch (error) {
      this.logger.error('Failed to load template', { templatePath, error });
      throw error;
    }
  }

  /**
   * Process template with Handlebars
   */
  private async processHandlebarsTemplate(
    templatePath: string,
    data: Record<string, any>
  ): Promise<string> {
    const template = await this.loadTemplate(templatePath);
    return template(data);
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(options: SendEmailOptionsWithTracking): Promise<EmailTrackingData> {
    try {
      let subject = options.subject;
      let text = options.text;
      let html = options.html;

      // Use template if provided
      if (options.template && options.templateData) {
        // Process subject template
        subject = Handlebars.compile(options.template.subject_template)(options.templateData);
        
        // Process body template
        if (options.template.format === TemplateFormat.HTML && options.template.body_template.endsWith('.hbs')) {
          html = await this.processHandlebarsTemplate(options.template.body_template, options.templateData);
        } else {
          const bodyTemplate = Handlebars.compile(options.template.body_template);
          text = bodyTemplate(options.templateData);
          
          if (options.template.format === TemplateFormat.HTML) {
            html = text;
          }
        }
      }

      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      const msg: any = {
        to: recipients,
        from: this.config.from,
        subject,
        text,
        html,
        replyTo: options.replyTo || this.config.replyTo,
        categories: options.categories,
        customArgs: options.customArgs,
        sendAt: options.sendAt ? Math.floor(options.sendAt.getTime() / 1000) : undefined,
        batchId: options.batchId,
        asm: options.asm,
        trackingSettings: {
          clickTracking: {
            enable: this.config.trackingSettings?.clickTracking ?? true,
            enableText: false
          },
          openTracking: {
            enable: this.config.trackingSettings?.openTracking ?? true,
            substitutionTag: '%open-track%'
          },
          subscriptionTracking: {
            enable: this.config.trackingSettings?.subscriptionTracking ?? true
          }
        },
        mailSettings: {
          sandboxMode: {
            enable: this.config.sandboxMode ?? false
          }
        }
      };

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments.map(attachment => ({
          content: Buffer.isBuffer(attachment.content) 
            ? attachment.content.toString('base64')
            : Buffer.from(attachment.content).toString('base64'),
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment'
        }));
      }

      // Set priority
      if (options.priority === 'high') {
        msg.priority = 'high';
        msg.headers = {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        };
      }

      const [response] = await sgMail.send(msg);

      const trackingData: EmailTrackingData = {
        messageId: response.headers['x-message-id'] || '',
        to: recipients,
        subject,
        sentAt: new Date(),
        opens: 0,
        clicks: 0,
        unsubscribed: false
      };

      this.logger.info('Email sent successfully via SendGrid', {
        messageId: trackingData.messageId,
        recipients: recipients.length,
        subject: subject.substring(0, 50)
      });

      return trackingData;
    } catch (error) {
      this.logger.error('Failed to send email via SendGrid', error);
      throw error;
    }
  }

  /**
   * Send bulk emails with batching
   */
  async sendBulkEmails(
    emails: SendEmailOptionsWithTracking[],
    batchSize: number = 1000
  ): Promise<EmailTrackingData[]> {
    try {
      const trackingData: EmailTrackingData[] = [];
      
      // SendGrid supports up to 1000 recipients per request
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        // Create personalizations for bulk sending
        const personalizations = batch.map(email => ({
          to: Array.isArray(email.to) ? email.to : [email.to],
          subject: email.subject,
          customArgs: email.customArgs,
          substitutions: email.templateData
        }));

        const msg: any = {
          personalizations,
          from: this.config.from,
          subject: 'Default Subject', // Will be overridden by personalizations
          text: batch[0].text,
          html: batch[0].html,
          trackingSettings: {
            clickTracking: {
              enable: this.config.trackingSettings?.clickTracking ?? true
            },
            openTracking: {
              enable: this.config.trackingSettings?.openTracking ?? true
            }
          }
        };

        const [response] = await sgMail.send(msg);
        
        // Create tracking data for each email
        batch.forEach((email, index) => {
          trackingData.push({
            messageId: `${response.headers['x-message-id']}_${index}`,
            to: Array.isArray(email.to) ? email.to : [email.to],
            subject: email.subject,
            sentAt: new Date(),
            opens: 0,
            clicks: 0,
            unsubscribed: false
          });
        });
      }

      this.logger.info('Bulk emails sent successfully', {
        totalEmails: emails.length,
        batches: Math.ceil(emails.length / batchSize)
      });

      return trackingData;
    } catch (error) {
      this.logger.error('Failed to send bulk emails', error);
      throw error;
    }
  }

  /**
   * Validate email configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      // Send a test email in sandbox mode
      await sgMail.send({
        to: 'test@example.com',
        from: this.config.from,
        subject: 'SendGrid Configuration Test',
        text: 'This is a test email to validate SendGrid configuration.',
        mailSettings: {
          sandboxMode: {
            enable: true
          }
        }
      });

      this.logger.info('SendGrid configuration validated successfully');
      return true;
    } catch (error) {
      this.logger.error('SendGrid configuration validation failed', error);
      return false;
    }
  }

  /**
   * Process webhook events from SendGrid
   */
  async processWebhookEvent(event: any): Promise<void> {
    try {
      const { event: eventType, email, timestamp, sg_message_id } = event;

      switch (eventType) {
        case 'open':
          this.logger.info('Email opened', { email, messageId: sg_message_id });
          // Update tracking data
          break;
        case 'click':
          this.logger.info('Email link clicked', { email, messageId: sg_message_id, url: event.url });
          // Update tracking data
          break;
        case 'unsubscribe':
          this.logger.info('User unsubscribed', { email, messageId: sg_message_id });
          // Update user preferences
          break;
        case 'bounce':
          this.logger.warn('Email bounced', { email, messageId: sg_message_id, reason: event.reason });
          // Handle bounce
          break;
        case 'spam_report':
          this.logger.warn('Email marked as spam', { email, messageId: sg_message_id });
          // Handle spam report
          break;
        default:
          this.logger.debug('Webhook event received', { eventType, email });
      }
    } catch (error) {
      this.logger.error('Failed to process webhook event', error);
      throw error;
    }
  }

  /**
   * Create unsubscribe link
   */
  createUnsubscribeLink(userId: string, token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/unsubscribe?user=${userId}&token=${token}`;
  }
}