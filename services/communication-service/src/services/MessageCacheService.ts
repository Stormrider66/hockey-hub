import { Redis } from 'ioredis';
import { redisClient } from '../config/database';
import { Message, Conversation, ConversationParticipant } from '../entities';
import { Logger } from '@hockey-hub/shared-lib';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';

const logger = new Logger('message-cache-service');

export interface MessageCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  cacheSize: number;
  evictions: number;
}

export interface CachedMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: Date;
  edited_at?: Date;
  deleted_at?: Date;
  reply_to_id?: string;
  metadata?: Record<string, any>;
  attachments?: any[];
  reactions?: any[];
  read_receipts?: any[];
  is_read?: boolean;
  reaction_counts?: Record<string, number>;
}

export interface CachedConversation {
  id: string;
  type: string;
  name?: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  metadata?: Record<string, any>;
  last_message?: CachedMessage;
  unread_count: number;
  participant_count: number;
  participants: any[];
}

export interface ConversationListCacheEntry {
  conversations: CachedConversation[];
  total: number;
  lastUpdated: Date;
}

export class MessageCacheService {
  private redis: Redis;
  private messageRepo: Repository<Message>;
  private conversationRepo: Repository<Conversation>;
  private participantRepo: Repository<ConversationParticipant>;
  
  // Cache configuration
  private readonly MESSAGE_CACHE_TTL = 24 * 60 * 60; // 24 hours for messages
  private readonly CONVERSATION_LIST_TTL = 5 * 60; // 5 minutes for conversation lists
  private readonly PRESENCE_TTL = 60; // 1 minute for presence
  private readonly STATS_TTL = 60 * 60; // 1 hour for statistics
  private readonly MAX_MESSAGES_PER_CONVERSATION = 100;
  
  // Cache key prefixes
  private readonly KEYS = {
    MESSAGE: 'msg:',
    CONVERSATION: 'conv:',
    CONVERSATION_LIST: 'convlist:',
    CONVERSATION_MESSAGES: 'convmsgs:',
    UNREAD_COUNT: 'unread:',
    PRESENCE: 'presence:',
    TYPING: 'typing:',
    STATS: 'stats:',
    CACHE_METRICS: 'metrics:cache',
  };

