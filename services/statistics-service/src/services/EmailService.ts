// @ts-nocheck - Email service with template literals
import { Injectable } from '@nestjs/common';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  variables: string[];
}

@Injectable()
export class EmailService {
  private emailTemplates = new Map<string, EmailTemplate>();

  constructor() {
    this.initializeTemplates();
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In a real implementation, this would use a service like SendGrid, AWS SES, or Nodemailer
      console.log('Sending email:', {
        to: options.to,
        subject: options.subject,
        attachmentCount: options.attachments?.length || 0
      });

      // Mock successful email delivery
      await this.simulateEmailDelivery();
      
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTemplatedEmail(templateName: string, to: string | string[], variables: Record<string, any>): Promise<boolean> {
    const template = this.emailTemplates.get(templateName);
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    let html = template.html;
    let subject = template.subject;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value.toString());
      subject = subject.replace(regex, value.toString());
    }

    return await this.sendEmail({
      to,
      subject,
      html
    });
  }

  async sendReportNotification(options: {
    to: string[];
    reportName: string;
    reportType: string;
    downloadUrls: Array<{ format: string; url: string }>;
    generatedBy: string;
    organizationName?: string;
  }): Promise<boolean> {
    const downloadLinks = options.downloadUrls
      .map(link => `<li><a href="${link.url}">${link.format.toUpperCase()} Format</a></li>`)
      .join('');

    return await this.sendTemplatedEmail('report_ready', options.to, {
      reportName: options.reportName,
      reportType: options.reportType,
      downloadLinks,
      generatedBy: options.generatedBy,
      organizationName: options.organizationName || 'Hockey Hub',
      currentDate: new Date().toLocaleDateString()
    });
  }

  async sendScheduledReportEmail(options: {
    to: string[];
    reportName: string;
    attachments: Array<{ filename: string; path: string }>;
    message?: string;
    organizationName?: string;
  }): Promise<boolean> {
    const subject = `${options.reportName} - ${new Date().toLocaleDateString()}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${options.organizationName || 'Hockey Hub'}</h1>
          <p style="margin: 10px 0 0 0;">Scheduled Report Delivery</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #4F46E5; margin-bottom: 20px;">${options.reportName}</h2>
          
          <p>Please find your scheduled report attached to this email.</p>
          
          ${options.message ? `<div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">${options.message}</p>
          </div>` : ''}
          
          <div style="margin: 30px 0;">
            <h3 style="color: #374151;">Attached Files:</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${options.attachments.map(att => `<li>${att.filename}</li>`).join('')}
            </ul>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            This is an automated report generated on ${new Date().toLocaleString()}.
            If you have any questions, please contact your system administrator.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6B7280; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${options.organizationName || 'Hockey Hub'}. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: options.to,
      subject,
      html,
      attachments: options.attachments
    });
  }

  async sendReportErrorNotification(options: {
    to: string[];
    reportName: string;
    errorMessage: string;
    scheduledReportId?: string;
    organizationName?: string;
  }): Promise<boolean> {
    return await this.sendTemplatedEmail('report_error', options.to, {
      reportName: options.reportName,
      errorMessage: options.errorMessage,
      scheduledReportId: options.scheduledReportId || '',
      organizationName: options.organizationName || 'Hockey Hub',
      currentDate: new Date().toLocaleDateString(),
      supportEmail: 'support@hockeyhub.com'
    });
  }

  getAvailableTemplates(): EmailTemplate[] {
    return Array.from(this.emailTemplates.values());
  }

  private async simulateEmailDelivery(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Email service temporarily unavailable');
    }
  }

  private initializeTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        name: 'report_ready',
        subject: '{{reportName}} is Ready for Download',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">{{organizationName}}</h1>
              <p style="margin: 10px 0 0 0;">Report Ready</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #4F46E5; margin-bottom: 20px;">Your {{reportType}} Report is Ready</h2>
              
              <p>Hello,</p>
              <p>Your report "<strong>{{reportName}}</strong>" has been generated successfully and is ready for download.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Download Options:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  {{downloadLinks}}
                </ul>
              </div>
              
              <p style="color: #6B7280; font-size: 14px;">
                Generated by: {{generatedBy}}<br>
                Date: {{currentDate}}
              </p>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Note: Download links will expire in 30 days for security purposes.
              </p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6B7280; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} {{organizationName}}. All rights reserved.</p>
            </div>
          </div>
        `,
        variables: ['reportName', 'reportType', 'downloadLinks', 'generatedBy', 'organizationName', 'currentDate']
      },
      {
        name: 'report_error',
        subject: 'Report Generation Failed: {{reportName}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #EF4444; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">{{organizationName}}</h1>
              <p style="margin: 10px 0 0 0;">Report Generation Error</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #EF4444; margin-bottom: 20px;">Report Generation Failed</h2>
              
              <p>We encountered an error while generating your report "<strong>{{reportName}}</strong>".</p>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #DC2626; margin-top: 0;">Error Details:</h3>
                <p style="margin: 0; font-family: monospace; font-size: 14px;">{{errorMessage}}</p>
              </div>
              
              <p>Please try the following steps:</p>
              <ol>
                <li>Check if all required data sources are available</li>
                <li>Verify your report filters and date ranges</li>
                <li>Try generating the report again in a few minutes</li>
              </ol>
              
              <p>If the problem persists, please contact support at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a> with the following information:</p>
              <ul>
                <li>Report name: {{reportName}}</li>
                <li>Date: {{currentDate}}</li>
                <li>Scheduled Report ID: {{scheduledReportId}}</li>
              </ul>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6B7280; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} {{organizationName}}. All rights reserved.</p>
            </div>
          </div>
        `,
        variables: ['reportName', 'errorMessage', 'scheduledReportId', 'organizationName', 'currentDate', 'supportEmail']
      },
      {
        name: 'scheduled_report_summary',
        subject: 'Weekly Scheduled Reports Summary',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">{{organizationName}}</h1>
              <p style="margin: 10px 0 0 0;">Scheduled Reports Summary</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #4F46E5; margin-bottom: 20px;">Weekly Report Summary</h2>
              
              <p>Here's a summary of your scheduled reports for the week of {{weekRange}}:</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Statistics:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Reports generated: {{totalReports}}</li>
                  <li>Successful deliveries: {{successfulReports}}</li>
                  <li>Failed reports: {{failedReports}}</li>
                  <li>Most popular format: {{popularFormat}}</li>
                </ul>
              </div>
              
              {{#if failedReports}}
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #DC2626; margin-top: 0;">Failed Reports:</h3>
                <p>{{failedReportsList}}</p>
                <p>Please check your scheduled report configurations or contact support if issues persist.</p>
              </div>
              {{/if}}
            </div>
            
            <div style="background: #f8fafc; padding: 20px; text-align: center; color: #6B7280; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} {{organizationName}}. All rights reserved.</p>
            </div>
          </div>
        `,
        variables: ['organizationName', 'weekRange', 'totalReports', 'successfulReports', 'failedReports', 'popularFormat', 'failedReportsList']
      }
    ];

    for (const template of templates) {
      this.emailTemplates.set(template.name, template);
    }
  }
}