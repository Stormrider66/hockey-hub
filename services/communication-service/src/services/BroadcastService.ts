// @ts-nocheck - Broadcast service with complex entity relationships
import { Repository, In, Not, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  Broadcast,
  BroadcastPriority,
  BroadcastStatus,
  BroadcastTargetType,
  BroadcastRecipient,
  RecipientStatus,
  Message,
  MessageType,
  Conversation,
  ConversationType,
  ConversationParticipant,
  ParticipantRole,
} from '../entities';
import { NotificationService } from './NotificationService';
import { MessageService } from './MessageService';
import { ConversationService } from './ConversationService';
import { Logger } from '@hockey-hub/shared-lib';
import { ServiceClient } from '@hockey-hub/shared-lib';

const logger = new Logger('BroadcastService');

export interface CreateBroadcastDto {
  coachId: string;
  teamId: string;
  organizationId: string;
  title: string;
  content: string;
  priority?: BroadcastPriority;
  targetType?: BroadcastTargetType;
  targetUserIds?: string[];
  targetRoles?: string[];
  scheduledAt?: Date;
  expiresAt?: Date;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: {
    require_acknowledgment?: boolean;
    allow_replies?: boolean;
    pin_duration_hours?: number;
    notification_channels?: string[];
    [key: string]: any;
  };
}

export interface UpdateBroadcastDto {
  title?: string;
  content?: string;
  priority?: BroadcastPriority;
  targetType?: BroadcastTargetType;
  targetUserIds?: string[];
  targetRoles?: string[];
  scheduledAt?: Date;
  expiresAt?: Date;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: Record<string, any>;
}

export interface BroadcastFilters {
  coachId?: string;
  teamId?: string;
  status?: BroadcastStatus | BroadcastStatus[];
  priority?: BroadcastPriority | BroadcastPriority[];
  startDate?: Date;
  endDate?: Date;
}

export class BroadcastService {
  private broadcastRepository: Repository<Broadcast>;
  private recipientRepository: Repository<BroadcastRecipient>;
  private messageRepository: Repository<Message>;
  private conversationRepository: Repository<Conversation>;
  private participantRepository: Repository<ConversationParticipant>;
  private notificationService: NotificationService;
  private messageService: MessageService;
  private conversationService: ConversationService;
  private userServiceClient: ServiceClient;

  constructor() {
    this.broadcastRepository = AppDataSource.getRepository(Broadcast);
    this.recipientRepository = AppDataSource.getRepository(BroadcastRecipient);
    this.messageRepository = AppDataSource.getRepository(Message);
    this.conversationRepository = AppDataSource.getRepository(Conversation);
    this.participantRepository = AppDataSource.getRepository(ConversationParticipant);
    this.notificationService = new NotificationService(AppDataSource as any);
    this.messageService = new MessageService();
    this.conversationService = new ConversationService();
    this.userServiceClient = new ServiceClient('user-service');
  }

  async createBroadcast(data: CreateBroadcastDto): Promise<Broadcast> {
    try {
      // Validate coach has permission to send broadcasts
      const coach = await this.userServiceClient.get(`/api/users/${data.coachId}`);
      if (!coach.data.roles.includes('coach')) {
        throw new Error('Only coaches can send broadcasts');
      }

      // Create broadcast
      const broadcast = this.broadcastRepository.create({
        coach_id: data.coachId,
        team_id: data.teamId,
        organization_id: data.organizationId,
        title: data.title,
        content: data.content,
        priority: data.priority || BroadcastPriority.NORMAL,
        target_type: data.targetType || BroadcastTargetType.TEAM,
        target_user_ids: data.targetUserIds,
        target_roles: data.targetRoles,
        scheduled_at: data.scheduledAt,
        expires_at: data.expiresAt,
        attachments: data.attachments,
        metadata: data.metadata,
        status: data.scheduledAt ? BroadcastStatus.SCHEDULED : BroadcastStatus.DRAFT,
        created_by: data.coachId,
      });

      await this.broadcastRepository.save(broadcast);

      // Get recipients
      const recipients = await this.getRecipients(broadcast);
      broadcast.total_recipients = recipients.length;
      await this.broadcastRepository.save(broadcast);

      // Create recipient records
      const recipientRecords = recipients.map((userId) => ({
        broadcast_id: broadcast.id,
        user_id: userId,
        status: RecipientStatus.PENDING,
      }));

      await this.recipientRepository.save(recipientRecords);

      // Send immediately if not scheduled
      if (!data.scheduledAt) {
        await this.sendBroadcast(broadcast.id);
      }

      return this.getBroadcastById(broadcast.id);
    } catch (error) {
      logger.error('Failed to create broadcast', error);
      throw error;
    }
  }

