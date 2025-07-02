import { Repository, In, IsNull, Not, QueryBuilder } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  Conversation,
  ConversationType,
  ConversationParticipant,
  ParticipantRole,
  Message,
  MessageType,
} from '../entities';
import { NotFoundError, ConflictError, ForbiddenError } from '@hockey-hub/shared-lib';
import { PrivacyService } from './PrivacyService';
import { messageCacheService } from './MessageCacheService';

export interface CreateConversationDto {
  type: ConversationType;
  name?: string;
  description?: string;
  avatar_url?: string;
  participant_ids: string[];
  metadata?: Record<string, any>;
}

export interface UpdateConversationDto {
  name?: string;
  description?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export interface ConversationListParams {
  user_id: string;
  include_archived?: boolean;
  type?: ConversationType;
  page?: number;
  limit?: number;
}

export class ConversationService {
  private conversationRepo: Repository<Conversation>;
  private participantRepo: Repository<ConversationParticipant>;
  private messageRepo: Repository<Message>;
  private privacyService: PrivacyService;

  constructor() {
    this.conversationRepo = AppDataSource.getRepository(Conversation);
    this.participantRepo = AppDataSource.getRepository(ConversationParticipant);
    this.messageRepo = AppDataSource.getRepository(Message);
    this.privacyService = new PrivacyService();
  }

  async createConversation(userId: string, data: CreateConversationDto): Promise<Conversation> {
    // Validate direct conversations have exactly 2 participants
    if (data.type === ConversationType.DIRECT && data.participant_ids.length !== 2) {
      throw new ConflictError('Direct conversations must have exactly 2 participants');
    }

    // Check if direct conversation already exists
    if (data.type === ConversationType.DIRECT) {
      // Check if users have blocked each other
      const otherUserId = data.participant_ids.find(id => id !== userId)!;
      const isBlocked = await this.privacyService.isBlockedBidirectional(userId, otherUserId);
      if (isBlocked) {
        throw new ForbiddenError('Cannot create conversation with blocked user');
      }

      const existingConversation = await this.findExistingDirectConversation(
        data.participant_ids[0],
        data.participant_ids[1]
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Ensure creator is in participant list
    if (!data.participant_ids.includes(userId)) {
      data.participant_ids.push(userId);
    }

    // Create conversation
    const conversation = this.conversationRepo.create({
      type: data.type,
      name: data.name,
      description: data.description,
      avatar_url: data.avatar_url,
      created_by: userId,
      metadata: data.metadata,
    });

    await this.conversationRepo.save(conversation);

    // Add participants
    const participants = data.participant_ids.map((participantId) => {
      return this.participantRepo.create({
        conversation_id: conversation.id,
        user_id: participantId,
        role: participantId === userId ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
      });
    });

    await this.participantRepo.save(participants);

    // Create system message for group creation
    if (data.type === ConversationType.GROUP || data.type === ConversationType.TEAM) {
      await this.createSystemMessage(conversation.id, `Conversation created by user ${userId}`);
    }

    // Load and return with participants
    return this.getConversationById(conversation.id, userId);
  }

  async getConversationById(conversationId: string, userId: string): Promise<Conversation> {
    // Check if user is participant
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const conversation = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants', 'participants.left_at IS NULL')
      .where('conversation.id = :conversationId', { conversationId })
      .getOne();

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Get last message
    const lastMessage = await this.messageRepo.findOne({
      where: { conversation_id: conversationId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });

    // Get unread count
    const unreadCount = await this.getUnreadCount(conversationId, userId, participant.last_read_at);

    conversation.last_message = lastMessage || undefined;
    conversation.unread_count = unreadCount;
    conversation.participant_count = conversation.participants.length;

    return conversation;
  }

  async getUserConversations(params: ConversationListParams): Promise<{
    conversations: Conversation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Try to get from cache first (only for first page without filters)
    if (page === 1 && !params.type && !params.include_archived) {
      const cached = await messageCacheService.getCachedConversationList(params.user_id);
      if (cached) {
        const paginatedConversations = cached.conversations.slice(offset, offset + limit);
        return {
          conversations: paginatedConversations,
          total: cached.total,
          page,
          totalPages: Math.ceil(cached.total / limit),
        };
      }
    }

    const query = this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin(
        'conversation.participants',
        'participant',
        'participant.user_id = :userId AND participant.left_at IS NULL',
        { userId: params.user_id }
      )
      .leftJoinAndSelect('conversation.participants', 'participants', 'participants.left_at IS NULL')
      .where('conversation.is_archived = :archived', { archived: params.include_archived || false });

    if (params.type) {
      query.andWhere('conversation.type = :type', { type: params.type });
    }

    const [conversations, total] = await query
      .orderBy('conversation.updated_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Enhance conversations with last message and unread count
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = await this.participantRepo.findOne({
          where: {
            conversation_id: conversation.id,
            user_id: params.user_id,
          },
        });

        const lastMessage = await this.messageRepo.findOne({
          where: { conversation_id: conversation.id, deleted_at: IsNull() },
          order: { created_at: 'DESC' },
        });

        // Try to get cached unread count first
        let unreadCount = await messageCacheService.getCachedUnreadCount(
          conversation.id,
          params.user_id
        );
        
        if (unreadCount === null) {
          unreadCount = await this.getUnreadCount(
            conversation.id,
            params.user_id,
            participant?.last_read_at
          );
          // Cache the unread count
          await messageCacheService.cacheUnreadCount(conversation.id, params.user_id, unreadCount);
        }

        conversation.last_message = lastMessage || undefined;
        conversation.unread_count = unreadCount;
        conversation.participant_count = conversation.participants.length;

        return conversation;
      })
    );

    // Cache the conversation list if it's the first page without filters
    if (page === 1 && !params.type && !params.include_archived) {
      await messageCacheService.cacheConversationList(params.user_id, enhancedConversations, total);
    }

    return {
      conversations: enhancedConversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    data: UpdateConversationDto
  ): Promise<Conversation> {
    // Check if user is admin
    await this.checkUserIsAdmin(conversationId, userId);

    await this.conversationRepo.update(conversationId, {
      ...data,
      updated_at: new Date(),
    });

    return this.getConversationById(conversationId, userId);
  }

  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    await this.checkUserIsAdmin(conversationId, userId);

    await this.conversationRepo.update(conversationId, {
      is_archived: true,
      updated_at: new Date(),
    });

    await this.createSystemMessage(conversationId, `Conversation archived by user ${userId}`);
  }

  async addParticipants(
    conversationId: string,
    userId: string,
    participantIds: string[]
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new ConflictError('Cannot add participants to direct conversations');
    }

    await this.checkUserIsAdmin(conversationId, userId);

    // Filter out existing participants
    const existingParticipants = await this.participantRepo.find({
      where: {
        conversation_id: conversationId,
        user_id: In(participantIds),
      },
    });

    const existingUserIds = existingParticipants.map((p) => p.user_id);
    const newParticipantIds = participantIds.filter((id) => !existingUserIds.includes(id));

    if (newParticipantIds.length === 0) {
      return;
    }

    // Add new participants
    const newParticipants = newParticipantIds.map((participantId) => {
      return this.participantRepo.create({
        conversation_id: conversationId,
        user_id: participantId,
        role: ParticipantRole.MEMBER,
      });
    });

    await this.participantRepo.save(newParticipants);

    // Create system message
    await this.createSystemMessage(
      conversationId,
      `${newParticipantIds.length} participant(s) added by user ${userId}`
    );

    // Update conversation timestamp
    await this.conversationRepo.update(conversationId, { updated_at: new Date() });
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    participantId: string
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);

