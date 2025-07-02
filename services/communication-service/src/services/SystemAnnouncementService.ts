import { Repository, In, Not, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  SystemAnnouncement,
  SystemAnnouncementPriority,
  SystemAnnouncementStatus,
  SystemAnnouncementType,
  SystemAnnouncementRecipient,
  SystemRecipientStatus,
} from '../entities';
import { NotificationService } from './NotificationService';
import { Logger } from '@hockey-hub/shared-lib';
import { ServiceClient } from '@hockey-hub/shared-lib';

const logger = new Logger('SystemAnnouncementService');

export interface CreateSystemAnnouncementDto {
  adminId: string;
  title: string;
  content: string;
  priority?: SystemAnnouncementPriority;
  type?: SystemAnnouncementType;
  scheduledAt?: Date;
  expiresAt?: Date;
  targetOrganizations?: string[];
  targetRoles?: string[];
  excludedRoles?: string[];
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: {
    show_banner?: boolean;
    require_acknowledgment?: boolean;
    banner_color?: string;
    banner_icon?: string;
    notification_channels?: string[];
    [key: string]: any;
  };
}

export interface UpdateSystemAnnouncementDto {
  title?: string;
  content?: string;
  priority?: SystemAnnouncementPriority;
  type?: SystemAnnouncementType;
  scheduledAt?: Date;
  expiresAt?: Date;
  targetOrganizations?: string[];
  targetRoles?: string[];
  excludedRoles?: string[];
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SystemAnnouncementFilters {
  adminId?: string;
  status?: SystemAnnouncementStatus | SystemAnnouncementStatus[];
  priority?: SystemAnnouncementPriority | SystemAnnouncementPriority[];
  type?: SystemAnnouncementType | SystemAnnouncementType[];
  startDate?: Date;
  endDate?: Date;
  includeExpired?: boolean;
}

export class SystemAnnouncementService {
  private announcementRepository: Repository<SystemAnnouncement>;
  private recipientRepository: Repository<SystemAnnouncementRecipient>;
  private notificationService: NotificationService;
  private userServiceClient: ServiceClient;

  constructor() {
    this.announcementRepository = AppDataSource.getRepository(SystemAnnouncement);
    this.recipientRepository = AppDataSource.getRepository(SystemAnnouncementRecipient);
    this.notificationService = new NotificationService();
    this.userServiceClient = new ServiceClient('user-service');
  }

  async createSystemAnnouncement(data: CreateSystemAnnouncementDto): Promise<SystemAnnouncement> {
    try {
      // Validate admin has permission to send system announcements
      const admin = await this.userServiceClient.get(`/api/users/${data.adminId}`);
      if (!admin.data.roles.includes('admin')) {
        throw new Error('Only administrators can send system announcements');
      }

      // Create system announcement
      const announcement = this.announcementRepository.create({
        admin_id: data.adminId,
        title: data.title,
        content: data.content,
        priority: data.priority || SystemAnnouncementPriority.INFO,
        type: data.type || SystemAnnouncementType.GENERAL,
        scheduled_at: data.scheduledAt,
        expires_at: data.expiresAt,
        target_organizations: data.targetOrganizations,
        target_roles: data.targetRoles,
        excluded_roles: data.excludedRoles,
        attachments: data.attachments,
        metadata: data.metadata,
        status: data.scheduledAt ? SystemAnnouncementStatus.SCHEDULED : SystemAnnouncementStatus.DRAFT,
        created_by: data.adminId,
      });

      await this.announcementRepository.save(announcement);

      // Get recipients
      const recipients = await this.getRecipients(announcement);
      announcement.total_recipients = recipients.length;
      await this.announcementRepository.save(announcement);

      // Create recipient records
      const recipientRecords = recipients.map((userId) => ({
        system_announcement_id: announcement.id,
        user_id: userId,
        status: SystemRecipientStatus.PENDING,
      }));

      if (recipientRecords.length > 0) {
        await this.recipientRepository.save(recipientRecords);
      }

      // Send immediately if not scheduled
      if (!data.scheduledAt) {
        await this.sendSystemAnnouncement(announcement.id);
      }

      return this.getSystemAnnouncementById(announcement.id);
    } catch (error) {
      logger.error('Failed to create system announcement', error);
      throw error;
    }
  }

  async updateSystemAnnouncement(
    announcementId: string,
    data: UpdateSystemAnnouncementDto,
    userId: string
  ): Promise<SystemAnnouncement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('System announcement not found');
    }

