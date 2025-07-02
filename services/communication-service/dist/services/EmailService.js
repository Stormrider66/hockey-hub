"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const shared_lib_1 = require("@hockey-hub/shared-lib");
const entities_1 = require("../entities");
class EmailService {
    constructor(config) {
        this.config = config;
        this.logger = new shared_lib_1.Logger('EmailService');
        this.initializeTransporter();
    }
    initializeTransporter() {
        this.transporter = nodemailer_1.default.createTransporter({
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
            }
            else {
                this.logger.info('Email transporter verified successfully');
            }
        });
    }
    /**
     * Send email with template or direct content
     */
    async sendEmail(options) {
        try {
            let subject = options.subject;
            let text = options.text;
            let html = options.html;
            // Use template if provided
            if (options.template && options.templateData) {
                ({ subject, text, html } = this.processTemplate(options.template, options.templateData));
            }
            const mailOptions = {
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
        }
        catch (error) {
            this.logger.error('Failed to send email', error);
            throw error;
        }
    }
    /**
     * Process email template with data
     */
    processTemplate(template, data) {
        const subject = this.interpolateTemplate(template.subject_template, data);
        const text = this.interpolateTemplate(template.body_template, data);
        let html;
        if (template.format === entities_1.TemplateFormat.HTML) {
            html = this.interpolateTemplate(template.body_template, data);
        }
        else if (template.format === entities_1.TemplateFormat.MARKDOWN) {
            // Convert markdown to HTML (would need markdown parser)
            html = this.markdownToHtml(text);
        }
        return { subject, text, html };
    }
    /**
     * Simple template interpolation
     */
    interpolateTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? String(data[key]) : match;
        });
    }
    /**
     * Basic markdown to HTML conversion
     */
    markdownToHtml(markdown) {
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
    async sendBulkEmails(emails, batchSize = 10, delayMs = 1000) {
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
        }
        catch (error) {
            this.logger.error('Failed to send bulk emails', error);
            throw error;
        }
    }
    /**
     * Test email configuration
     */
    async testConfiguration() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            this.logger.error('Email configuration test failed', error);
            return false;
        }
    }
    /**
     * Close transporter
     */
    async close() {
        this.transporter.close();
        this.logger.info('Email service closed');
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=EmailService.js.map