    if (conversation.type === ConversationType.DIRECT) {
      throw new ConflictError('Cannot remove participants from direct conversations');
    }

    // Users can remove themselves, admins can remove anyone
    if (userId !== participantId) {
      await this.checkUserIsAdmin(conversationId, userId);
    }

    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: participantId,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new NotFoundError('Participant not found in conversation');
    }

    // Mark as left instead of deleting
    participant.left_at = new Date();
    await this.participantRepo.save(participant);

    // Create system message
    const message = userId === participantId
      ? `User ${participantId} left the conversation`
      : `User ${participantId} was removed by user ${userId}`;
    await this.createSystemMessage(conversationId, message);

    // Update conversation timestamp
    await this.conversationRepo.update(conversationId, { updated_at: new Date() });
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    participant.last_read_at = new Date();
    await this.participantRepo.save(participant);
  }

  async muteConversation(
    conversationId: string,
    userId: string,
    until?: Date
  ): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    participant.is_muted = true;
    participant.muted_until = until;
    await this.participantRepo.save(participant);
  }

  async unmuteConversation(conversationId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    participant.is_muted = false;
    participant.muted_until = null;
    await this.participantRepo.save(participant);
  }

  // Helper methods
  private async findExistingDirectConversation(
    userId1: string,
    userId2: string
  ): Promise<Conversation | null> {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'p1', 'p1.user_id = :userId1', { userId1 })
      .innerJoin('conversation.participants', 'p2', 'p2.user_id = :userId2', { userId2 })
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere('conversation.is_archived = false')
      .getOne();

    return conversations || null;
  }

  private async checkUserIsAdmin(conversationId: string, userId: string): Promise<void> {
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: conversationId,
        user_id: userId,
        role: ParticipantRole.ADMIN,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new ForbiddenError('You must be an admin to perform this action');
    }
  }

  private async createSystemMessage(conversationId: string, content: string): Promise<void> {
    const message = this.messageRepo.create({
      conversation_id: conversationId,
      sender_id: 'system',
      content,
      type: MessageType.SYSTEM,
    });

    await this.messageRepo.save(message);
  }

  private async getUnreadCount(
    conversationId: string,
    userId: string,
    lastReadAt?: Date | null
  ): Promise<number> {
    const query = this.messageRepo
      .createQueryBuilder('message')
      .where('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.sender_id != :userId', { userId })
      .andWhere('message.deleted_at IS NULL');

    if (lastReadAt) {
      query.andWhere('message.created_at > :lastReadAt', { lastReadAt });
    }

    return query.getCount();
  }
}