    if (announcement.admin_id !== userId) {
      throw new Error('Unauthorized to update this system announcement');
    }

    if (announcement.status !== SystemAnnouncementStatus.DRAFT && 
        announcement.status !== SystemAnnouncementStatus.SCHEDULED) {
      throw new Error('Cannot update system announcement after sending');
    }

    // Update announcement
    Object.assign(announcement, data);
    announcement.updated_by = userId;

    if (data.targetOrganizations || data.targetRoles || data.excludedRoles) {
      // Recalculate recipients
      const recipients = await this.getRecipients(announcement);
      announcement.total_recipients = recipients.length;

      // Update recipient records
      await this.recipientRepository.delete({ system_announcement_id: announcementId });
      if (recipients.length > 0) {
        const recipientRecords = recipients.map((userId) => ({
          system_announcement_id: announcement.id,
          user_id: userId,
          status: SystemRecipientStatus.PENDING,
        }));
        await this.recipientRepository.save(recipientRecords);
      }
    }

    await this.announcementRepository.save(announcement);
    return this.getSystemAnnouncementById(announcement.id);
  }

  async sendSystemAnnouncement(announcementId: string): Promise<void> {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
      relations: ['recipients'],
    });

    if (!announcement) {
      throw new Error('System announcement not found');
    }

    if (announcement.status === SystemAnnouncementStatus.SENT) {
      throw new Error('System announcement already sent');
    }

    try {
      announcement.status = SystemAnnouncementStatus.SENDING;
      await this.announcementRepository.save(announcement);

      // Get recipients
      const recipients = await this.recipientRepository.find({
        where: { system_announcement_id: announcementId },
      });

      // Send notifications to all recipients
      const notificationPromises = recipients.map(async (recipient) => {
        try {
          const priorityEmoji = {
            [SystemAnnouncementPriority.INFO]: 'ℹ️',
            [SystemAnnouncementPriority.WARNING]: '⚠️',
            [SystemAnnouncementPriority.CRITICAL]: '🚨',
          };

          await this.notificationService.sendNotification({
            userId: recipient.user_id,
            type: 'system_announcement',
            title: `${priorityEmoji[announcement.priority]} ${announcement.title}`,
            body: announcement.content.substring(0, 150) + (announcement.content.length > 150 ? '...' : ''),
            data: {
              systemAnnouncementId: announcement.id,
              priority: announcement.priority,
              type: announcement.type,
              showBanner: announcement.metadata?.show_banner,
              requireAcknowledgment: announcement.metadata?.require_acknowledgment,
            },
            channels: announcement.metadata?.notification_channels || ['push', 'in_app'],
          });

          recipient.status = SystemRecipientStatus.DELIVERED;
          recipient.delivered_at = new Date();
          recipient.notification_channels = announcement.metadata?.notification_channels || ['push', 'in_app'];
        } catch (error) {
          logger.error(`Failed to send notification to ${recipient.user_id}`, error);
          recipient.status = SystemRecipientStatus.FAILED;
          recipient.failure_reason = error.message;
          recipient.retry_count++;
        }

        return recipient;
      });

      const updatedRecipients = await Promise.all(notificationPromises);
      if (updatedRecipients.length > 0) {
        await this.recipientRepository.save(updatedRecipients);
      }

      // Update announcement statistics
      const deliveredCount = updatedRecipients.filter(
        (r) => r.status === SystemRecipientStatus.DELIVERED
      ).length;

      announcement.status = SystemAnnouncementStatus.SENT;
      announcement.sent_at = new Date();
      announcement.delivered_count = deliveredCount;
      await this.announcementRepository.save(announcement);

      // Emit socket event for real-time updates
      const io = global.io;
      if (io) {
        recipients.forEach((recipient) => {
          io.to(`user:${recipient.user_id}`).emit('system_announcement:new', {
            announcement: {
              id: announcement.id,
              title: announcement.title,
              content: announcement.content,
              priority: announcement.priority,
              type: announcement.type,
              admin_id: announcement.admin_id,
              sent_at: announcement.sent_at,
              expires_at: announcement.expires_at,
              attachments: announcement.attachments,
              metadata: announcement.metadata,
            },
          });
        });
      }
    } catch (error) {
      logger.error('Failed to send system announcement', error);
      announcement.status = SystemAnnouncementStatus.FAILED;
      announcement.error_message = error.message;
      announcement.retry_count++;
      await this.announcementRepository.save(announcement);
      throw error;
    }
  }

  async acknowledgeSystemAnnouncement(
    announcementId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    const recipient = await this.recipientRepository.findOne({
      where: { system_announcement_id: announcementId, user_id: userId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    recipient.status = SystemRecipientStatus.ACKNOWLEDGED;
    recipient.acknowledged_at = new Date();
    recipient.acknowledgment_note = note;
    await this.recipientRepository.save(recipient);

    // Update announcement statistics
    const acknowledgedCount = await this.recipientRepository.count({
      where: { system_announcement_id: announcementId, status: SystemRecipientStatus.ACKNOWLEDGED },
    });

    await this.announcementRepository.update(announcementId, {
      acknowledged_count: acknowledgedCount,
    });
  }

  async dismissSystemAnnouncement(
    announcementId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const recipient = await this.recipientRepository.findOne({
      where: { system_announcement_id: announcementId, user_id: userId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    recipient.status = SystemRecipientStatus.DISMISSED;
    recipient.dismissed_at = new Date();
    recipient.dismissal_reason = reason;
    await this.recipientRepository.save(recipient);

    // Update announcement statistics
    const dismissedCount = await this.recipientRepository.count({
      where: { system_announcement_id: announcementId, status: SystemRecipientStatus.DISMISSED },
    });

    await this.announcementRepository.update(announcementId, {
      dismissed_count: dismissedCount,
    });
  }

  async markSystemAnnouncementAsRead(announcementId: string, userId: string): Promise<void> {
    const recipient = await this.recipientRepository.findOne({
      where: { system_announcement_id: announcementId, user_id: userId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    if (recipient.status === SystemRecipientStatus.PENDING || 
        recipient.status === SystemRecipientStatus.DELIVERED) {
      recipient.status = SystemRecipientStatus.READ;
      recipient.read_at = new Date();
      await this.recipientRepository.save(recipient);

      // Update announcement statistics
      const readCount = await this.recipientRepository.count({
        where: { 
          system_announcement_id: announcementId, 
          status: In([SystemRecipientStatus.READ, SystemRecipientStatus.ACKNOWLEDGED]),
        },
      });

      await this.announcementRepository.update(announcementId, {
        read_count: readCount,
      });
    }
  }

  async getSystemAnnouncementById(announcementId: string): Promise<SystemAnnouncement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('System announcement not found');
    }

    // Fetch admin details
    try {
      const admin = await this.userServiceClient.get(`/api/users/${announcement.admin_id}`);
      announcement.admin = admin.data;
    } catch (error) {
      logger.error('Failed to fetch admin details', error);
    }

    return announcement;
  }

  async getSystemAnnouncements(filters: SystemAnnouncementFilters): Promise<{
    announcements: SystemAnnouncement[];
    total: number;
  }> {
    const query = this.announcementRepository.createQueryBuilder('announcement');

    if (filters.adminId) {
      query.andWhere('announcement.admin_id = :adminId', { adminId: filters.adminId });
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.andWhere('announcement.status IN (:...statuses)', { statuses: filters.status });
      } else {
        query.andWhere('announcement.status = :status', { status: filters.status });
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        query.andWhere('announcement.priority IN (:...priorities)', { priorities: filters.priority });
      } else {
        query.andWhere('announcement.priority = :priority', { priority: filters.priority });
      }
    }

    if (filters.type) {
      if (Array.isArray(filters.type)) {
        query.andWhere('announcement.type IN (:...types)', { types: filters.type });
      } else {
        query.andWhere('announcement.type = :type', { type: filters.type });
      }
    }

    if (filters.startDate) {
      query.andWhere('announcement.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('announcement.created_at <= :endDate', { endDate: filters.endDate });
    }

    if (!filters.includeExpired) {
      query.andWhere('(announcement.expires_at IS NULL OR announcement.expires_at > :now)', { now: new Date() });
    }

    query.orderBy('announcement.created_at', 'DESC');

    const [announcements, total] = await query.getManyAndCount();

    return { announcements, total };
  }

  async getUserSystemAnnouncements(userId: string): Promise<{
    announcements: Array<{
      announcement: SystemAnnouncement;
      recipientStatus: SystemRecipientStatus;
      readAt?: Date;
      acknowledgedAt?: Date;
      dismissedAt?: Date;
    }>;
    unreadCount: number;
    unacknowledgedCount: number;
  }> {
    const recipients = await this.recipientRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    const announcements = await Promise.all(
      recipients.map(async (recipient) => {
        const announcement = await this.getSystemAnnouncementById(recipient.system_announcement_id);
        return {
          announcement,
          recipientStatus: recipient.status,
          readAt: recipient.read_at,
          acknowledgedAt: recipient.acknowledged_at,
          dismissedAt: recipient.dismissed_at,
        };
      })
    );

    const unreadCount = recipients.filter(
      (r) => r.status === SystemRecipientStatus.PENDING || r.status === SystemRecipientStatus.DELIVERED
    ).length;

    const unacknowledgedCount = recipients.filter((r) => {
      const requiresAck = announcements.find(a => a.announcement.id === r.system_announcement_id)
        ?.announcement.metadata?.require_acknowledgment;
      return requiresAck && r.status !== SystemRecipientStatus.ACKNOWLEDGED;
    }).length;

    return { announcements, unreadCount, unacknowledgedCount };
  }

  async cancelSystemAnnouncement(announcementId: string, userId: string): Promise<void> {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('System announcement not found');
    }

    if (announcement.admin_id !== userId) {
      throw new Error('Unauthorized to cancel this system announcement');
    }

    if (announcement.status !== SystemAnnouncementStatus.SCHEDULED) {
      throw new Error('Can only cancel scheduled system announcements');
    }

    announcement.status = SystemAnnouncementStatus.CANCELLED;
    announcement.updated_by = userId;
    await this.announcementRepository.save(announcement);
  }

  async deleteSystemAnnouncement(announcementId: string, userId: string): Promise<void> {
    const announcement = await this.announcementRepository.findOne({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new Error('System announcement not found');
    }

    if (announcement.admin_id !== userId) {
      throw new Error('Unauthorized to delete this system announcement');
    }

    if (announcement.status !== SystemAnnouncementStatus.DRAFT) {
      throw new Error('Can only delete draft system announcements');
    }

    await this.announcementRepository.softRemove(announcement);
  }

  private async getRecipients(announcement: SystemAnnouncement): Promise<string[]> {
    let recipients: string[] = [];

    try {
      // Get all users from user service
      const params: any = {};
      
      if (announcement.target_organizations && announcement.target_organizations.length > 0) {
        params.organizationIds = announcement.target_organizations;
      }
      
      if (announcement.target_roles && announcement.target_roles.length > 0) {
        params.roles = announcement.target_roles;
      }

      const allUsers = await this.userServiceClient.get('/api/users', { params });
      recipients = allUsers.data.map((user: any) => user.id);

      // Exclude specific roles if specified
      if (announcement.excluded_roles && announcement.excluded_roles.length > 0) {
        const excludedUsers = await this.userServiceClient.get('/api/users', {
          params: { roles: announcement.excluded_roles }
        });
        const excludedIds = new Set(excludedUsers.data.map((user: any) => user.id));
        recipients = recipients.filter(id => !excludedIds.has(id));
      }
    } catch (error) {
      logger.error('Failed to get recipients for system announcement', error);
      throw new Error('Failed to determine announcement recipients');
    }

    // Remove duplicates
    return [...new Set(recipients)];
  }

  async processScheduledSystemAnnouncements(): Promise<void> {
    const now = new Date();
    const scheduledAnnouncements = await this.announcementRepository.find({
      where: {
        status: SystemAnnouncementStatus.SCHEDULED,
        scheduled_at: Not(IsNull()),
      },
    });

    for (const announcement of scheduledAnnouncements) {
      if (announcement.scheduled_at <= now) {
        try {
          await this.sendSystemAnnouncement(announcement.id);
        } catch (error) {
          logger.error(`Failed to send scheduled system announcement ${announcement.id}`, error);
        }
      }
    }

    // Mark expired announcements
    await this.markExpiredAnnouncements();
  }

  async markExpiredAnnouncements(): Promise<void> {
    const now = new Date();
    await this.announcementRepository.update(
      {
        status: In([SystemAnnouncementStatus.SENT]),
        expires_at: Not(IsNull()),
      },
      {
        status: SystemAnnouncementStatus.EXPIRED,
      }
    );
  }

  async getRecipientStats(announcementId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    read: number;
    acknowledged: number;
    dismissed: number;
    failed: number;
  }> {
    const stats = await this.recipientRepository
      .createQueryBuilder('recipient')
      .select('recipient.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('recipient.system_announcement_id = :announcementId', { announcementId })
      .groupBy('recipient.status')
      .getRawMany();

    const result = {
      total: 0,
      pending: 0,
      delivered: 0,
      read: 0,
      acknowledged: 0,
      dismissed: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      result[stat.status] = parseInt(stat.count);
      result.total += parseInt(stat.count);
    });

    return result;
  }
}