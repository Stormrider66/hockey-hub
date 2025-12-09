import { Router, Request, Response } from 'express';
import { twilioSmsService, SmsMessage } from '../services/TwilioSmsService';
import { Logger, createAuthMiddleware } from '@hockey-hub/shared-lib';
const checkPermission = (_perm: string) => (_req: any, _res: any, next: any) => { next(); return undefined; };

export const smsRoutes: import('express').Router = Router();
const { requireAuth } = createAuthMiddleware();
const logger = new Logger('smsRoutes');

/**
 * Send a single SMS message
 */
smsRoutes.post('/send', requireAuth(), checkPermission('sms.send'), async (req: Request, res: Response) => {
  try {
    const { to, message, templateId, variables, metadata } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const smsMessage: SmsMessage = {
      to,
      message,
      templateId,
      variables,
      metadata: {
        ...metadata,
        sentBy: (req as any).user?.id || req.user?.userId,
        organizationId: req.user?.organizationId,
        timestamp: new Date().toISOString()
      }
    };

    const result = await twilioSmsService.sendSms(smsMessage);

    logger.info('SMS sent via API', {
      messageId: result.messageId,
      to: result.to,
      success: result.success,
      sentBy: (req as any).user?.id || req.user?.userId
    });

    return res.json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    });

  } catch (error) {
    const err = error as any;
    logger.error('Error sending SMS', {
      error: err instanceof Error ? err.message : String(err),
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send SMS'
    });
  }
});

/**
 * Send SMS using template
 */
smsRoutes.post('/send/template', requireAuth(), checkPermission('sms.send'), async (req: Request, res: Response) => {
  try {
    const { to, templateId, variables, metadata } = req.body;

    if (!to || !templateId) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and template ID are required'
      });
    }

    const result = await twilioSmsService.sendTemplatedSms(
      to,
      templateId,
      variables || {},
      {
        ...metadata,
        sentBy: (req as any).user?.id || req.user?.userId,
        organizationId: req.user?.organizationId,
        timestamp: new Date().toISOString()
      }
    );

    logger.info('Template SMS sent via API', {
      messageId: result.messageId,
      to: result.to,
      templateId,
      success: result.success,
      sentBy: (req as any).user?.id || req.user?.userId
    });

    return res.json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error sending template SMS', {
      error: err instanceof Error ? err.message : String(err),
      templateId: req.body.templateId,
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send template SMS'
    });
  }
});

/**
 * Send bulk SMS messages
 */
smsRoutes.post('/send/bulk', requireAuth(), checkPermission('sms.send.bulk'), async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.to || !msg.message) {
        return res.status(400).json({
          success: false,
          error: 'Each message must have "to" and "message" fields'
        });
      }
    }

    // Add metadata to all messages
    const enrichedMessages = messages.map(msg => ({
      ...msg,
      metadata: {
        ...msg.metadata,
        sentBy: (req as any).user?.id || req.user?.userId,
        organizationId: req.user?.organizationId,
        timestamp: new Date().toISOString()
      }
    }));

    const results = await twilioSmsService.sendBulkSms(enrichedMessages);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Bulk SMS sent via API', {
      totalMessages: results.length,
      successCount,
      failureCount,
      sentBy: (req as any).user?.id || req.user?.userId
    });

    return res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error sending bulk SMS', {
      error: err instanceof Error ? err.message : String(err),
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send bulk SMS'
    });
  }
});

/**
 * Get SMS templates
 */
smsRoutes.get('/templates', requireAuth(), async (req: Request, res: Response) => {
  try {
    const templates = twilioSmsService.getTemplates();

    return res.json({
      success: true,
      templates
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error getting SMS templates', {
      error: err instanceof Error ? err.message : String(err),
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

/**
 * Get specific SMS template
 */
smsRoutes.get('/templates/:templateId', requireAuth(), async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = twilioSmsService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    return res.json({
      success: true,
      template
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error getting SMS template', {
      error: err instanceof Error ? err.message : String(err),
      templateId: req.params.templateId,
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
});

/**
 * Get delivery status for a message
 */
smsRoutes.get('/status/:messageId', requireAuth(), async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const status = await twilioSmsService.getDeliveryStatus(messageId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    return res.json({
      success: true,
      status
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error getting SMS status', {
      error: err instanceof Error ? err.message : String(err),
      messageId: req.params.messageId,
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to get message status'
    });
  }
});

/**
 * Get SMS service status
 */
smsRoutes.get('/service/status', requireAuth(), checkPermission('admin.view'), async (req: Request, res: Response) => {
  try {
    const status = twilioSmsService.getServiceStatus();

    return res.json({
      success: true,
      service: status
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error getting SMS service status', {
      error: err instanceof Error ? err.message : String(err),
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

/**
 * Twilio webhook for delivery status updates
 */
smsRoutes.post('/webhooks/status', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    const status = twilioSmsService.handleDeliveryWebhook(webhookData);

    logger.info('SMS delivery status webhook received', {
      messageId: status.messageId,
      status: status.status,
      errorCode: status.errorCode
    });

    // Here you could update the notification status in the database
    // or trigger other actions based on delivery status

    return res.status(200).send('OK');

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error processing SMS webhook', {
      error: err instanceof Error ? err.message : String(err),
      webhookData: req.body
    });

    return res.status(500).send('Error processing webhook');
  }
});

/**
 * Emergency SMS broadcast (admin only)
 */
smsRoutes.post('/emergency/broadcast', requireAuth(), checkPermission('admin.emergency'), async (req: Request, res: Response) => {
  try {
    const { message, recipients, organizationId } = req.body;

    if (!message || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'Message and recipients array are required'
      });
    }

    const emergencyMessages = recipients.map(phoneNumber => ({
      to: phoneNumber,
      message: `EMERGENCY: ${message}`,
      templateId: 'emergencyAlert',
      variables: { message },
      metadata: {
        type: 'emergency',
        sentBy: (req as any).user?.id || req.user?.userId,
        organizationId: organizationId || req.user?.organizationId,
        timestamp: new Date().toISOString()
      }
    }));

    const results = await twilioSmsService.sendBulkSms(emergencyMessages);

    const successCount = results.filter(r => r.success).length;

    logger.warn('Emergency SMS broadcast sent', {
      message,
      totalRecipients: recipients.length,
      successCount,
      sentBy: (req as any).user?.id || req.user?.userId,
      organizationId: organizationId || req.user?.organizationId
    });

    return res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount
      }
    });

  } catch (error: unknown) {
    const err = error as any;
    logger.error('Error sending emergency SMS broadcast', {
      error: err instanceof Error ? err.message : String(err),
      userId: (req as any).user?.id || req.user?.userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send emergency broadcast'
    });
  }
});

export default smsRoutes;