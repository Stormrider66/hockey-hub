import { Router, Request, Response } from 'express';
import { twilioSmsService, SmsMessage } from '../services/TwilioSmsService';
import { logger } from '@hockey-hub/shared-lib';
import { authMiddleware, checkPermission } from '@hockey-hub/shared-lib/src/middleware/authMiddleware';

export const smsRoutes = Router();

/**
 * Send a single SMS message
 */
smsRoutes.post('/send', authMiddleware, checkPermission('sms.send'), async (req: Request, res: Response) => {
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
        sentBy: req.user?.id,
        organizationId: req.user?.organizationId,
        timestamp: new Date().toISOString()
      }
    };

    const result = await twilioSmsService.sendSms(smsMessage);

    logger.info('SMS sent via API', {
      messageId: result.messageId,
      to: result.to,
      success: result.success,
      sentBy: req.user?.id
    });

    res.json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    });

  } catch (error) {
    logger.error('Error sending SMS', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send SMS'
    });
  }
});

/**
 * Send SMS using template
 */
smsRoutes.post('/send/template', authMiddleware, checkPermission('sms.send'), async (req: Request, res: Response) => {
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
        sentBy: req.user?.id,
        organizationId: req.user?.organizationId,
        timestamp: new Date().toISOString()
      }
    );

    logger.info('Template SMS sent via API', {
      messageId: result.messageId,
      to: result.to,
      templateId,
      success: result.success,
      sentBy: req.user?.id
    });

    res.json({
      success: result.success,
      messageId: result.messageId,
      status: result.status,
      error: result.error
    });

  } catch (error) {
    logger.error('Error sending template SMS', {
      error: error.message,
      templateId: req.body.templateId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send bulk SMS messages
 */
smsRoutes.post('/send/bulk', authMiddleware, checkPermission('sms.send.bulk'), async (req: Request, res: Response) => {
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
        sentBy: req.user?.id,
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
      sentBy: req.user?.id
    });

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    logger.error('Error sending bulk SMS', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send bulk SMS'
    });
  }
});

/**
 * Get SMS templates
 */
smsRoutes.get('/templates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const templates = twilioSmsService.getTemplates();

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    logger.error('Error getting SMS templates', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

/**
 * Get specific SMS template
 */
smsRoutes.get('/templates/:templateId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = twilioSmsService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template
    });

  } catch (error) {
    logger.error('Error getting SMS template', {
      error: error.message,
      templateId: req.params.templateId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
});

/**
 * Get delivery status for a message
 */
smsRoutes.get('/status/:messageId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const status = await twilioSmsService.getDeliveryStatus(messageId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Error getting SMS status', {
      error: error.message,
      messageId: req.params.messageId,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get message status'
    });
  }
});

/**
 * Get SMS service status
 */
smsRoutes.get('/service/status', authMiddleware, checkPermission('admin.view'), async (req: Request, res: Response) => {
  try {
    const status = twilioSmsService.getServiceStatus();

    res.json({
      success: true,
      service: status
    });

  } catch (error) {
    logger.error('Error getting SMS service status', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
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

    res.status(200).send('OK');

  } catch (error) {
    logger.error('Error processing SMS webhook', {
      error: error.message,
      webhookData: req.body
    });

    res.status(500).send('Error processing webhook');
  }
});

/**
 * Emergency SMS broadcast (admin only)
 */
smsRoutes.post('/emergency/broadcast', authMiddleware, checkPermission('admin.emergency'), async (req: Request, res: Response) => {
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
        sentBy: req.user?.id,
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
      sentBy: req.user?.id,
      organizationId: organizationId || req.user?.organizationId
    });

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount
      }
    });

  } catch (error) {
    logger.error('Error sending emergency SMS broadcast', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send emergency broadcast'
    });
  }
});

export default smsRoutes;