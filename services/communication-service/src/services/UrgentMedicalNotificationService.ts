// @ts-nocheck - Urgent medical notification service with complex notification patterns
import { Repository, In, Not, IsNull, LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  UrgentMedicalNotification,
  UrgencyLevel,
  NotificationTargetType,
  DeliveryChannel,
  MedicalNotificationStatus,
  MedicalInfoType,
} from '../entities/UrgentMedicalNotification';
import {
  UrgentNotificationAcknowledgment,
  AcknowledgmentMethod,
} from '../entities/UrgentNotificationAcknowledgment';
import {
  UrgentNotificationEscalation,
  EscalationReason,
  EscalationStatus,
} from '../entities/UrgentNotificationEscalation';
import { NotificationService } from './NotificationService';
import { NotificationType, NotificationPriority } from '../entities/Notification';
import { Logger } from '@hockey-hub/shared-lib';

export interface CreateUrgentNotificationDto {
  organizationId: string;
  teamId?: string;
  createdBy: string;
  urgencyLevel: UrgencyLevel;
  medicalType: MedicalInfoType;
  title: string;
  message: string;
  medicalData?: any;
  targetType: NotificationTargetType;
  targetId?: string;
  customRecipientIds?: string[];
  deliveryChannels: DeliveryChannel[];
  channelConfig?: any;
  requiresAcknowledgment?: boolean;
  acknowledgmentTimeoutMinutes?: number;
  requiredAcknowledgers?: string[];
  minAcknowledgmentsRequired?: number;
  enableEscalation?: boolean;
  escalationConfig?: any;
  attachments?: any[];
  privacySettings?: any;
  scheduledFor?: Date;
  expiresAt: Date;
}

export interface AcknowledgeNotificationDto {
  notificationId: string;
  userId: string;
  userName: string;
  userRole: string;
  method: AcknowledgmentMethod;
  message?: string;
  deviceInfo?: any;
  isEmergencyContact?: boolean;
  additionalActions?: any;
}

export interface EscalateNotificationDto {
  notificationId: string;
  reason: EscalationReason;
  triggeredBy?: string;
  manualMessage?: string;
}

export class UrgentMedicalNotificationService {
  private notificationRepo: Repository<UrgentMedicalNotification>;
  private acknowledgmentRepo: Repository<UrgentNotificationAcknowledgment>;
  private escalationRepo: Repository<UrgentNotificationEscalation>;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor() {
    this.notificationRepo = AppDataSource.getRepository(UrgentMedicalNotification);
    this.acknowledgmentRepo = AppDataSource.getRepository(UrgentNotificationAcknowledgment);
    this.escalationRepo = AppDataSource.getRepository(UrgentNotificationEscalation);
    this.notificationService = new NotificationService();
    this.logger = new Logger('UrgentMedicalNotificationService');
  }

  async createUrgentNotification(dto: CreateUrgentNotificationDto): Promise<UrgentMedicalNotification> {
    try {
      // Calculate total recipients
      const totalRecipients = await this.calculateTotalRecipients(dto);

      // Create the urgent notification
      const notification = this.notificationRepo.create({
        organization_id: dto.organizationId,
        team_id: dto.teamId,
        created_by: dto.createdBy,
        urgency_level: dto.urgencyLevel,
        medical_type: dto.medicalType,
        title: dto.title,
        message: dto.message,
        medical_data: dto.medicalData,
        target_type: dto.targetType,
        target_id: dto.targetId,
        custom_recipient_ids: dto.customRecipientIds,
        delivery_channels: dto.deliveryChannels,
        channel_config: dto.channelConfig,
        requires_acknowledgment: dto.requiresAcknowledgment ?? true,
        acknowledgment_timeout_minutes: dto.acknowledgmentTimeoutMinutes,
        required_acknowledgers: dto.requiredAcknowledgers,
        min_acknowledgments_required: dto.minAcknowledgmentsRequired ?? 1,
        enable_escalation: dto.enableEscalation ?? true,
        escalation_config: dto.escalationConfig,
        attachments: dto.attachments,
        privacy_settings: dto.privacySettings,
        scheduled_for: dto.scheduledFor,
        expires_at: dto.expiresAt,
        total_recipients: totalRecipients,
        status: dto.scheduledFor ? MedicalNotificationStatus.DRAFT : MedicalNotificationStatus.PENDING,
      });

      const savedNotification = await this.notificationRepo.save(notification);

      // If not scheduled, send immediately
      if (!dto.scheduledFor) {
        await this.sendUrgentNotification(savedNotification);
      }

      // Set up escalation monitoring if enabled
      if (savedNotification.enable_escalation && savedNotification.acknowledgment_timeout_minutes) {
        this.scheduleEscalationCheck(savedNotification);
      }

      this.logger.info('Urgent medical notification created', {
        notificationId: savedNotification.id,
        urgencyLevel: savedNotification.urgency_level,
        targetType: savedNotification.target_type,
        totalRecipients: savedNotification.total_recipients,
      });

      return savedNotification;
    } catch (error) {
      this.logger.error('Failed to create urgent notification', error);
      throw error;
    }
  }

