// @ts-nocheck - Query optimization service with Redis caching
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { AppDataSource, redisClient } from '../config/database';
import { Logger } from '@hockey-hub/shared-lib';
import { Message, Conversation, ConversationParticipant } from '../entities';

const logger = new Logger('QueryOptimizationService');

export class QueryOptimizationService {
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private slowQueryThreshold = 1000; // 1 second

  constructor() {
    this.setupQueryMonitoring();
  }

  private setupQueryMonitoring() {
    // Monitor slow queries
    if (process.env.NODE_ENV === 'development') {
      AppDataSource.subscribers.push({
        afterQuery(event) {
          const duration = event.executionTime || 0;
          if (duration > 1000) { // Log queries taking more than 1 second
            logger.warn(`Slow query detected (${duration}ms):`, {
              query: event.query,
              parameters: event.parameters,
            });
          }
        },
      });
    }
  }

  // Optimized query for getting conversation messages with all relations
  async getOptimizedConversationMessages(
    conversationId: string,
    limit: number = 50,
    beforeMessageId?: string
  ): Promise<Message[]> {
    const queryKey = `optimized_messages:${conversationId}:${limit}:${beforeMessageId || 'latest'}`;
    
    // Try cache first
    const cached = await this.getCachedQuery(queryKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    const query = AppDataSource
      .createQueryBuilder(Message, 'message')
      .where('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.deleted_at IS NULL')
      .orderBy('message.created_at', 'DESC')
      .take(limit);

    // Add cursor-based pagination if beforeMessageId is provided
    if (beforeMessageId) {
      query.andWhere(
        'message.created_at < (SELECT created_at FROM message WHERE id = :beforeMessageId)',
        { beforeMessageId }
      );
    }

    // Optimize joins - only load what's needed
    query
      .leftJoinAndSelect('message.attachments', 'attachments')
      .leftJoinAndSelect('message.reactions', 'reactions')
      .leftJoinAndSelect(
        'message.read_receipts',
        'read_receipts',
        'read_receipts.user_id IN (SELECT user_id FROM conversation_participant WHERE conversation_id = :conversationId AND is_active = true)',
        { conversationId }
      );

    // Use query hints for optimization
    query.setQueryHint('max_execution_time', '5000'); // 5 second timeout

    const messages = await query.getMany();

    const duration = Date.now() - startTime;
    this.recordQueryMetrics('getConversationMessages', duration);

    // Cache the result
    await this.cacheQuery(queryKey, messages, 60); // Cache for 1 minute

    return messages;
  }

  // Optimized query for unread message counts
  async getOptimizedUnreadCounts(userId: string): Promise<Map<string, number>> {
    const queryKey = `unread_counts:${userId}`;
    
    // Try cache first
    const cached = await this.getCachedQuery(queryKey);
    if (cached) {
      return new Map(cached);
    }

    const startTime = Date.now();

    // Use raw query for better performance
    const result = await AppDataSource.query(`
      SELECT 
        conversation_id,
        unread_count
      FROM conversation_unread_counts
      WHERE user_id = $1
      AND unread_count > 0
    `, [userId]);

    const unreadCounts = new Map<string, number>();
    result.forEach((row: any) => {
      unreadCounts.set(row.conversation_id, parseInt(row.unread_count));
    });

    const duration = Date.now() - startTime;
    this.recordQueryMetrics('getUnreadCounts', duration);

    // Cache the result
    await this.cacheQuery(queryKey, Array.from(unreadCounts), 30); // Cache for 30 seconds

    return unreadCounts;
  }

  // Batch fetch users to avoid N+1 queries
  async batchFetchUsers(userIds: string[]): Promise<Map<string, any>> {
    if (userIds.length === 0) return new Map();

    const uniqueIds = [...new Set(userIds)];
    const cacheKey = `users:${uniqueIds.sort().join(',')}`;

    // Try cache first
    const cached = await this.getCachedQuery(cacheKey);
    if (cached) {
      return new Map(cached);
    }

    // Fetch from user service in batches
    const batchSize = 100;
    const users = new Map<string, any>();

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      
      // This would call the user service API
      // For now, we'll simulate it
      const batchUsers = await this.fetchUsersFromService(batch);
      
      batchUsers.forEach(user => {
        users.set(user.id, user);
      });
    }

    // Cache the result
    await this.cacheQuery(cacheKey, Array.from(users), 300); // Cache for 5 minutes

    return users;
  }

