import { Repository } from 'typeorm';
import { AppDataSource, redisClient } from '../config/database';
import { Conversation, ConversationType } from '../entities/Conversation';
import { ConversationParticipant } from '../entities/ConversationParticipant';
import { Message } from '../entities/Message';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('cached-conversation-repo');

export class CachedConversationRepository {
  private repository: Repository<Conversation>;
  private readonly defaultTTL = 300; // 5 minutes
  private readonly longTTL = 1800; // 30 minutes for static data

  constructor() {
    this.repository = AppDataSource.getRepository(Conversation);
  }

  // Conversation management
  async findById(id: string, useCache = true): Promise<Conversation | null> {
    const cacheKey = `conversation:${id}`;
    
    if (useCache) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`Cache hit for conversation: ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn('Redis get error for conversation:', error);
      }
    }

    const conversation = await this.repository.findOne({
      where: { id, is_archived: false },
      relations: ['participants', 'messages'],
      order: { 'messages.created_at': 'DESC' }
    });

    if (conversation && useCache) {
      try {
        await redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(conversation));
      } catch (error) {
        logger.warn('Redis set error for conversation:', error);
      }
    }

    return conversation;
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    try {
      const participantRepo = AppDataSource.getRepository(ConversationParticipant);
      const row = await participantRepo.findOne({ where: { conversation_id: conversationId, user_id: userId } as any });
      if (!row) return false;
      // Consider left participants as non-participants
      if ((row as any).left_at) return false;
      // If archived, still a participant per integration tests
      return true;
    } catch {
      return false;
    }
  }

  async findUserConversations(userId: string, limit = 20, offset = 0): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    const cacheKey = `user_conversations:${userId}:${limit}:${offset}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for user conversations: ${userId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for user conversations:', error);
    }

    // Get conversations where user is a participant
    const [conversations, total] = await this.repository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoinAndSelect('conversation.messages', 'lastMessage')
      .where('participant.user_id = :userId', { userId })
      .andWhere('conversation.is_archived = false')
      .andWhere('participant.is_active = true')
      .orderBy('conversation.updated_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Add virtual fields for each conversation
    const conversationsWithVirtuals = await Promise.all(
      conversations.map(async (conv) => {
        // Get last message
        const lastMessage = await AppDataSource.getRepository(Message)
          .findOne({
            where: { conversation_id: conv.id },
            order: { created_at: 'DESC' }
          });

        // Get unread count for this user
        const unreadCount = await AppDataSource.getRepository(Message)
          .createQueryBuilder('message')
          .leftJoin('message.read_receipts', 'receipt', 'receipt.user_id = :userId', { userId })
          .where('message.conversation_id = :conversationId', { conversationId: conv.id })
          .andWhere('receipt.id IS NULL')
          .andWhere('message.sender_id != :userId', { userId })
          .getCount();

        return {
          ...conv,
          last_message: lastMessage,
          unread_count: unreadCount,
          participant_count: conv.participants?.length || 0
        };
      })
    );

    const result = {
      conversations: conversationsWithVirtuals,
      total
    };

    try {
      await redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
    } catch (error) {
      logger.warn('Redis set error for user conversations:', error);
    }

    return result;
  }

  async findTeamConversations(teamId: string, limit = 20, offset = 0): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    const cacheKey = `team_conversations:${teamId}:${limit}:${offset}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for team conversations: ${teamId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for team conversations:', error);
    }

    const [conversations, total] = await this.repository
      .createQueryBuilder('conversation')
      .where('conversation.metadata @> :teamFilter', { 
        teamFilter: JSON.stringify({ team_id: teamId }) 
      })
      .andWhere('conversation.is_archived = false')
      .orderBy('conversation.updated_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const result = { conversations, total };

    try {
      await redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
    } catch (error) {
      logger.warn('Redis set error for team conversations:', error);
    }

    return result;
  }

  // Conversation creation and updates
  async create(conversationData: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.repository.create(conversationData);
    const savedConversation = await this.repository.save(conversation);

    // Invalidate related caches
    await this.invalidateUserCaches(conversationData.created_by!);
    if (conversationData.metadata?.team_id) {
      await this.invalidateTeamCaches(conversationData.metadata.team_id);
    }

    return savedConversation;
  }

  async update(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    const conversation = await this.repository.findOne({ 
      where: { id },
      relations: ['participants']
    });
    
    if (!conversation) return null;

    await this.repository.update(id, updates);
    const updatedConversation = await this.repository.findOne({
      where: { id },
      relations: ['participants', 'messages']
    });

    // Invalidate caches
    await this.invalidateConversationCache(id);
    
    // Invalidate user caches for all participants
    if (conversation.participants) {
      for (const participant of conversation.participants) {
        await this.invalidateUserCaches(participant.user_id);
      }
    }

    return updatedConversation;
  }

  async archive(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      is_archived: true,
      updated_at: new Date()
    });

    if (result.affected && result.affected > 0) {
      await this.invalidateConversationCache(id);
      return true;
    }

    return false;
  }

  // Participant management
  async addParticipant(conversationId: string, userId: string, role = 'member'): Promise<boolean> {
    try {
      const participantRepo = AppDataSource.getRepository(ConversationParticipant);
      
      // Check if participant already exists
      const existing = await participantRepo.findOne({
        where: { conversation_id: conversationId, user_id: userId }
      });

      if (existing) {
        // Reactivate if inactive
        if (!existing.is_active) {
          await participantRepo.update(existing.id, { 
            is_active: true,
            role: role as any
          });
        }
      } else {
        // Create new participant
        const participant = participantRepo.create({
          conversation_id: conversationId,
          user_id: userId,
          role: role as any,
          is_active: true
        });
        await participantRepo.save(participant);
      }

      // Invalidate caches
      await this.invalidateConversationCache(conversationId);
      await this.invalidateUserCaches(userId);

      return true;
    } catch (error) {
      logger.error('Error adding participant:', error);
      return false;
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<boolean> {
    try {
      const participantRepo = AppDataSource.getRepository(ConversationParticipant);
      
      const result = await participantRepo.update(
        { conversation_id: conversationId, user_id: userId },
        { is_active: false }
      );

      if (result.affected && result.affected > 0) {
        // Invalidate caches
        await this.invalidateConversationCache(conversationId);
        await this.invalidateUserCaches(userId);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error removing participant:', error);
      return false;
    }
  }

  // Cache invalidation
  private async invalidateConversationCache(conversationId: string): Promise<void> {
    try {
      const pattern = `conversation:${conversationId}*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} conversation cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating conversation cache:', error);
    }
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    try {
      const pattern = `user_conversations:${userId}*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} user conversation cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating user conversation cache:', error);
    }
  }

  private async invalidateTeamCaches(teamId: string): Promise<void> {
    try {
      const pattern = `team_conversations:${teamId}*`;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} team conversation cache keys`);
      }
    } catch (error) {
      logger.warn('Error invalidating team conversation cache:', error);
    }
  }

  // Analytics methods
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    participantCount: number;
    lastActivity: Date | null;
    avgResponseTime: number;
  }> {
    const cacheKey = `conversation_stats:${conversationId}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for conversation stats: ${conversationId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis get error for conversation stats:', error);
    }

    const messageRepo = AppDataSource.getRepository(Message);
    const participantRepo = AppDataSource.getRepository(ConversationParticipant);

    const [messageCount, participantCount, lastMessage] = await Promise.all([
      messageRepo.count({ where: { conversation_id: conversationId, deleted_at: null } }),
      participantRepo.count({ where: { conversation_id: conversationId, is_active: true } }),
      messageRepo.findOne({
        where: { conversation_id: conversationId, deleted_at: null },
        order: { created_at: 'DESC' }
      })
    ]);

    // Calculate average response time (simplified)
    const avgResponseTime = await this.calculateAverageResponseTime(conversationId);

    const stats = {
      messageCount,
      participantCount,
      lastActivity: lastMessage?.created_at || null,
      avgResponseTime
    };

    try {
      await redisClient.setex(cacheKey, this.longTTL, JSON.stringify(stats));
    } catch (error) {
      logger.warn('Redis set error for conversation stats:', error);
    }

    return stats;
  }

  private async calculateAverageResponseTime(conversationId: string): Promise<number> {
    // Simplified calculation - in real implementation, you'd want more sophisticated analysis
    const messages = await AppDataSource.getRepository(Message)
      .find({
        where: { conversation_id: conversationId, deleted_at: null },
        order: { created_at: 'ASC' },
        take: 100 // Analyze last 100 messages
      });

    if (messages.length < 2) return 0;

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      const prevMessage = messages[i - 1];
      const currentMessage = messages[i];
      
      // If different senders, calculate response time
      if (prevMessage.sender_id !== currentMessage.sender_id) {
        const responseTime = currentMessage.created_at.getTime() - prevMessage.created_at.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000) : 0; // Return in seconds
  }
}