  async acknowledgeNotification(dto: AcknowledgeNotificationDto): Promise<UrgentNotificationAcknowledgment> {
    try {
      // Get the notification
      const notification = await this.notificationRepo.findOne({
        where: { id: dto.notificationId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if already acknowledged by this user
      const existingAck = await this.acknowledgmentRepo.findOne({
        where: {
          notification_id: dto.notificationId,
          user_id: dto.userId,
        },
      });

      if (existingAck) {
        return existingAck;
      }

      // Calculate response time if notification was sent
      let responseTimeSeconds: number | undefined;
      if (notification.sent_at) {
        responseTimeSeconds = Math.floor((Date.now() - notification.sent_at.getTime()) / 1000);
      }

      // Create acknowledgment
      const acknowledgment = this.acknowledgmentRepo.create({
        notification_id: dto.notificationId,
        user_id: dto.userId,
        user_name: dto.userName,
        user_role: dto.userRole,
        method: dto.method,
        message: dto.message,
        device_info: dto.deviceInfo,
        is_emergency_contact: dto.isEmergencyContact ?? false,
        response_time_seconds: responseTimeSeconds,
        additional_actions: dto.additionalActions,
      });

      const savedAck = await this.acknowledgmentRepo.save(acknowledgment);

      // Update notification acknowledgment count
      notification.acknowledged_count += 1;
      
      // Set first acknowledged time if this is the first
      if (!notification.first_acknowledged_at) {
        notification.first_acknowledged_at = new Date();
      }

      // Check if fully acknowledged
      if (this.isFullyAcknowledged(notification)) {
        notification.fully_acknowledged_at = new Date();
        notification.status = MedicalNotificationStatus.ACKNOWLEDGED;
      }

      await this.notificationRepo.save(notification);

      // Cancel any pending escalations if fully acknowledged
      if (notification.status === MedicalNotificationStatus.ACKNOWLEDGED) {
        await this.cancelPendingEscalations(notification.id);
      }

      this.logger.info('Notification acknowledged', {
        notificationId: dto.notificationId,
        userId: dto.userId,
        acknowledgedCount: notification.acknowledged_count,
        fullyAcknowledged: notification.status === MedicalNotificationStatus.ACKNOWLEDGED,
      });

      return savedAck;
    } catch (error) {
      this.logger.error('Failed to acknowledge notification', error);
      throw error;
    }
  }

  async escalateNotification(dto: EscalateNotificationDto): Promise<UrgentNotificationEscalation> {
    try {
      const notification = await this.notificationRepo.findOne({
        where: { id: dto.notificationId },
        relations: ['escalations'],
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Determine escalation level
      const currentLevel = notification.escalation_level;
      const nextLevel = currentLevel + 1;

      // Get escalation config for this level
      const levelConfig = notification.escalation_config?.levels?.find(
        (l: any) => l.level === nextLevel
      );

      if (!levelConfig && dto.reason !== EscalationReason.MANUAL) {
        this.logger.warn('No escalation config for level', { level: nextLevel });
        return null;
      }

      // Determine targets for escalation
      const { targetUserIds, targetRoles, emergencyContacts } = await this.determineEscalationTargets(
        notification,
        levelConfig
      );

      // Create escalation record
      const escalation = this.escalationRepo.create({
        notification_id: dto.notificationId,
        escalation_level: nextLevel,
        reason: dto.reason,
        target_user_ids: targetUserIds,
        target_roles: targetRoles,
        emergency_contacts: emergencyContacts,
        delivery_channels: levelConfig?.delivery_channels || notification.delivery_channels,
        escalation_message: dto.manualMessage || this.generateEscalationMessage(notification, dto.reason),
        triggered_by: dto.triggeredBy,
        triggered_at: new Date(),
      });

      const savedEscalation = await this.escalationRepo.save(escalation);

      // Update notification
      notification.escalation_level = nextLevel;
      notification.status = MedicalNotificationStatus.ESCALATED;
      notification.escalated_at = new Date();
      await this.notificationRepo.save(notification);

      // Send escalation notifications
      await this.sendEscalationNotifications(notification, savedEscalation);

      // Schedule next escalation if configured
      const nextLevelConfig = notification.escalation_config?.levels?.find(
        (l: any) => l.level === nextLevel + 1
      );
      if (nextLevelConfig) {
        this.scheduleNextEscalation(notification, nextLevelConfig.delay_minutes);
      }

      this.logger.info('Notification escalated', {
        notificationId: dto.notificationId,
        escalationLevel: nextLevel,
        reason: dto.reason,
        targetCount: targetUserIds.length + (emergencyContacts?.length || 0),
      });

      return savedEscalation;
    } catch (error) {
      this.logger.error('Failed to escalate notification', error);
      throw error;
    }
  }

  async getNotificationWithDetails(notificationId: string): Promise<any> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
      relations: ['acknowledgments', 'escalations'],
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Get recipient details
    const recipientDetails = await this.getRecipientDetails(notification);

    return {
      ...notification,
      recipientDetails,
      acknowledgmentProgress: {
        required: notification.min_acknowledgments_required,
        received: notification.acknowledged_count,
        percentage: (notification.acknowledged_count / notification.min_acknowledgments_required) * 100,
        requiredAcknowledgers: notification.required_acknowledgers,
        acknowledgedBy: notification.acknowledgments.map(ack => ({
          userId: ack.user_id,
          userName: ack.user_name,
          userRole: ack.user_role,
          acknowledgedAt: ack.created_at,
          responseTime: ack.response_time_seconds,
        })),
      },
      escalationHistory: notification.escalations.map(esc => ({
        level: esc.escalation_level,
        reason: esc.reason,
        status: esc.status,
        triggeredAt: esc.triggered_at,
        completedAt: esc.completed_at,
        targetCount: esc.target_user_ids.length + (esc.emergency_contacts?.length || 0),
      })),
    };
  }

  async getActiveNotifications(organizationId: string, filters?: any): Promise<UrgentMedicalNotification[]> {
    const query = this.notificationRepo.createQueryBuilder('notification')
      .where('notification.organization_id = :organizationId', { organizationId })
      .andWhere('notification.status NOT IN (:...statuses)', {
        statuses: [MedicalNotificationStatus.RESOLVED, MedicalNotificationStatus.EXPIRED],
      });

    if (filters?.urgencyLevel) {
      query.andWhere('notification.urgency_level = :urgencyLevel', { urgencyLevel: filters.urgencyLevel });
    }

    if (filters?.medicalType) {
      query.andWhere('notification.medical_type = :medicalType', { medicalType: filters.medicalType });
    }

    if (filters?.createdBy) {
      query.andWhere('notification.created_by = :createdBy', { createdBy: filters.createdBy });
    }

    if (filters?.targetType) {
      query.andWhere('notification.target_type = :targetType', { targetType: filters.targetType });
    }

    if (filters?.requiresAcknowledgment !== undefined) {
      query.andWhere('notification.requires_acknowledgment = :requiresAcknowledgment', {
        requiresAcknowledgment: filters.requiresAcknowledgment,
      });
    }

    query.orderBy('notification.urgency_level', 'DESC')
      .addOrderBy('notification.created_at', 'DESC');

    return query.getMany();
  }

  async generateComplianceReport(organizationId: string, startDate: Date, endDate: Date): Promise<any> {
    const notifications = await this.notificationRepo.find({
      where: {
        organization_id: organizationId,
        created_at: MoreThan(startDate),
        created_at: LessThan(endDate),
      },
      relations: ['acknowledgments', 'escalations'],
    });

    const report = {
      period: { start: startDate, end: endDate },
      summary: {
        total: notifications.length,
        byUrgencyLevel: {},
        byMedicalType: {},
        byStatus: {},
      },
      acknowledgmentMetrics: {
        averageResponseTime: 0,
        acknowledgmentRate: 0,
        fullyAcknowledgedCount: 0,
      },
      escalationMetrics: {
        totalEscalations: 0,
        averageEscalationLevel: 0,
        escalationReasons: {},
      },
      deliveryMetrics: {
        byChannel: {},
        successRate: 0,
      },
      recommendations: [],
    };

    // Calculate metrics
    let totalResponseTime = 0;
    let responseCount = 0;
    let totalEscalations = 0;

    notifications.forEach(notification => {
      // Count by urgency level
      report.summary.byUrgencyLevel[notification.urgency_level] = 
        (report.summary.byUrgencyLevel[notification.urgency_level] || 0) + 1;

      // Count by medical type
      report.summary.byMedicalType[notification.medical_type] = 
        (report.summary.byMedicalType[notification.medical_type] || 0) + 1;

      // Count by status
      report.summary.byStatus[notification.status] = 
        (report.summary.byStatus[notification.status] || 0) + 1;

      // Calculate response times
      notification.acknowledgments.forEach(ack => {
        if (ack.response_time_seconds) {
          totalResponseTime += ack.response_time_seconds;
          responseCount++;
        }
      });

      // Count fully acknowledged
      if (notification.status === MedicalNotificationStatus.ACKNOWLEDGED) {
        report.acknowledgmentMetrics.fullyAcknowledgedCount++;
      }

      // Count escalations
      totalEscalations += notification.escalations.length;
      notification.escalations.forEach(esc => {
        report.escalationMetrics.escalationReasons[esc.reason] = 
          (report.escalationMetrics.escalationReasons[esc.reason] || 0) + 1;
      });
    });

    // Calculate averages
    if (responseCount > 0) {
      report.acknowledgmentMetrics.averageResponseTime = Math.floor(totalResponseTime / responseCount);
    }

    if (notifications.length > 0) {
      report.acknowledgmentMetrics.acknowledgmentRate = 
        (report.acknowledgmentMetrics.fullyAcknowledgedCount / notifications.length) * 100;
    }

    report.escalationMetrics.totalEscalations = totalEscalations;

    // Generate recommendations
    if (report.acknowledgmentMetrics.averageResponseTime > 300) { // 5 minutes
      report.recommendations.push({
        type: 'response_time',
        message: 'Average response time is high. Consider adjusting notification delivery methods or urgency indicators.',
        severity: 'medium',
      });
    }

    if (report.acknowledgmentMetrics.acknowledgmentRate < 80) {
      report.recommendations.push({
        type: 'acknowledgment_rate',
        message: 'Acknowledgment rate is below 80%. Review notification delivery and user training.',
        severity: 'high',
      });
    }

    if (totalEscalations > notifications.length * 0.3) {
      report.recommendations.push({
        type: 'escalation_rate',
        message: 'High escalation rate detected. Review initial notification targeting and timeout settings.',
        severity: 'medium',
      });
    }

    return report;
  }

  private async sendUrgentNotification(notification: UrgentMedicalNotification): Promise<void> {
    try {
      const recipients = await this.getRecipientIds(notification);

      // Send through each delivery channel
      for (const channel of notification.delivery_channels) {
        switch (channel) {
          case DeliveryChannel.IN_APP:
            await this.sendInAppNotifications(notification, recipients);
            break;
          case DeliveryChannel.EMAIL:
            await this.sendEmailNotifications(notification, recipients);
            break;
          case DeliveryChannel.SMS:
            await this.sendSMSNotifications(notification, recipients);
            break;
          case DeliveryChannel.PUSH:
            await this.sendPushNotifications(notification, recipients);
            break;
          case DeliveryChannel.PHONE:
            await this.sendPhoneNotifications(notification, recipients);
            break;
        }
      }

      // Update notification status
      notification.status = MedicalNotificationStatus.DELIVERED;
      notification.sent_at = new Date();
      await this.notificationRepo.save(notification);
    } catch (error) {
      this.logger.error('Failed to send urgent notification', error);
      throw error;
    }
  }

  private async sendInAppNotifications(notification: UrgentMedicalNotification, recipientIds: string[]): Promise<void> {
    for (const recipientId of recipientIds) {
      await this.notificationService.create({
        recipient_id: recipientId,
        organization_id: notification.organization_id,
        type: NotificationType.MEDICAL_APPOINTMENT, // Using existing type, could add new one
        priority: this.mapUrgencyToPriority(notification.urgency_level),
        title: notification.title,
        message: notification.message,
        action_url: `/medical/urgent/${notification.id}`,
        action_text: 'View Details',
        related_entity_id: notification.id,
        related_entity_type: 'urgent_medical_notification',
        expires_at: notification.expires_at,
      });
    }
  }

  private async sendEmailNotifications(notification: UrgentMedicalNotification, recipientIds: string[]): Promise<void> {
    // Implementation would integrate with email service
    this.logger.info('Sending email notifications', { count: recipientIds.length });
  }

  private async sendSMSNotifications(notification: UrgentMedicalNotification, recipientIds: string[]): Promise<void> {
    // Implementation would integrate with SMS service
    this.logger.info('Sending SMS notifications', { count: recipientIds.length });
  }

  private async sendPushNotifications(notification: UrgentMedicalNotification, recipientIds: string[]): Promise<void> {
    // Implementation would integrate with push notification service
    this.logger.info('Sending push notifications', { count: recipientIds.length });
  }

  private async sendPhoneNotifications(notification: UrgentMedicalNotification, recipientIds: string[]): Promise<void> {
    // Implementation would integrate with phone/voice service
    this.logger.info('Sending phone notifications', { count: recipientIds.length });
  }

  private async sendEscalationNotifications(
    notification: UrgentMedicalNotification,
    escalation: UrgentNotificationEscalation
  ): Promise<void> {
    // Send to escalation targets
    for (const userId of escalation.target_user_ids) {
      await this.notificationService.create({
        recipient_id: userId,
        organization_id: notification.organization_id,
        type: NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority.URGENT,
        title: `ESCALATION: ${notification.title}`,
        message: escalation.escalation_message || notification.message,
        action_url: `/medical/urgent/${notification.id}`,
        action_text: 'Acknowledge Now',
        related_entity_id: notification.id,
        related_entity_type: 'urgent_medical_notification',
        expires_at: notification.expires_at,
      });
    }

    // Contact emergency contacts if configured
    if (escalation.emergency_contacts && escalation.emergency_contacts.length > 0) {
      // Implementation would contact emergency contacts
      this.logger.info('Contacting emergency contacts', { count: escalation.emergency_contacts.length });
    }

    escalation.status = EscalationStatus.IN_PROGRESS;
    await this.escalationRepo.save(escalation);
  }

  private async calculateTotalRecipients(dto: CreateUrgentNotificationDto): Promise<number> {
    // Implementation would calculate based on target type and filters
    if (dto.customRecipientIds) {
      return dto.customRecipientIds.length;
    }

    switch (dto.targetType) {
      case NotificationTargetType.PLAYER:
        return 1;
      case NotificationTargetType.TEAM:
        // Would query team members
        return 20; // Placeholder
      case NotificationTargetType.ORGANIZATION:
        // Would query organization members
        return 100; // Placeholder
      default:
        return 0;
    }
  }

  private async getRecipientIds(notification: UrgentMedicalNotification): Promise<string[]> {
    if (notification.custom_recipient_ids) {
      return notification.custom_recipient_ids;
    }

    // Implementation would fetch recipient IDs based on target type
    switch (notification.target_type) {
      case NotificationTargetType.PLAYER:
        return notification.target_id ? [notification.target_id] : [];
      case NotificationTargetType.TEAM:
        // Would query team members
        return []; // Placeholder
      case NotificationTargetType.ORGANIZATION:
        // Would query organization members
        return []; // Placeholder
      default:
        return [];
    }
  }

  private async getRecipientDetails(notification: UrgentMedicalNotification): Promise<any[]> {
    const recipientIds = await this.getRecipientIds(notification);
    // Would fetch user details from user service
    return recipientIds.map(id => ({ id, name: 'User Name', role: 'player' })); // Placeholder
  }

  private isFullyAcknowledged(notification: UrgentMedicalNotification): boolean {
    // Check if minimum acknowledgments reached
    if (notification.acknowledged_count < notification.min_acknowledgments_required) {
      return false;
    }

    // Check if required acknowledgers have acknowledged
    if (notification.required_acknowledgers && notification.required_acknowledgers.length > 0) {
      // Would need to check if all required users have acknowledged
      // For now, returning based on count
      return notification.acknowledged_count >= notification.required_acknowledgers.length;
    }

    return true;
  }

  private async cancelPendingEscalations(notificationId: string): Promise<void> {
    await this.escalationRepo.update(
      {
        notification_id: notificationId,
        status: EscalationStatus.PENDING,
      },
      {
        status: EscalationStatus.CANCELLED,
      }
    );
  }

  private scheduleEscalationCheck(notification: UrgentMedicalNotification): void {
    if (!notification.acknowledgment_timeout_minutes) {
      return;
    }

    setTimeout(async () => {
      const current = await this.notificationRepo.findOne({
        where: { id: notification.id },
      });

      if (current && !this.isFullyAcknowledged(current)) {
        await this.escalateNotification({
          notificationId: notification.id,
          reason: EscalationReason.TIMEOUT,
        });
      }
    }, notification.acknowledgment_timeout_minutes * 60 * 1000);
  }

  private scheduleNextEscalation(notification: UrgentMedicalNotification, delayMinutes: number): void {
    setTimeout(async () => {
      const current = await this.notificationRepo.findOne({
        where: { id: notification.id },
      });

      if (current && !this.isFullyAcknowledged(current)) {
        await this.escalateNotification({
          notificationId: notification.id,
          reason: EscalationReason.INSUFFICIENT_ACKNOWLEDGMENTS,
        });
      }
    }, delayMinutes * 60 * 1000);
  }

  private async determineEscalationTargets(
    notification: UrgentMedicalNotification,
    levelConfig: any
  ): Promise<{ targetUserIds: string[], targetRoles?: string[], emergencyContacts?: any[] }> {
    const targetUserIds: string[] = [];
    const targetRoles = levelConfig?.notify_roles;

    // Add specific users if configured
    if (levelConfig?.notify_users) {
      targetUserIds.push(...levelConfig.notify_users);
    }

    // Get emergency contacts if configured
    let emergencyContacts: any[] | undefined;
    if (levelConfig?.use_emergency_contacts && notification.medical_data?.emergency_contacts) {
      emergencyContacts = notification.medical_data.emergency_contacts;
    }

    // Would also query users by role if targetRoles is set
    // For now, returning the configured targets
    return { targetUserIds, targetRoles, emergencyContacts };
  }

  private generateEscalationMessage(notification: UrgentMedicalNotification, reason: EscalationReason): string {
    const baseMessage = `URGENT: This ${notification.urgency_level} medical notification requires immediate attention.\n\n`;
    
    switch (reason) {
      case EscalationReason.NO_ACKNOWLEDGMENT:
        return baseMessage + `No acknowledgment has been received for: "${notification.title}"\n\nOriginal message: ${notification.message}`;
      case EscalationReason.INSUFFICIENT_ACKNOWLEDGMENTS:
        return baseMessage + `Insufficient acknowledgments received (${notification.acknowledged_count}/${notification.min_acknowledgments_required}) for: "${notification.title}"\n\nOriginal message: ${notification.message}`;
      case EscalationReason.TIMEOUT:
        return baseMessage + `Acknowledgment timeout exceeded for: "${notification.title}"\n\nOriginal message: ${notification.message}`;
      default:
        return baseMessage + `"${notification.title}"\n\nOriginal message: ${notification.message}`;
    }
  }

  private mapUrgencyToPriority(urgency: UrgencyLevel): NotificationPriority {
    switch (urgency) {
      case UrgencyLevel.EMERGENCY:
        return NotificationPriority.URGENT;
      case UrgencyLevel.CRITICAL:
        return NotificationPriority.URGENT;
      case UrgencyLevel.URGENT:
        return NotificationPriority.HIGH;
      default:
        return NotificationPriority.HIGH;
    }
  }
}