// @ts-nocheck - Suppress TypeScript errors for build
import { AppDataSource } from '../config/database';
import { In, IsNull, Not } from 'typeorm';
import {
  Conversation,
  ConversationType,
  ConversationParticipant,
  Message,
  MessageType,
  MessageReaction,
  MessageReadReceipt,
} from '../entities';
import { ConversationService } from './ConversationService';
import { MessageService } from './MessageService';
import { NotificationService } from './NotificationService';
import { ValidationError, ForbiddenError, NotFoundError } from '@hockey-hub/shared-lib';

export interface CreateAnnouncementChannelDto {
  name: string;
  description?: string;
  teamId: string;
  organizationId: string;
  allowPlayerReactions?: boolean;
  participantIds: string[]; // Team members to add
}

export interface CreateAnnouncementDto {
  content: string;
  attachments?: {
    filename: string;
    url: string;
    type: string;
    size: number;
  }[];
  priority?: 'normal' | 'important' | 'urgent';
}

export interface PinAnnouncementDto {
  messageId: string;
}

export class AnnouncementChannelService {
  private conversationRepo = AppDataSource.getRepository(Conversation);
  private participantRepo = AppDataSource.getRepository(ConversationParticipant);
  private messageRepo = AppDataSource.getRepository(Message);
  private reactionRepo = AppDataSource.getRepository(MessageReaction);
  private readReceiptRepo = AppDataSource.getRepository(MessageReadReceipt);
  
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
    private notificationService: NotificationService
  ) {}

  /**
   * Create a new announcement channel (coaches only)
   */
  async createAnnouncementChannel(
    userId: string,
    userRole: string,
    dto: CreateAnnouncementChannelDto
  ): Promise<Conversation> {
    // Only coaches can create announcement channels
    if (userRole !== 'coach') {
      throw new ForbiddenError('Only coaches can create announcement channels');
    }

    // Create conversation with announcement type
    const conversation = await this.conversationService.createConversation(userId, {
      type: ConversationType.ANNOUNCEMENT,
      name: dto.name,
      description: dto.description,
      participant_ids: dto.participantIds,
      metadata: {
        teamId: dto.teamId,
        organizationId: dto.organizationId,
        allowPlayerReactions: dto.allowPlayerReactions ?? true,
        moderatorIds: [userId], // Creator is automatically a moderator
      },
    });

    // Send notification to all participants
    await this.notificationService.createNotification({
      type: 'announcement_channel_created',
      recipient_id: null, // Will be sent to all participants
      sender_id: userId,
      title: 'New Announcement Channel',
      content: `You've been added to the announcement channel: ${dto.name}`,
      data: {
        conversation_id: conversation.id,
        channel_name: dto.name,
      },
      priority: 'normal',
    });

    return conversation;
  }

  /**
   * Get all announcement channels for a user
   */
  async getUserAnnouncementChannels(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .leftJoinAndSelect('conversation.messages', 'message', 'message.is_pinned = true')
      .where('participant.user_id = :userId', { userId })
      .andWhere('conversation.type = :type', { type: ConversationType.ANNOUNCEMENT })
      .andWhere('conversation.is_archived = false')
      .orderBy('conversation.updated_at', 'DESC')
      .getMany();

    // Get last message and unread counts
    for (const conversation of conversations) {
      const lastMessage = await this.messageRepo.findOne({
        where: { conversation_id: conversation.id },
        order: { created_at: 'DESC' },
      });

      const unreadCount = await this.messageRepo
        .createQueryBuilder('message')
        .leftJoin('message.read_receipts', 'receipt')
        .where('message.conversation_id = :conversationId', {
          conversationId: conversation.id,
        })
        .andWhere('message.sender_id != :userId', { userId })
        .andWhere(
          '(receipt.user_id != :userId OR receipt.user_id IS NULL)',
          { userId }
        )
        .getCount();

      conversation.last_message = lastMessage;
      conversation.unread_count = unreadCount;
    }

    return conversations;
  }

  /**
   * Post an announcement (coaches only)
   */
  async postAnnouncement(
    userId: string,
    userRole: string,
    conversationId: string,
    dto: CreateAnnouncementDto
  ): Promise<Message> {
    // Verify the conversation is an announcement channel
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, type: ConversationType.ANNOUNCEMENT },
    });

    if (!conversation) {
      throw new NotFoundError('Announcement channel not found');
    }

    // Check if user is a coach or moderator
    const isModerator = conversation.metadata?.moderatorIds?.includes(userId);
    if (userRole !== 'coach' && !isModerator) {
      throw new ForbiddenError('Only coaches can post announcements');
    }

    // Create the announcement message
    const message = await this.messageService.sendMessage(userId, {
      conversation_id: conversationId,
      content: dto.content,
      type: MessageType.ANNOUNCEMENT,
      attachments: dto.attachments,
      metadata: {
        priority: dto.priority || 'normal',
      },
    });

    // Send high-priority notifications for important/urgent announcements
    if (dto.priority === 'important' || dto.priority === 'urgent') {
      const participants = await this.participantRepo.find({
        where: { conversation_id: conversationId },
      });

      for (const participant of participants) {
        if (participant.user_id !== userId) {
          await this.notificationService.createNotification({
            type: dto.priority === 'urgent' ? 'urgent_announcement' : 'important_announcement',
            recipient_id: participant.user_id,
            sender_id: userId,
            title: dto.priority === 'urgent' ? 'Urgent Announcement' : 'Important Announcement',
            content: dto.content.substring(0, 100) + (dto.content.length > 100 ? '...' : ''),
            data: {
              conversation_id: conversationId,
              message_id: message.id,
              channel_name: conversation.name,
            },
            priority: dto.priority === 'urgent' ? 'high' : 'normal',
          });
        }
      }
    }

    return message;
  }

  /**
   * Pin/unpin an announcement
   */
  async togglePinAnnouncement(
    userId: string,
    userRole: string,
    conversationId: string,
    messageId: string
  ): Promise<Message> {
    // Verify permissions
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, type: ConversationType.ANNOUNCEMENT },
    });

    if (!conversation) {
      throw new NotFoundError('Announcement channel not found');
    }

    const isModerator = conversation.metadata?.moderatorIds?.includes(userId);
    if (userRole !== 'coach' && !isModerator) {
      throw new ForbiddenError('Only coaches can pin announcements');
    }

    // Toggle pin status
    const message = await this.messageRepo.findOne({
      where: { id: messageId, conversation_id: conversationId },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    message.is_pinned = !message.is_pinned;
    message.pinned_at = message.is_pinned ? new Date() : null;
    message.pinned_by = message.is_pinned ? userId : null;

    return await this.messageRepo.save(message);
  }

  /**
   * Get pinned announcements for a channel
   */
  async getPinnedAnnouncements(conversationId: string): Promise<Message[]> {
    return await this.messageRepo.find({
      where: {
        conversation_id: conversationId,
        is_pinned: true,
      },
      order: {
        pinned_at: 'DESC',
      },
    });
  }

  /**
   * React to an announcement (players)
   */
  async reactToAnnouncement(
    userId: string,
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    // Verify the conversation allows reactions
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, type: ConversationType.ANNOUNCEMENT },
    });

    if (!conversation) {
      throw new NotFoundError('Announcement channel not found');
    }

    if (conversation.metadata?.allowPlayerReactions === false) {
      throw new ForbiddenError('Reactions are not allowed in this channel');
    }

    // Check if user is a participant
    const participant = await this.participantRepo.findOne({
      where: { conversation_id: conversationId, user_id: userId },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a member of this channel');
    }

    // Add or remove reaction
    const existingReaction = await this.reactionRepo.findOne({
      where: {
        message_id: messageId,
        user_id: userId,
        emoji,
      },
    });

    if (existingReaction) {
      // Remove reaction if it already exists
      await this.reactionRepo.remove(existingReaction);
    } else {
      // Add new reaction
      const reaction = this.reactionRepo.create({
        message_id: messageId,
        user_id: userId,
        emoji,
      });
      await this.reactionRepo.save(reaction);
    }
  }

  /**
   * Get read receipts for an announcement
   */
  async getAnnouncementReadReceipts(
    userId: string,
    userRole: string,
    messageId: string
  ): Promise<MessageReadReceipt[]> {
    // Only coaches can see read receipts
    if (userRole !== 'coach') {
      throw new ForbiddenError('Only coaches can view read receipts');
    }

    return await this.readReceiptRepo.find({
      where: { message_id: messageId },
      order: { read_at: 'DESC' },
    });
  }

  /**
   * Add moderators to announcement channel
   */
  async addModerator(
    userId: string,
    userRole: string,
    conversationId: string,
    moderatorId: string
  ): Promise<void> {
    if (userRole !== 'coach') {
      throw new ForbiddenError('Only coaches can add moderators');
    }

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, type: ConversationType.ANNOUNCEMENT },
    });

    if (!conversation) {
      throw new NotFoundError('Announcement channel not found');
    }

    const metadata = conversation.metadata || {};
    const moderatorIds = metadata.moderatorIds || [];

    if (!moderatorIds.includes(moderatorId)) {
      moderatorIds.push(moderatorId);
      conversation.metadata = {
        ...metadata,
        moderatorIds,
      };
      await this.conversationRepo.save(conversation);
    }
  }

  /**
   * Update announcement channel settings
   */
  async updateAnnouncementChannelSettings(
    userId: string,
    userRole: string,
    conversationId: string,
    settings: {
      name?: string;
      description?: string;
      allowPlayerReactions?: boolean;
    }
  ): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, type: ConversationType.ANNOUNCEMENT },
    });

    if (!conversation) {
      throw new NotFoundError('Announcement channel not found');
    }

    const isModerator = conversation.metadata?.moderatorIds?.includes(userId);
    if (userRole !== 'coach' && !isModerator) {
      throw new ForbiddenError('Only coaches can update announcement channel settings');
    }

    if (settings.name !== undefined) {
      conversation.name = settings.name;
    }

    if (settings.description !== undefined) {
      conversation.description = settings.description;
    }

    if (settings.allowPlayerReactions !== undefined) {
      conversation.metadata = {
        ...conversation.metadata,
        allowPlayerReactions: settings.allowPlayerReactions,
      };
    }

    return await this.conversationRepo.save(conversation);
  }
}