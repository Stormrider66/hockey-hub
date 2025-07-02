import { Repository, IsNull, MoreThan, LessThan, Like, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  Message,
  MessageType,
  ConversationParticipant,
  MessageAttachment,
  MessageReaction,
  MessageReadReceipt,
  Conversation,
  ConversationType,
} from '../entities';
import { NotFoundError, ForbiddenError, ValidationError } from '@hockey-hub/shared-lib';
import { PrivacyService } from './PrivacyService';
import { messageCacheService } from './MessageCacheService';
import { botManager } from '../bots/BotManager';

export interface SendMessageDto {
  content: string;
  type?: MessageType;
  reply_to_id?: string;
  attachments?: CreateAttachmentDto[];
  metadata?: Record<string, unknown>;
}

export interface CreateAttachmentDto {
  url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface EditMessageDto {
  content: string;
}

export interface MessageListParams {
  conversation_id: string;
  before_id?: string;
  after_id?: string;
  limit?: number;
  search?: string;
}

export interface AddReactionDto {
  emoji: string;
}

export class MessageService {
  private messageRepo: Repository<Message>;
  private participantRepo: Repository<ConversationParticipant>;
  private attachmentRepo: Repository<MessageAttachment>;
  private reactionRepo: Repository<MessageReaction>;
  private readReceiptRepo: Repository<MessageReadReceipt>;
  private conversationRepo: Repository<Conversation>;
  private privacyService: PrivacyService;