  // Optimize conversation list query
  async getOptimizedUserConversations(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const queryKey = `user_conversations_optimized:${userId}:${limit}:${offset}`;
    
    // Try cache first
    const cached = await this.getCachedQuery(queryKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    // Use a CTE for better performance
    const result = await AppDataSource.query(`
      WITH user_conversations AS (
        SELECT DISTINCT c.*,
          COALESCE(uc.unread_count, 0) as unread_count,
          COALESCE((
            SELECT m.created_at 
            FROM message m 
            WHERE m.conversation_id = c.id 
            AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC 
            LIMIT 1
          ), c.created_at) as last_activity
        FROM conversation c
        INNER JOIN conversation_participant cp ON c.id = cp.conversation_id
        LEFT JOIN conversation_unread_counts uc ON uc.conversation_id = c.id AND uc.user_id = $1
        WHERE cp.user_id = $1
        AND cp.is_active = true
        AND c.is_archived = false
      )
      SELECT *, COUNT(*) OVER() as total_count
      FROM user_conversations
      ORDER BY last_activity DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const conversations = result.map((row: any) => {
      const { total_count, unread_count, last_activity, ...conversation } = row;
      return {
        ...conversation,
        unreadCount: unread_count,
        lastActivity: last_activity,
      };
    });

    const total = result.length > 0 ? result[0].total_count : 0;

    const duration = Date.now() - startTime;
    this.recordQueryMetrics('getUserConversations', duration);

    const response = { conversations, total };

    // Cache the result
    await this.cacheQuery(queryKey, response, 30); // Cache for 30 seconds

    return response;
  }

  // Refresh materialized views
  async refreshUnreadCounts(): Promise<void> {
    try {
      await AppDataSource.query('SELECT refresh_unread_counts()');
      logger.info('Unread counts materialized view refreshed');
    } catch (error) {
      logger.error('Failed to refresh unread counts:', error);
    }
  }

  // Query caching helpers
  private async getCachedQuery(key: string): Promise<any> {
    try {
      const cached = await redisClient.get(`query:${key}`);
      if (cached) {
        logger.debug(`Query cache hit: ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Failed to get cached query:', error);
    }
    return null;
  }

  private async cacheQuery(key: string, data: any, ttl: number): Promise<void> {
    try {
      await redisClient.setex(`query:${key}`, ttl, JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to cache query:', error);
    }
  }

  // Invalidate query caches
  async invalidateUserCaches(userId: string): Promise<void> {
    const patterns = [
      `query:user_conversations_optimized:${userId}:*`,
      `query:unread_counts:${userId}`,
      `query:optimized_messages:*`,
    ];

    for (const pattern of patterns) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          logger.debug(`Invalidated ${keys.length} cache keys for pattern: ${pattern}`);
        }
      } catch (error) {
        logger.warn('Failed to invalidate caches:', error);
      }
    }
  }

  // Query metrics tracking
  private recordQueryMetrics(queryName: string, duration: number) {
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        avgDuration: 0,
        slowQueries: 0,
      });
    }

    const metrics = this.queryMetrics.get(queryName)!;
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.avgDuration = metrics.totalDuration / metrics.count;

    if (duration > this.slowQueryThreshold) {
      metrics.slowQueries++;
    }
  }

  // Get query performance report
  getQueryPerformanceReport(): Record<string, QueryMetrics> {
    const report: Record<string, QueryMetrics> = {};
    
    this.queryMetrics.forEach((metrics, queryName) => {
      report[queryName] = { ...metrics };
    });

    return report;
  }

  // Simulate user service call
  private async fetchUsersFromService(userIds: string[]): Promise<any[]> {
    // In production, this would make an HTTP request to the user service
    // For now, return mock data
    return userIds.map(id => ({
      id,
      name: `User ${id}`,
      avatar: null,
      status: 'active',
    }));
  }

  // Schedule periodic maintenance
  startMaintenanceTasks() {
    // Refresh materialized views every 5 minutes
    setInterval(() => {
      this.refreshUnreadCounts();
    }, 5 * 60 * 1000);

    // Log query metrics every hour
    setInterval(() => {
      const report = this.getQueryPerformanceReport();
      logger.info('Query performance report:', report);
    }, 60 * 60 * 1000);
  }
}

interface QueryMetrics {
  count: number;
  totalDuration: number;
  maxDuration: number;
  minDuration: number;
  avgDuration: number;
  slowQueries: number;
}