  async updateBroadcast(
    broadcastId: string,
    data: UpdateBroadcastDto,
    userId: string
  ): Promise<Broadcast> {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    if (broadcast.coach_id !== userId) {
      throw new Error('Unauthorized to update this broadcast');
    }

    if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.SCHEDULED) {
      throw new Error('Cannot update broadcast after sending');
    }

    // Update broadcast
    Object.assign(broadcast, data);
    broadcast.updated_by = userId;

    if (data.targetType || data.targetUserIds || data.targetRoles) {
      // Recalculate recipients
      const recipients = await this.getRecipients(broadcast);
      broadcast.total_recipients = recipients.length;

      // Update recipient records
      await this.recipientRepository.delete({ broadcast_id: broadcastId });
      const recipientRecords = recipients.map((userId) => ({
        broadcast_id: broadcast.id,
        user_id: userId,
        status: RecipientStatus.PENDING,
      }));
      await this.recipientRepository.save(recipientRecords);
    }

    await this.broadcastRepository.save(broadcast);
    return this.getBroadcastById(broadcast.id);
  }

  async sendBroadcast(broadcastId: string): Promise<void> {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
      relations: ['recipients'],
    });

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    if (broadcast.status === BroadcastStatus.SENT) {
      throw new Error('Broadcast already sent');
    }

    try {
      broadcast.status = BroadcastStatus.SENDING;
      await this.broadcastRepository.save(broadcast);

      // Get or create team broadcast conversation
      const conversation = await this.getOrCreateBroadcastConversation(broadcast);

      // Create broadcast message
      const message = await this.messageRepository.save({
        conversation_id: conversation.id,
        sender_id: broadcast.coach_id,
        content: broadcast.content,
        type: MessageType.BROADCAST,
        broadcast_id: broadcast.id,
        broadcast_priority: broadcast.priority,
        metadata: {
          broadcast_title: broadcast.title,
          attachments: broadcast.attachments,
          ...broadcast.metadata,
        },
        is_pinned: broadcast.metadata?.pin_duration_hours ? true : false,
        pinned_at: broadcast.metadata?.pin_duration_hours ? new Date() : null,
        pinned_by: broadcast.metadata?.pin_duration_hours ? broadcast.coach_id : null,
      });

      broadcast.message_id = message.id;

      // Send notifications to all recipients
      const recipients = await this.recipientRepository.find({
        where: { broadcast_id: broadcastId },
      });

      const notificationPromises = recipients.map(async (recipient) => {
        try {
          await this.notificationService.sendNotification({
            userId: recipient.user_id,
            type: 'broadcast',
            title: `${broadcast.priority === BroadcastPriority.URGENT ? '🚨 URGENT: ' : ''}${broadcast.title}`,
            body: broadcast.content.substring(0, 150) + (broadcast.content.length > 150 ? '...' : ''),
            data: {
              broadcastId: broadcast.id,
              messageId: message.id,
              conversationId: conversation.id,
              priority: broadcast.priority,
            },
            channels: broadcast.metadata?.notification_channels || ['push', 'email'],
          });

          recipient.status = RecipientStatus.DELIVERED;
          recipient.delivered_at = new Date();
          recipient.notification_channels = broadcast.metadata?.notification_channels || ['push', 'email'];
        } catch (error) {
          logger.error(`Failed to send notification to ${recipient.user_id}`, error);
          recipient.status = RecipientStatus.FAILED;
          recipient.failure_reason = error.message;
          recipient.retry_count++;
        }

        return recipient;
      });

      const updatedRecipients = await Promise.all(notificationPromises);
      await this.recipientRepository.save(updatedRecipients);

      // Update broadcast statistics
      const deliveredCount = updatedRecipients.filter(
        (r) => r.status === RecipientStatus.DELIVERED
      ).length;

      broadcast.status = BroadcastStatus.SENT;
      broadcast.sent_at = new Date();
      broadcast.delivered_count = deliveredCount;
      await this.broadcastRepository.save(broadcast);

      // Emit socket event for real-time updates
      const io = global.io;
      if (io) {
        recipients.forEach((recipient) => {
          io.to(`user:${recipient.user_id}`).emit('broadcast:new', {
            broadcast: {
              id: broadcast.id,
              title: broadcast.title,
              content: broadcast.content,
              priority: broadcast.priority,
              coach_id: broadcast.coach_id,
              sent_at: broadcast.sent_at,
              attachments: broadcast.attachments,
              metadata: broadcast.metadata,
            },
            message: {
              id: message.id,
              conversation_id: conversation.id,
            },
          });
        });
      }
    } catch (error) {
      logger.error('Failed to send broadcast', error);
      broadcast.status = BroadcastStatus.FAILED;
      broadcast.error_message = error.message;
      broadcast.retry_count++;
      await this.broadcastRepository.save(broadcast);
      throw error;
    }
  }

  async acknowledgeBroadcast(
    broadcastId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    const recipient = await this.recipientRepository.findOne({
      where: { broadcast_id: broadcastId, user_id: userId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    recipient.status = RecipientStatus.ACKNOWLEDGED;
    recipient.acknowledged_at = new Date();
    recipient.acknowledgment_note = note;
    await this.recipientRepository.save(recipient);

    // Update broadcast statistics
    const acknowledgedCount = await this.recipientRepository.count({
      where: { broadcast_id: broadcastId, status: RecipientStatus.ACKNOWLEDGED },
    });

    await this.broadcastRepository.update(broadcastId, {
      acknowledged_count: acknowledgedCount,
    });

    // Emit socket event
    const io = global.io;
    if (io) {
      const broadcast = await this.broadcastRepository.findOne({
        where: { id: broadcastId },
      });
      io.to(`user:${broadcast.coach_id}`).emit('broadcast:acknowledged', {
        broadcastId,
        userId,
        acknowledgedAt: recipient.acknowledged_at,
        note,
      });
    }
  }

  async markBroadcastAsRead(broadcastId: string, userId: string): Promise<void> {
    const recipient = await this.recipientRepository.findOne({
      where: { broadcast_id: broadcastId, user_id: userId },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    if (recipient.status === RecipientStatus.PENDING || recipient.status === RecipientStatus.DELIVERED) {
      recipient.status = RecipientStatus.READ;
      recipient.read_at = new Date();
      await this.recipientRepository.save(recipient);

      // Update broadcast statistics
      const readCount = await this.recipientRepository.count({
        where: { 
          broadcast_id: broadcastId, 
          status: In([RecipientStatus.READ, RecipientStatus.ACKNOWLEDGED]),
        },
      });

      await this.broadcastRepository.update(broadcastId, {
        read_count: readCount,
      });
    }
  }

  async getBroadcastById(broadcastId: string): Promise<Broadcast> {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
      relations: ['recipients'],
    });

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    // Fetch coach details
    try {
      const coach = await this.userServiceClient.get(`/api/users/${broadcast.coach_id}`);
      broadcast.coach = coach.data;
    } catch (error) {
      logger.error('Failed to fetch coach details', error);
    }

    return broadcast;
  }

  async getBroadcasts(filters: BroadcastFilters): Promise<{
    broadcasts: Broadcast[];
    total: number;
  }> {
    const query = this.broadcastRepository.createQueryBuilder('broadcast');

    if (filters.coachId) {
      query.andWhere('broadcast.coach_id = :coachId', { coachId: filters.coachId });
    }

    if (filters.teamId) {
      query.andWhere('broadcast.team_id = :teamId', { teamId: filters.teamId });
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query.andWhere('broadcast.status IN (:...statuses)', { statuses: filters.status });
      } else {
        query.andWhere('broadcast.status = :status', { status: filters.status });
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        query.andWhere('broadcast.priority IN (:...priorities)', { priorities: filters.priority });
      } else {
        query.andWhere('broadcast.priority = :priority', { priority: filters.priority });
      }
    }

    if (filters.startDate) {
      query.andWhere('broadcast.created_at >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('broadcast.created_at <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('broadcast.created_at', 'DESC');

    const [broadcasts, total] = await query.getManyAndCount();

    return { broadcasts, total };
  }

  async getUserBroadcasts(userId: string): Promise<{
    broadcasts: Array<{
      broadcast: Broadcast;
      recipientStatus: RecipientStatus;
      readAt?: Date;
      acknowledgedAt?: Date;
    }>;
    unreadCount: number;
  }> {
    const recipients = await this.recipientRepository.find({
      where: { user_id: userId },
      relations: ['broadcast'],
      order: { created_at: 'DESC' },
    });

    const broadcasts = await Promise.all(
      recipients.map(async (recipient) => {
        const broadcast = await this.getBroadcastById(recipient.broadcast_id);
        return {
          broadcast,
          recipientStatus: recipient.status,
          readAt: recipient.read_at,
          acknowledgedAt: recipient.acknowledged_at,
        };
      })
    );

    const unreadCount = recipients.filter(
      (r) => r.status === RecipientStatus.PENDING || r.status === RecipientStatus.DELIVERED
    ).length;

    return { broadcasts, unreadCount };
  }

  async cancelBroadcast(broadcastId: string, userId: string): Promise<void> {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    if (broadcast.coach_id !== userId) {
      throw new Error('Unauthorized to cancel this broadcast');
    }

    if (broadcast.status !== BroadcastStatus.SCHEDULED) {
      throw new Error('Can only cancel scheduled broadcasts');
    }

    broadcast.status = BroadcastStatus.CANCELLED;
    broadcast.updated_by = userId;
    await this.broadcastRepository.save(broadcast);
  }

  async deleteBroadcast(broadcastId: string, userId: string): Promise<void> {
    const broadcast = await this.broadcastRepository.findOne({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    if (broadcast.coach_id !== userId) {
      throw new Error('Unauthorized to delete this broadcast');
    }

    if (broadcast.status !== BroadcastStatus.DRAFT) {
      throw new Error('Can only delete draft broadcasts');
    }

    await this.broadcastRepository.softRemove(broadcast);
  }

  private async getRecipients(broadcast: Broadcast): Promise<string[]> {
    let recipients: string[] = [];

    switch (broadcast.target_type) {
      case BroadcastTargetType.TEAM:
        // Get all team members
        const teamMembers = await this.userServiceClient.get(
          `/api/teams/${broadcast.team_id}/members`
        );
        recipients = teamMembers.data.map((member: any) => member.id);
        break;

      case BroadcastTargetType.ROLE:
        // Get users by roles
        const roleUsers = await this.userServiceClient.get('/api/users', {
          params: {
            teamId: broadcast.team_id,
            roles: broadcast.target_roles,
          },
        });
        recipients = roleUsers.data.map((user: any) => user.id);
        break;

      case BroadcastTargetType.CUSTOM:
        // Use specified user IDs
        recipients = broadcast.target_user_ids || [];
        break;
    }

    // Remove duplicates
    return [...new Set(recipients)];
  }

  private async getOrCreateBroadcastConversation(broadcast: Broadcast): Promise<Conversation> {
    // Check if team broadcast conversation exists
    let conversation = await this.conversationRepository.findOne({
      where: {
        type: ConversationType.BROADCAST,
        team_id: broadcast.team_id,
      },
    });

    if (!conversation) {
      // Create new broadcast conversation
      conversation = await this.conversationRepository.save({
        type: ConversationType.BROADCAST,
        name: 'Team Broadcasts',
        description: 'Official team broadcasts from coaches',
        team_id: broadcast.team_id,
        organization_id: broadcast.organization_id,
        created_by: broadcast.coach_id,
        metadata: {
          is_broadcast_channel: true,
        },
      });

      // Add all team members as participants
      const recipients = await this.getRecipients(broadcast);
      const participants = [
        {
          conversation_id: conversation.id,
          user_id: broadcast.coach_id,
          role: ParticipantRole.ADMIN,
          joined_at: new Date(),
        },
        ...recipients.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: ParticipantRole.MEMBER,
          joined_at: new Date(),
        })),
      ];

      await this.participantRepository.save(participants);
    }

    return conversation;
  }

  async processScheduledBroadcasts(): Promise<void> {
    const now = new Date();
    const scheduledBroadcasts = await this.broadcastRepository.find({
      where: {
        status: BroadcastStatus.SCHEDULED,
        scheduled_at: Not(IsNull()),
      },
    });

    for (const broadcast of scheduledBroadcasts) {
      if (broadcast.scheduled_at <= now) {
        try {
          await this.sendBroadcast(broadcast.id);
        } catch (error) {
          logger.error(`Failed to send scheduled broadcast ${broadcast.id}`, error);
        }
      }
    }
  }

  async getRecipientStats(broadcastId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    read: number;
    acknowledged: number;
    failed: number;
  }> {
    const stats = await this.recipientRepository
      .createQueryBuilder('recipient')
      .select('recipient.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('recipient.broadcast_id = :broadcastId', { broadcastId })
      .groupBy('recipient.status')
      .getRawMany();

    const result = {
      total: 0,
      pending: 0,
      delivered: 0,
      read: 0,
      acknowledged: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      result[stat.status] = parseInt(stat.count);
      result.total += parseInt(stat.count);
    });

    return result;
  }
}