  private readonly EDIT_TIME_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.messageRepo = AppDataSource.getRepository(Message);
    this.participantRepo = AppDataSource.getRepository(ConversationParticipant);
    this.attachmentRepo = AppDataSource.getRepository(MessageAttachment);
    this.reactionRepo = AppDataSource.getRepository(MessageReaction);
    this.readReceiptRepo = AppDataSource.getRepository(MessageReadReceipt);
    this.conversationRepo = AppDataSource.getRepository(Conversation);
    this.privacyService = new PrivacyService();
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    data: SendMessageDto
  ): Promise<Message> {
    // Verify user is participant
    await this.verifyParticipant(conversationId, userId);

    // Check privacy settings for direct conversations
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants']
    });

    if (conversation && conversation.type === ConversationType.DIRECT) {
      const recipientParticipant = conversation.participants?.find(p => p.user_id !== userId);
      if (recipientParticipant) {
        const canMessage = await this.privacyService.canMessage(userId, recipientParticipant.user_id);
        if (!canMessage) {
          throw new ForbiddenError('You cannot send messages to this user');
        }
      }
    }

    // Validate content
    if (!data.content.trim() && (!data.attachments || data.attachments.length === 0)) {
      throw new ValidationError('Message must have content or attachments');
    }

    // Validate reply_to_id if provided
    if (data.reply_to_id) {
      const replyToMessage = await this.messageRepo.findOne({
        where: {
          id: data.reply_to_id,
          conversation_id: conversationId,
          deleted_at: IsNull(),
        },
      });
      if (!replyToMessage) {
        throw new NotFoundError('Reply message not found');
      }
    }

    // Create message
    const message = this.messageRepo.create({
      conversation_id: conversationId,
      sender_id: userId,
      content: data.content,
      type: data.type || MessageType.TEXT,
      reply_to_id: data.reply_to_id,
      metadata: data.metadata,
    });

    await this.messageRepo.save(message);

    // Create attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      const attachments = data.attachments.map((attachment) => {
        return this.attachmentRepo.create({
          message_id: message.id,
          ...attachment,
          type: this.determineAttachmentType(attachment.file_type),
        });
      });
      await this.attachmentRepo.save(attachments);
      message.attachments = attachments;
    }

    // Update conversation's updated_at
    await this.conversationRepo.update(conversationId, { updated_at: new Date() });

    // Load relations
    if (data.reply_to_id) {
      message.reply_to = await this.messageRepo.findOne({
        where: { id: data.reply_to_id },
      });
    }

    // Cache the message
    await messageCacheService.cacheMessage(message);
    
    // Invalidate conversation caches for all participants
    await messageCacheService.invalidateAllConversationLists(conversationId);
    
    // Update unread counts for all participants except sender
    if (conversation) {
      const otherParticipants = conversation.participants?.filter(p => p.user_id !== userId) || [];
      for (const participant of otherParticipants) {
        await messageCacheService.incrementUnreadCount(conversationId, participant.user_id);
      }
    }

    // Process message for bot commands if not from a bot
    if (!botManager.isBot(userId)) {
      await this.processBotCommands(message, conversation);
    }

    return message;
  }

  async getMessages(userId: string, params: MessageListParams): Promise<{
    messages: Message[];
    hasMore: boolean;
  }> {
    // Verify user is participant
    await this.verifyParticipant(params.conversation_id, userId);

    const limit = params.limit || 50;
    
    // Try to get messages from cache if no search parameter
    if (!params.search && !params.after_id) {
      let beforeTimestamp: number | undefined;
      
      if (params.before_id) {
        const beforeMessage = await this.messageRepo.findOne({
          where: { id: params.before_id },
        });
        if (beforeMessage) {
          beforeTimestamp = new Date(beforeMessage.created_at).getTime();
        }
      }
      
      const cachedMessages = await messageCacheService.getConversationMessages(
        params.conversation_id,
        limit,
        beforeTimestamp
      );
      
      if (cachedMessages.length > 0) {
        // Load full message data for cached messages
        const messageIds = cachedMessages.map(m => m.id);
        const fullMessages = await this.messageRepo.find({
          where: { id: In(messageIds) },
          relations: ['attachments', 'reply_to', 'reactions', 'read_receipts'],
        });
        
        // Maintain order from cache
        const messageMap = new Map(fullMessages.map(m => [m.id, m]));
        const orderedMessages = cachedMessages
          .map(cached => messageMap.get(cached.id))
          .filter(m => m !== undefined) as Message[];
        
        // Check if there are more messages
        const hasMore = cachedMessages.length === limit;
        
        // Enhance messages with user-specific data
        const enhancedMessages = await this.enhanceMessages(orderedMessages, userId);
        
        return {
          messages: enhancedMessages.reverse(), // Return in chronological order
          hasMore,
        };
      }
    }
    
    // Fall back to database query
    const query = this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .leftJoinAndSelect('message.reply_to', 'reply_to')
      .leftJoinAndSelect('message.reactions', 'reactions')
      .where('message.conversation_id = :conversationId', {
        conversationId: params.conversation_id,
      })
      .andWhere('message.deleted_at IS NULL');

    // Pagination
    if (params.before_id) {
      const beforeMessage = await this.messageRepo.findOne({
        where: { id: params.before_id },
      });
      if (beforeMessage) {
        query.andWhere('message.created_at < :beforeDate', {
          beforeDate: beforeMessage.created_at,
        });
      }
    }

    if (params.after_id) {
      const afterMessage = await this.messageRepo.findOne({
        where: { id: params.after_id },
      });
      if (afterMessage) {
        query.andWhere('message.created_at > :afterDate', {
          afterDate: afterMessage.created_at,
        });
      }
    }

    // Search
    if (params.search) {
      query.andWhere('message.content ILIKE :search', {
        search: `%${params.search}%`,
      });
    }

    const messages = await query
      .orderBy('message.created_at', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    // Add user read status and reaction counts
    const enhancedMessages = await this.enhanceMessages(messages, userId);
    
    // Cache the messages if not searching
    if (!params.search) {
      await messageCacheService.cacheMessages(messages);
    }

    return {
      messages: enhancedMessages.reverse(), // Return in chronological order
      hasMore,
    };
  }

  async editMessage(
    messageId: string,
    userId: string,
    data: EditMessageDto
  ): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: {
        id: messageId,
        deleted_at: IsNull(),
      },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is sender
    if (message.sender_id !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    // Check time limit
    const timeSinceCreation = Date.now() - message.created_at.getTime();
    if (timeSinceCreation > this.EDIT_TIME_LIMIT_MS) {
      throw new ForbiddenError('Message can no longer be edited');
    }

    // System messages cannot be edited
    if (message.type === MessageType.SYSTEM) {
      throw new ForbiddenError('System messages cannot be edited');
    }

    // Update message
    message.content = data.content;
    message.edited_at = new Date();
    await this.messageRepo.save(message);

    // Invalidate caches
    await messageCacheService.invalidateMessage(messageId);
    await messageCacheService.invalidateConversationMessages(message.conversation_id);
    await messageCacheService.invalidateAllConversationLists(message.conversation_id);

    return message;
  }

  async deleteMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepo.findOne({
      where: {
        id: messageId,
        deleted_at: IsNull(),
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is sender or admin
    if (message.sender_id !== userId) {
      const participant = await this.participantRepo.findOne({
        where: {
          conversation_id: message.conversation_id,
          user_id: userId,
          left_at: IsNull(),
        },
      });

      if (!participant || participant.role !== 'admin') {
        throw new ForbiddenError('You can only delete your own messages');
      }
    }

    // Soft delete
    message.deleted_at = new Date();
    await this.messageRepo.save(message);
    
    // Invalidate caches
    await messageCacheService.invalidateMessage(messageId);
    await messageCacheService.invalidateConversationMessages(message.conversation_id);
    await messageCacheService.invalidateAllConversationLists(message.conversation_id);
    
    return message;
  }

  async addReaction(
    messageId: string,
    userId: string,
    data: AddReactionDto
  ): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: {
        id: messageId,
        deleted_at: IsNull(),
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is participant
    await this.verifyParticipant(message.conversation_id, userId);

    // Check if reaction already exists
    const existingReaction = await this.reactionRepo.findOne({
      where: {
        message_id: messageId,
        user_id: userId,
        emoji: data.emoji,
      },
    });

    if (existingReaction) {
      return; // Already reacted with this emoji
    }

    // Add reaction
    const reaction = this.reactionRepo.create({
      message_id: messageId,
      user_id: userId,
      emoji: data.emoji,
    });

    await this.reactionRepo.save(reaction);
  }

  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const reaction = await this.reactionRepo.findOne({
      where: {
        message_id: messageId,
        user_id: userId,
        emoji,
      },
    });

    if (!reaction) {
      throw new NotFoundError('Reaction not found');
    }

    await this.reactionRepo.remove(reaction);
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    if (messageIds.length === 0) {
      return;
    }

    // Get messages to verify they exist and get conversation IDs
    const messages = await this.messageRepo.find({
      where: {
        id: In(messageIds),
        deleted_at: IsNull(),
      },
    });

    if (messages.length === 0) {
      return;
    }

    // Group by conversation and verify participant status
    const conversationIds = [...new Set(messages.map((m) => m.conversation_id))];
    
    for (const conversationId of conversationIds) {
      await this.verifyParticipant(conversationId, userId);
    }

    // Create read receipts
    const readReceipts = messages
      .filter((message) => message.sender_id !== userId) // Don't mark own messages as read
      .map((message) => {
        return this.readReceiptRepo.create({
          message_id: message.id,
          user_id: userId,
        });
      });

    if (readReceipts.length > 0) {
      await this.readReceiptRepo.save(readReceipts, { chunk: 100 });
    }

    // Update last_read_at for each conversation
    for (const conversationId of conversationIds) {
      await this.participantRepo.update(
        {
          conversation_id: conversationId,
          user_id: userId,
        },
        {
          last_read_at: new Date(),
        }
      );
      
      // Reset unread count in cache
      await messageCacheService.resetUnreadCount(conversationId, userId);
    }
  }

  async searchMessages(
    userId: string,
    query: string,
    conversationIds?: string[]
  ): Promise<Message[]> {
    const queryBuilder = this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .innerJoin(
        'conversation.participants',
        'participant',
        'participant.user_id = :userId AND participant.left_at IS NULL',
        { userId }
      )
      .where('message.deleted_at IS NULL')
      .andWhere('message.content ILIKE :query', { query: `%${query}%` });

    if (conversationIds && conversationIds.length > 0) {
      queryBuilder.andWhere('message.conversation_id IN (:...conversationIds)', {
        conversationIds,
      });
    }

    return queryBuilder
      .orderBy('message.created_at', 'DESC')
      .limit(50)
      .getMany();
  }

  // Helper methods
  private async enhanceMessages(messages: Message[], userId: string): Promise<Message[]> {
    return Promise.all(
      messages.map(async (message) => {
        // Check if current user has read this message
        const readReceipt = await this.readReceiptRepo.findOne({
          where: {
            message_id: message.id,
            user_id: userId,
          },
        });
        message.is_read = !!readReceipt;

        // Calculate reaction counts
        const reactionCounts: Record<string, number> = {};
        if (message.reactions) {
          message.reactions.forEach((reaction) => {
            reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
          });
        }
        message.reaction_counts = reactionCounts;

        return message;
      })
    );
  }

  private async verifyParticipant(conversationId: string, userId: string): Promise<void> {
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
  }

  private determineAttachmentType(fileType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (
      fileType === 'application/pdf' ||
      fileType.startsWith('application/msword') ||
      fileType.startsWith('application/vnd.')
    ) {
      return 'document';
    }
    return 'other';
  }

  private async processBotCommands(message: Message, conversation: Conversation | null): Promise<void> {
    try {
      // Process the message content for bot commands
      const processed = await botManager.processMessage(
        message.sender_id,
        message.content,
        message.conversation_id
      );

      // If the message was processed by a bot, we're done
      if (processed) {
        return;
      }

      // Check if this is a direct conversation with a bot
      if (conversation && conversation.type === ConversationType.DIRECT) {
        const botParticipant = conversation.participants?.find(
          p => p.user_id !== message.sender_id && botManager.isBot(p.user_id)
        );

        if (botParticipant) {
          // This is a direct message to a bot, route it appropriately
          const botUser = botManager.getBotUser(botParticipant.user_id);
          if (botUser && botUser.type === 'faq') {
            // Route to FAQ bot for question answering
            const faqBot = botManager.getFAQBot();
            await faqBot.answerQuestion(
              message.sender_id,
              message.content,
              message.conversation_id
            );
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the message send
      console.error('Error processing bot commands:', error);
    }
  }
}