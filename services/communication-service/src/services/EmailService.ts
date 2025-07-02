import nodemailer from 'nodemailer';
import { Logger } from '@hockey-hub/shared-lib';
import { NotificationTemplate, TemplateFormat } from '../entities';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
}

export interface SendEmailOptions {
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
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private logger: Logger;

  constructor(config: EmailConfig) {
    this.config = config;
    this.logger = new Logger('EmailService');
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter verification failed', error);
      } else {
        this.logger.info('Email transporter verified successfully');
      }
    });
  }

  /**
   * Send email with template or direct content
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      let subject = options.subject;
      let text = options.text;
      let html = options.html;

      // Use template if provided
      if (options.template && options.templateData) {
        ({ subject, text, html } = this.processTemplate(
          options.template, 
          options.templateData
        ));
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: this.config.from,
        replyTo: this.config.replyTo || this.config.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject,
        text,
        html,
        attachments: options.attachments,
        priority: options.priority || 'normal',
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.info('Email sent successfully', {
        messageId: info.messageId,
        recipients: Array.isArray(options.to) ? options.to.length : 1,
        subject: subject.substring(0, 50)
      });
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw error;
    }
  }

  /**
   * Process email template with data
   */
  private processTemplate(
    template: NotificationTemplate, 
    data: Record<string, any>
  ): { subject: string; text: string; html?: string } {
    const subject = this.interpolateTemplate(template.subject_template, data);
    const text = this.interpolateTemplate(template.body_template, data);
    
    let html: string | undefined;
    
    if (template.format === TemplateFormat.HTML) {
      html = this.interpolateTemplate(template.body_template, data);
    } else if (template.format === TemplateFormat.MARKDOWN) {
      // Convert markdown to HTML (would need markdown parser)
      html = this.markdownToHtml(text);
    }

    return { subject, text, html };
  }

  /**
   * Simple template interpolation
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Basic markdown to HTML conversion
   */
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulkEmails(
    emails: SendEmailOptions[], 
    batchSize: number = 10,
    delayMs: number = 1000
  ): Promise<void> {
    try {
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        
        await Promise.all(batch.map(email => this.sendEmail(email)));
        
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      this.logger.info('Bulk emails sent successfully', {
        totalEmails: emails.length,
        batches: Math.ceil(emails.length / batchSize)
      });
    } catch (error) {
      this.logger.error('Failed to send bulk emails', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email configuration test failed', error);
      return false;
    }
  }

  /**
   * Close transporter
   */
  async close(): Promise<void> {
    this.transporter.close();
    this.logger.info('Email service closed');
  }
}