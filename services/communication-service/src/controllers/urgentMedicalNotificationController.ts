import { Request, Response } from 'express';
import { 
  UrgentMedicalNotificationService,
  CreateUrgentNotificationDto,
  AcknowledgeNotificationDto,
  EscalateNotificationDto,
} from '../services/UrgentMedicalNotificationService';
import { 
  UrgencyLevel,
  NotificationTargetType,
  DeliveryChannel,
  MedicalInfoType,
} from '../entities/UrgentMedicalNotification';
import { AcknowledgmentMethod } from '../entities/UrgentNotificationAcknowledgment';
import { EscalationReason } from '../entities/UrgentNotificationEscalation';
import { Logger } from '@hockey-hub/shared-lib';

const urgentNotificationService = new UrgentMedicalNotificationService();
const logger = new Logger('UrgentMedicalNotificationController');

export const createUrgentNotification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Verify user is medical staff
    if (!user.roles?.includes('medical_staff')) {
      return res.status(403).json({
        success: false,
        error: 'Only medical staff can create urgent medical notifications',
      });
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
    if (!urgencyLevel || !medicalType || !title || !message || !targetType || !deliveryChannels) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const dto: CreateUrgentNotificationDto = {
      organizationId: user.organizationId,
      teamId: user.teamId,
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
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt,
    };

    const notification = await urgentNotificationService.createUrgentNotification(dto);

    logger.info('Urgent medical notification created', {
      notificationId: notification.id,
      userId: user.id,
      urgencyLevel: notification.urgency_level,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Failed to create urgent notification', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create urgent notification',
    });
  }
};

export const acknowledgeNotification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notificationId } = req.params;
    const { method, message, deviceInfo, additionalActions } = req.body;

    if (!method) {
      return res.status(400).json({
        success: false,
        error: 'Acknowledgment method is required',
      });
    }

    const dto: AcknowledgeNotificationDto = {
      notificationId,
      userId: user.id,
      userName: user.name || `${user.firstName} ${user.lastName}`,
      userRole: user.roles?.[0] || 'user',
      method,
      message,
      deviceInfo: {
        ...deviceInfo,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      },
      additionalActions,
    };

    const acknowledgment = await urgentNotificationService.acknowledgeNotification(dto);

    logger.info('Notification acknowledged', {
      notificationId,
      userId: user.id,
      method,
    });

    res.json({
      success: true,
      data: acknowledgment,
    });
  } catch (error) {
    logger.error('Failed to acknowledge notification', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge notification',
    });
  }
};

export const escalateNotification = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notificationId } = req.params;
    const { reason, manualMessage } = req.body;

    // Verify user is medical staff or system admin
    if (!user.roles?.includes('medical_staff') && !user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to escalate notifications',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Escalation reason is required',
      });
    }

    const dto: EscalateNotificationDto = {
      notificationId,
      reason,
      triggeredBy: user.id,
      manualMessage,
    };

    const escalation = await urgentNotificationService.escalateNotification(dto);

    logger.info('Notification escalated', {
      notificationId,
      userId: user.id,
      reason,
    });

    res.json({
      success: true,
      data: escalation,
    });
  } catch (error) {
    logger.error('Failed to escalate notification', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate notification',
    });
  }
};

export const getNotificationDetails = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notificationId } = req.params;

    const notification = await urgentNotificationService.getNotificationWithDetails(notificationId);

    // Check if user has access to this notification
    // This would be more complex in production, checking privacy settings, roles, etc.
    if (notification.organization_id !== user.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Failed to get notification details', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification details',
    });
  }
};

export const getActiveNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { 
      urgencyLevel,
      medicalType,
      targetType,
      requiresAcknowledgment,
      createdBy,
    } = req.query;

    const filters: any = {};
    if (urgencyLevel) filters.urgencyLevel = urgencyLevel;
    if (medicalType) filters.medicalType = medicalType;
    if (targetType) filters.targetType = targetType;
    if (requiresAcknowledgment !== undefined) {
      filters.requiresAcknowledgment = requiresAcknowledgment === 'true';
    }
    if (createdBy) filters.createdBy = createdBy;

    const notifications = await urgentNotificationService.getActiveNotifications(
      user.organizationId,
      filters
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    logger.error('Failed to get active notifications', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active notifications',
    });
  }
};

export const generateComplianceReport = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    // Verify user is medical staff or admin
    if (!user.roles?.includes('medical_staff') && !user.roles?.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to generate compliance reports',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const report = await urgentNotificationService.generateComplianceReport(
      user.organizationId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Failed to generate compliance report', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
    });
  }
};

export const updateNotificationStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notificationId } = req.params;
    const { status, resolutionNotes } = req.body;

    // Verify user is medical staff
    if (!user.roles?.includes('medical_staff')) {
      return res.status(403).json({
        success: false,
        error: 'Only medical staff can update notification status',
      });
    }

    // This would be implemented in the service
    // For now, returning success
    res.json({
      success: true,
      message: 'Status update functionality to be implemented',
    });
  } catch (error) {
    logger.error('Failed to update notification status', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification status',
    });
  }
};

// Enum endpoints for frontend
export const getUrgencyLevels = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(UrgencyLevel),
  });
};

export const getMedicalTypes = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(MedicalInfoType),
  });
};

export const getTargetTypes = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(NotificationTargetType),
  });
};

export const getDeliveryChannels = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(DeliveryChannel),
  });
};

export const getAcknowledgmentMethods = (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(AcknowledgmentMethod),
  });
};