  // In-memory cache metrics
  private cacheMetrics: MessageCacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    cacheSize: 0,
    evictions: 0,
  };

  constructor() {
    this.redis = redisClient;
    this.messageRepo = AppDataSource.getRepository(Message);
    this.conversationRepo = AppDataSource.getRepository(Conversation);
    this.participantRepo = AppDataSource.getRepository(ConversationParticipant);
    
    // Initialize cache metrics tracking
    this.initializeMetricsTracking();
  }

  // ==================== Message Caching ====================

  async cacheMessage(message: Message | CachedMessage): Promise<void> {
    try {
      const key = `${this.KEYS.MESSAGE}${message.id}`;
      await this.redis.setex(key, this.MESSAGE_CACHE_TTL, JSON.stringify(message));
      
      // Add to conversation's message list
      await this.addToConversationMessages(message.conversation_id, message);
    } catch (error) {
      logger.error('Error caching message:', error);
    }
  }

  async getCachedMessage(messageId: string): Promise<CachedMessage | null> {
    try {
      const key = `${this.KEYS.MESSAGE}${messageId}`;
      const cached = await this.redis.get(key);
      
      this.updateMetrics(!!cached);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting cached message:', error);
      return null;
    }
  }

  async cacheMessages(messages: (Message | CachedMessage)[]): Promise<void> {
    if (messages.length === 0) return;
    
    try {
      const pipeline = this.redis.pipeline();
      
      for (const message of messages) {
        const key = `${this.KEYS.MESSAGE}${message.id}`;
        pipeline.setex(key, this.MESSAGE_CACHE_TTL, JSON.stringify(message));
      }
      
      await pipeline.exec();
      
      // Group by conversation and add to conversation message lists
      const messagesByConversation = new Map<string, (Message | CachedMessage)[]>();
      messages.forEach(msg => {
        const list = messagesByConversation.get(msg.conversation_id) || [];
        list.push(msg);
        messagesByConversation.set(msg.conversation_id, list);
      });
      
      for (const [conversationId, convMessages] of messagesByConversation) {
        await this.addToConversationMessages(conversationId, ...convMessages);
      }
    } catch (error) {
      logger.error('Error caching multiple messages:', error);
    }
  }

  // ==================== Conversation Message Lists ====================

  private async addToConversationMessages(
    conversationId: string,
    ...messages: (Message | CachedMessage)[]
  ): Promise<void> {
    try {
      const key = `${this.KEYS.CONVERSATION_MESSAGES}${conversationId}`;
      
      // Sort messages by created_at descending (newest first)
      const sortedMessages = messages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Use Redis sorted set with timestamp as score
      const pipeline = this.redis.pipeline();
      
      for (const message of sortedMessages) {
        const score = new Date(message.created_at).getTime();
        pipeline.zadd(key, score, JSON.stringify({
          id: message.id,
          sender_id: message.sender_id,
          content: message.content,
          type: message.type,
          created_at: message.created_at,
          edited_at: message.edited_at,
          deleted_at: message.deleted_at,
        }));
      }
      
      // Keep only the most recent MAX_MESSAGES_PER_CONVERSATION messages
      pipeline.zremrangebyrank(key, 0, -(this.MAX_MESSAGES_PER_CONVERSATION + 1));
      
      // Set expiration
      pipeline.expire(key, this.MESSAGE_CACHE_TTL);
      
      await pipeline.exec();
    } catch (error) {
      logger.error('Error adding messages to conversation cache:', error);
    }
  }

  async getConversationMessages(
    conversationId: string,
    limit = 50,
    beforeTimestamp?: number
  ): Promise<CachedMessage[]> {
    try {
      const key = `${this.KEYS.CONVERSATION_MESSAGES}${conversationId}`;
      
      let messages: string[];
      if (beforeTimestamp) {
        // Get messages before the specified timestamp
        messages = await this.redis.zrevrangebyscore(
          key,
          beforeTimestamp - 1,
          '-inf',
          'LIMIT',
          0,
          limit
        );
      } else {
        // Get the most recent messages
        messages = await this.redis.zrevrange(key, 0, limit - 1);
      }
      
      this.updateMetrics(messages.length > 0);
      
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      logger.error('Error getting conversation messages from cache:', error);
      return [];
    }
  }

  // ==================== Conversation List Caching ====================

  async cacheConversationList(
    userId: string,
    conversations: CachedConversation[],
    total: number
  ): Promise<void> {
    try {
      const key = `${this.KEYS.CONVERSATION_LIST}${userId}`;
      const entry: ConversationListCacheEntry = {
        conversations,
        total,
        lastUpdated: new Date(),
      };
      
      await this.redis.setex(key, this.CONVERSATION_LIST_TTL, JSON.stringify(entry));
      
      // Also cache individual conversations
      const pipeline = this.redis.pipeline();
      for (const conversation of conversations) {
        const convKey = `${this.KEYS.CONVERSATION}${conversation.id}`;
        pipeline.setex(convKey, this.CONVERSATION_LIST_TTL, JSON.stringify(conversation));
      }
      await pipeline.exec();
    } catch (error) {
      logger.error('Error caching conversation list:', error);
    }
  }

  async getCachedConversationList(userId: string): Promise<ConversationListCacheEntry | null> {
    try {
      const key = `${this.KEYS.CONVERSATION_LIST}${userId}`;
      const cached = await this.redis.get(key);
      
      this.updateMetrics(!!cached);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting cached conversation list:', error);
      return null;
    }
  }

  async updateConversationInList(userId: string, conversation: CachedConversation): Promise<void> {
    try {
      const listKey = `${this.KEYS.CONVERSATION_LIST}${userId}`;
      const cached = await this.redis.get(listKey);
      
      if (cached) {
        const entry: ConversationListCacheEntry = JSON.parse(cached);
        const index = entry.conversations.findIndex(c => c.id === conversation.id);
        
        if (index !== -1) {
          entry.conversations[index] = conversation;
          // Re-sort by updated_at
          entry.conversations.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          
          await this.redis.setex(listKey, this.CONVERSATION_LIST_TTL, JSON.stringify(entry));
        }
      }
      
      // Also update individual conversation cache
      const convKey = `${this.KEYS.CONVERSATION}${conversation.id}`;
      await this.redis.setex(convKey, this.CONVERSATION_LIST_TTL, JSON.stringify(conversation));
    } catch (error) {
      logger.error('Error updating conversation in list:', error);
    }
  }

  // ==================== Unread Count Caching ====================

  async cacheUnreadCount(conversationId: string, userId: string, count: number): Promise<void> {
    try {
      const key = `${this.KEYS.UNREAD_COUNT}${conversationId}:${userId}`;
      await this.redis.setex(key, this.CONVERSATION_LIST_TTL, count.toString());
    } catch (error) {
      logger.error('Error caching unread count:', error);
    }
  }

  async getCachedUnreadCount(conversationId: string, userId: string): Promise<number | null> {
    try {
      const key = `${this.KEYS.UNREAD_COUNT}${conversationId}:${userId}`;
      const cached = await this.redis.get(key);
      
      this.updateMetrics(!!cached);
      
      if (cached) {
        return parseInt(cached, 10);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting cached unread count:', error);
      return null;
    }
  }

  async incrementUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const key = `${this.KEYS.UNREAD_COUNT}${conversationId}:${userId}`;
      const newCount = await this.redis.incr(key);
      await this.redis.expire(key, this.CONVERSATION_LIST_TTL);
      return newCount;
    } catch (error) {
      logger.error('Error incrementing unread count:', error);
      return 0;
    }
  }

  async resetUnreadCount(conversationId: string, userId: string): Promise<void> {
    try {
      const key = `${this.KEYS.UNREAD_COUNT}${conversationId}:${userId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Error resetting unread count:', error);
    }
  }

  // ==================== User Presence Caching ====================

  async cacheUserPresence(userId: string, status: string, lastSeen: Date): Promise<void> {
    try {
      const key = `${this.KEYS.PRESENCE}${userId}`;
      const presence = {
        status,
        lastSeen: lastSeen.toISOString(),
        timestamp: Date.now(),
      };
      
      await this.redis.setex(key, this.PRESENCE_TTL, JSON.stringify(presence));
    } catch (error) {
      logger.error('Error caching user presence:', error);
    }
  }

  async getCachedUserPresence(userId: string): Promise<any | null> {
    try {
      const key = `${this.KEYS.PRESENCE}${userId}`;
      const cached = await this.redis.get(key);
      
      this.updateMetrics(!!cached);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting cached user presence:', error);
      return null;
    }
  }

  async getCachedMultipleUserPresence(userIds: string[]): Promise<Map<string, any>> {
    if (userIds.length === 0) return new Map();
    
    try {
      const pipeline = this.redis.pipeline();
      const keys = userIds.map(id => `${this.KEYS.PRESENCE}${id}`);
      
      keys.forEach(key => pipeline.get(key));
      
      const results = await pipeline.exec();
      const presenceMap = new Map<string, any>();
      
      if (results) {
        results.forEach((result, index) => {
          if (result && result[1]) {
            try {
              presenceMap.set(userIds[index], JSON.parse(result[1] as string));
            } catch (e) {
              // Skip invalid entries
            }
          }
        });
      }
      
      this.updateMetrics(presenceMap.size > 0, userIds.length);
      
      return presenceMap;
    } catch (error) {
      logger.error('Error getting cached multiple user presence:', error);
      return new Map();
    }
  }

  // ==================== Typing Indicators ====================

  async setUserTyping(conversationId: string, userId: string): Promise<void> {
    try {
      const key = `${this.KEYS.TYPING}${conversationId}`;
      await this.redis.zadd(key, Date.now(), userId);
      await this.redis.expire(key, 10); // Typing indicators expire after 10 seconds
    } catch (error) {
      logger.error('Error setting user typing:', error);
    }
  }

  async removeUserTyping(conversationId: string, userId: string): Promise<void> {
    try {
      const key = `${this.KEYS.TYPING}${conversationId}`;
      await this.redis.zrem(key, userId);
    } catch (error) {
      logger.error('Error removing user typing:', error);
    }
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    try {
      const key = `${this.KEYS.TYPING}${conversationId}`;
      const cutoff = Date.now() - 10000; // 10 seconds ago
      
      // Remove expired entries and get active ones
      await this.redis.zremrangebyscore(key, '-inf', cutoff);
      const typingUsers = await this.redis.zrange(key, 0, -1);
      
      return typingUsers;
    } catch (error) {
      logger.error('Error getting typing users:', error);
      return [];
    }
  }

  // ==================== Cache Invalidation ====================

  async invalidateMessage(messageId: string): Promise<void> {
    try {
      const key = `${this.KEYS.MESSAGE}${messageId}`;
      await this.redis.del(key);
      this.cacheMetrics.evictions++;
    } catch (error) {
      logger.error('Error invalidating message:', error);
    }
  }

  async invalidateConversationMessages(conversationId: string): Promise<void> {
    try {
      const key = `${this.KEYS.CONVERSATION_MESSAGES}${conversationId}`;
      await this.redis.del(key);
      this.cacheMetrics.evictions++;
    } catch (error) {
      logger.error('Error invalidating conversation messages:', error);
    }
  }

  async invalidateConversationList(userId: string): Promise<void> {
    try {
      const key = `${this.KEYS.CONVERSATION_LIST}${userId}`;
      await this.redis.del(key);
      this.cacheMetrics.evictions++;
    } catch (error) {
      logger.error('Error invalidating conversation list:', error);
    }
  }

  async invalidateAllConversationLists(conversationId: string): Promise<void> {
    try {
      // Get all participants of the conversation
      const participants = await this.participantRepo.find({
        where: { conversation_id: conversationId },
      });
      
      const pipeline = this.redis.pipeline();
      participants.forEach(participant => {
        const key = `${this.KEYS.CONVERSATION_LIST}${participant.user_id}`;
        pipeline.del(key);
      });
      
      await pipeline.exec();
      this.cacheMetrics.evictions += participants.length;
    } catch (error) {
      logger.error('Error invalidating all conversation lists:', error);
    }
  }

  // ==================== Cache Warming ====================

  async warmConversationCache(conversationId: string): Promise<void> {
    try {
      // Fetch recent messages
      const messages = await this.messageRepo
        .createQueryBuilder('message')
        .where('message.conversation_id = :conversationId', { conversationId })
        .andWhere('message.deleted_at IS NULL')
        .orderBy('message.created_at', 'DESC')
        .limit(this.MAX_MESSAGES_PER_CONVERSATION)
        .getMany();
      
      if (messages.length > 0) {
        await this.cacheMessages(messages);
        logger.info(`Warmed cache for conversation ${conversationId} with ${messages.length} messages`);
      }
    } catch (error) {
      logger.error('Error warming conversation cache:', error);
    }
  }

  async warmUserConversationsCache(userId: string): Promise<void> {
    try {
      // This would typically call the ConversationService to get user conversations
      // and cache them. For now, we'll just log the intent.
      logger.info(`Would warm conversation cache for user ${userId}`);
    } catch (error) {
      logger.error('Error warming user conversations cache:', error);
    }
  }

  // ==================== Cache Metrics ====================

  private updateMetrics(hit: boolean, requestCount = 1): void {
    this.cacheMetrics.totalRequests += requestCount;
    
    if (hit) {
      this.cacheMetrics.hits += requestCount;
    } else {
      this.cacheMetrics.misses += requestCount;
    }
    
    this.cacheMetrics.hitRate = this.cacheMetrics.totalRequests > 0
      ? (this.cacheMetrics.hits / this.cacheMetrics.totalRequests) * 100
      : 0;
  }

  async getCacheMetrics(): Promise<MessageCacheStats> {
    try {
      // Get cache size estimate
      const info = await this.redis.info('memory');
      const usedMemory = info.match(/used_memory:(\d+)/)?.[1];
      this.cacheMetrics.cacheSize = usedMemory ? parseInt(usedMemory, 10) : 0;
      
      // Store metrics in Redis for distributed access
      const key = this.KEYS.CACHE_METRICS;
      await this.redis.setex(key, this.STATS_TTL, JSON.stringify(this.cacheMetrics));
      
      return { ...this.cacheMetrics };
    } catch (error) {
      logger.error('Error getting cache metrics:', error);
      return { ...this.cacheMetrics };
    }
  }

  async resetCacheMetrics(): Promise<void> {
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      evictions: 0,
    };
    
    const key = this.KEYS.CACHE_METRICS;
    await this.redis.del(key);
  }

  private async initializeMetricsTracking(): Promise<void> {
    try {
      // Try to load existing metrics from Redis
      const key = this.KEYS.CACHE_METRICS;
      const cached = await this.redis.get(key);
      
      if (cached) {
        this.cacheMetrics = JSON.parse(cached);
      }
      
      // Set up periodic metrics persistence
      setInterval(async () => {
        await this.getCacheMetrics();
      }, 60000); // Every minute
    } catch (error) {
      logger.error('Error initializing metrics tracking:', error);
    }
  }

  // ==================== Utility Methods ====================

  async clearAllCaches(): Promise<void> {
    try {
      const patterns = [
        `${this.KEYS.MESSAGE}*`,
        `${this.KEYS.CONVERSATION}*`,
        `${this.KEYS.CONVERSATION_LIST}*`,
        `${this.KEYS.CONVERSATION_MESSAGES}*`,
        `${this.KEYS.UNREAD_COUNT}*`,
        `${this.KEYS.PRESENCE}*`,
        `${this.KEYS.TYPING}*`,
      ];
      
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          logger.info(`Cleared ${keys.length} keys matching pattern ${pattern}`);
        }
      }
      
      await this.resetCacheMetrics();
    } catch (error) {
      logger.error('Error clearing all caches:', error);
    }
  }
}

export const messageCacheService = new MessageCacheService();