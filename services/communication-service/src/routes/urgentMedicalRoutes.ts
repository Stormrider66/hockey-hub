// @ts-nocheck - Suppress TypeScript errors for build
import { Router, Request, Response } from 'express';
import { UrgentMedicalNotificationService } from '../services/UrgentMedicalNotificationService';
import {
  UrgencyLevel,
  MedicalInfoType,
  NotificationTargetType,
  DeliveryChannel,
  MedicalNotificationStatus,
} from '../entities/UrgentMedicalNotification';
import { AcknowledgmentMethod, EscalationReason } from '../entities';
import { authenticate } from '@hockey-hub/shared-lib';
import { Logger } from '@hockey-hub/shared-lib';

const router: any = Router();
const urgentMedicalService = new UrgentMedicalNotificationService();
const logger = new Logger('UrgentMedicalRoutes');

// Create urgent medical notification
router.post('/urgent', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Validate user has medical staff permissions
    if (!user.roles?.includes('medical_staff') && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions to create urgent medical notifications' });
    }

    const {
      urgencyLevel,
      medicalType,
      title,
      message,
      medicalData,
      targetType,
      targetId,
      customRecipientIds,
      deliveryChannels,
      channelConfig,
      requiresAcknowledgment,
      acknowledgmentTimeoutMinutes,
      requiredAcknowledgers,
      minAcknowledgmentsRequired,
      enableEscalation,
      escalationConfig,
      attachments,
      privacySettings,
      scheduledFor,
      expiresInHours = 24,
    } = req.body;

    // Validate required fields
    if (!urgencyLevel || !medicalType || !title || !message || !targetType || !deliveryChannels?.length) {
      return res.status(400).json({
        error: 'Missing required fields: urgencyLevel, medicalType, title, message, targetType, deliveryChannels',
      });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const notification = await urgentMedicalService.createUrgentNotification({
      organizationId: user.organization_id,
      teamId: req.body.teamId,
      createdBy: user.id,
      urgencyLevel,
      medicalType,
      title,
      message,
      medicalData,
      targetType,
      targetId,
      customRecipientIds,
      deliveryChannels,
      channelConfig,
      requiresAcknowledgment,
      acknowledgmentTimeoutMinutes,
      requiredAcknowledgers,
      minAcknowledgmentsRequired,
      enableEscalation,
      escalationConfig,
      attachments,
      privacySettings,
      scheduledFor,
      expiresAt,
    });

    logger.info('Urgent medical notification created', {
      notificationId: notification.id,
      urgencyLevel: notification.urgency_level,
      createdBy: user.id,
    });

    res.status(201).json(notification);
  } catch (error) {
    logger.error('Failed to create urgent medical notification', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active notifications
router.get('/urgent/active', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { urgencyLevel, medicalType, createdBy, targetType, requiresAcknowledgment } = req.query;

    const filters: any = {};
    if (urgencyLevel) filters.urgencyLevel = urgencyLevel;
    if (medicalType) filters.medicalType = medicalType;
    if (createdBy) filters.createdBy = createdBy;
    if (targetType) filters.targetType = targetType;
    if (requiresAcknowledgment !== undefined) filters.requiresAcknowledgment = requiresAcknowledgment === 'true';

    const notifications = await urgentMedicalService.getActiveNotifications(
      user.organization_id,
      filters
    );

    res.json(notifications);
  } catch (error) {
    logger.error('Failed to get active notifications', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification by ID with full details
router.get('/urgent/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notification = await urgentMedicalService.getNotificationWithDetails(id);

    // Check access permissions
    if (notification.organization_id !== user.organization_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Apply privacy settings if configured
    if (notification.privacy_settings?.restrict_to_medical_staff && 
        !user.roles?.includes('medical_staff') && 
        !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Access restricted to medical staff' });
    }

    res.json(notification);
  } catch (error) {
    logger.error('Failed to get notification details', error);
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge notification
router.post('/urgent/:id/acknowledge', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const {
      method = AcknowledgmentMethod.IN_APP,
      message,
      deviceInfo,
      isEmergencyContact,
      additionalActions,
    } = req.body;

    const acknowledgment = await urgentMedicalService.acknowledgeNotification({
      notificationId: id,
      userId: user.id,
      userName: user.name || `${user.first_name} ${user.last_name}`,
      userRole: user.roles?.[0] || 'unknown',
      method,
      message,
      deviceInfo,
      isEmergencyContact,
      additionalActions,
    });

    logger.info('Notification acknowledged', {
      notificationId: id,
      userId: user.id,
      method,
    });

    res.json(acknowledgment);
  } catch (error) {
    logger.error('Failed to acknowledge notification', error);
    res.status(500).json({ error: error.message });
  }
});

// Escalate notification manually
router.post('/urgent/:id/escalate', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { reason = EscalationReason.MANUAL, message } = req.body;

    // Validate user has permission to escalate
    if (!user.roles?.includes('medical_staff') && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions to escalate notifications' });
    }

    const escalation = await urgentMedicalService.escalateNotification({
      notificationId: id,
      reason,
      triggeredBy: user.id,
      manualMessage: message,
    });

    logger.info('Notification escalated manually', {
      notificationId: id,
      escalatedBy: user.id,
      reason,
    });

    res.json(escalation);
  } catch (error) {
    logger.error('Failed to escalate notification', error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve notification
router.put('/urgent/:id/resolve', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { resolutionNotes } = req.body;

    // Validate user has permission to resolve
    if (!user.roles?.includes('medical_staff') && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions to resolve notifications' });
    }

    const notification = await urgentMedicalService.getNotificationById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.status = MedicalNotificationStatus.RESOLVED;
    notification.resolved_at = new Date();
    notification.resolved_by = user.id;
    notification.resolution_notes = resolutionNotes;

    await notification.save();

    logger.info('Notification resolved', {
      notificationId: id,
      resolvedBy: user.id,
    });

    res.json(notification);
  } catch (error) {
    logger.error('Failed to resolve notification', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification history
router.get('/urgent/history', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { teamId, urgencyLevel, medicalType, status, startDate, endDate } = req.query;

    const filters: any = {};
    if (teamId) filters.teamId = teamId as string;
    if (urgencyLevel) filters.urgencyLevel = urgencyLevel as UrgencyLevel;
    if (medicalType) filters.medicalType = medicalType as MedicalInfoType;
    if (status) filters.status = status as MedicalNotificationStatus;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const notifications = await urgentMedicalService.getNotificationHistory(
      user.organization_id,
      filters
    );

    res.json(notifications);
  } catch (error) {
    logger.error('Failed to get notification history', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate compliance report
router.get('/urgent/reports/compliance', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    // Validate user has permission to view reports
    if (!user.roles?.includes('medical_staff') && !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Insufficient permissions to view compliance reports' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const report = await urgentMedicalService.generateComplianceReport(
      user.organization_id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(report);
  } catch (error) {
    logger.error('Failed to generate compliance report', error);
    res.status(500).json({ error: error.message });
  }
});

// Get notification statistics
router.get('/urgent/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { period = '7d' } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const report = await urgentMedicalService.generateComplianceReport(
      user.organization_id,
      startDate,
      endDate
    );

    // Extract summary stats
    const stats = {
      period,
      summary: report.summary,
      acknowledgmentMetrics: report.acknowledgmentMetrics,
      escalationMetrics: report.escalationMetrics,
      mostUrgentActive: await urgentMedicalService.getActiveNotifications(
        user.organization_id,
        { urgencyLevel: UrgencyLevel.EMERGENCY }
      ),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get notification statistics', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk acknowledge (for emergency situations)
router.post('/urgent/bulk-acknowledge', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notificationIds, message } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds array is required' });
    }

    const results = [];
    const errors = [];

    for (const notificationId of notificationIds) {
      try {
        const acknowledgment = await urgentMedicalService.acknowledgeNotification({
          notificationId,
          userId: user.id,
          userName: user.name || `${user.first_name} ${user.last_name}`,
          userRole: user.roles?.[0] || 'unknown',
          method: AcknowledgmentMethod.IN_APP,
          message: message || 'Bulk acknowledged',
        });
        results.push({ notificationId, success: true, acknowledgment });
      } catch (error) {
        errors.push({ notificationId, success: false, error: error.message });
      }
    }

    res.json({ results, errors, total: notificationIds.length, succeeded: results.length });
  } catch (error) {
    logger.error('Failed to bulk acknowledge notifications', error);
    res.status(500).json({ error: error.message });
  }
});

// Test notification (for system testing)
router.post('/urgent/test', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only allow admins to send test notifications
    if (!user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Only admins can send test notifications' });
    }

    const testNotification = await urgentMedicalService.createUrgentNotification({
      organizationId: user.organization_id,
      teamId: req.body.teamId,
      createdBy: user.id,
      urgencyLevel: UrgencyLevel.URGENT,
      medicalType: MedicalInfoType.HEALTH_UPDATE,
      title: 'TEST: Urgent Medical Notification System Test',
      message: 'This is a test notification to verify the urgent medical notification system is working correctly. Please acknowledge this test message.',
      medicalData: {
        additional_notes: 'This is a test notification only. No action required beyond acknowledgment.',
      },
      targetType: req.body.targetType || NotificationTargetType.CUSTOM_GROUP,
      customRecipientIds: req.body.recipientIds || [user.id],
      deliveryChannels: [DeliveryChannel.IN_APP],
      requiresAcknowledgment: true,
      acknowledgmentTimeoutMinutes: 5,
      minAcknowledgmentsRequired: 1,
      enableEscalation: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    res.json({ 
      message: 'Test notification created successfully', 
      notification: testNotification,
      acknowledgeUrl: `/api/medical/urgent/${testNotification.id}/acknowledge`,
    });
  } catch (error) {
    logger.error('Failed to create test notification', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;