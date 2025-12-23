// @ts-nocheck - Chat analytics service with complex entity relationships
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  Message,
  Conversation,
  ConversationParticipant,
  UserPresence,
  MessageReaction,
  MessageReadReceipt,
  Broadcast,
  SystemAnnouncement,
} from '../entities';
import { Logger } from '@hockey-hub/shared-lib';
import { ServiceClient } from '@hockey-hub/shared-lib';

const logger = new Logger('ChatAnalyticsService');

export interface ChatAnalyticsOverview {
  totalMessages: number;
  totalConversations: number;
  activeUsers: number;
  messageGrowth: number;
  conversationGrowth: number;
  userGrowth: number;
  avgMessagesPerConversation: number;
  avgResponseTime: number; // in minutes
}

export interface MessageVolumeData {
  date: string;
  messages: number;
  conversations: number;
  activeUsers: number;
}

export interface UserEngagementMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number; // in minutes
  avgMessagesPerUser: number;
  topActiveUsers: Array<{
    userId: string;
    userName: string;
    messageCount: number;
    conversationCount: number;
    lastActive: Date;
  }>;
}

export interface ConversationAnalytics {
  typeBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
    avgParticipants: number;
    avgMessages: number;
  }>;
  popularConversations: Array<{
    id: string;
    name: string;
    type: string;
    participantCount: number;
    messageCount: number;
    lastActivity: Date;
  }>;
  responseTimesByType: Array<{
    type: string;
    avgResponseTime: number;
    medianResponseTime: number;
  }>;
}

export interface UsagePatterns {
  hourlyActivity: Array<{
    hour: number;
    messageCount: number;
    activeUsers: number;
  }>;
  weeklyActivity: Array<{
    dayOfWeek: number;
    messageCount: number;
    activeUsers: number;
  }>;
  peakUsageTimes: Array<{
    timeRange: string;
    messageCount: number;
    description: string;
  }>;
}

export interface ContentAnalytics {
  messageTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  attachmentStats: {
    totalAttachments: number;
    imageCount: number;
    videoCount: number;
    audioCount: number;
    documentCount: number;
    avgFileSize: number;
  };
  reactionStats: {
    totalReactions: number;
    uniqueEmojis: number;
    topReactions: Array<{
      emoji: string;
      count: number;
    }>;
  };
  broadcastStats: {
    totalBroadcasts: number;
    totalRecipients: number;
    avgDeliveryRate: number;
    avgReadRate: number;
  };
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  organizationId?: string;
  teamId?: string;
  conversationType?: string;
  userId?: string;
}

export class ChatAnalyticsService {
  private messageRepository: Repository<Message>;
  private conversationRepository: Repository<Conversation>;
  private participantRepository: Repository<ConversationParticipant>;
  private presenceRepository: Repository<UserPresence>;
  private reactionRepository: Repository<MessageReaction>;
  private readReceiptRepository: Repository<MessageReadReceipt>;
  private broadcastRepository: Repository<Broadcast>;
  private systemAnnouncementRepository: Repository<SystemAnnouncement>;
  private userServiceClient: ServiceClient;

  constructor() {
    this.messageRepository = AppDataSource.getRepository(Message);
    this.conversationRepository = AppDataSource.getRepository(Conversation);
    this.participantRepository = AppDataSource.getRepository(ConversationParticipant);
    this.presenceRepository = AppDataSource.getRepository(UserPresence);
    this.reactionRepository = AppDataSource.getRepository(MessageReaction);
    this.readReceiptRepository = AppDataSource.getRepository(MessageReadReceipt);
    this.broadcastRepository = AppDataSource.getRepository(Broadcast);
    this.systemAnnouncementRepository = AppDataSource.getRepository(SystemAnnouncement);
    this.userServiceClient = new ServiceClient('user-service');
  }

  async getAnalyticsOverview(filters: AnalyticsFilters = {}): Promise<ChatAnalyticsOverview> {
    try {
      const endDate = filters.endDate || new Date();
      const startDate = filters.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

      // Build base queries with filters
      const messageQuery = this.messageRepository.createQueryBuilder('message')
        .leftJoin('message.conversation', 'conversation');
      
      const conversationQuery = this.conversationRepository.createQueryBuilder('conversation');
      
      this.applyFilters(messageQuery, filters, 'message');
      this.applyFilters(conversationQuery, filters, 'conversation');

      // Current period metrics
      const totalMessages = await messageQuery
        .where('message.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getCount();

      const totalConversations = await conversationQuery
        .where('conversation.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getCount();

      const activeUsers = await this.messageRepository
        .createQueryBuilder('message')
        .select('DISTINCT message.sender_id')
        .where('message.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getCount();

      // Previous period metrics for growth calculation
      const previousMessages = await messageQuery
        .where('message.created_at BETWEEN :previousStart AND :startDate', { previousStart: previousPeriodStart, startDate })
        .getCount();

      const previousConversations = await conversationQuery
        .where('conversation.created_at BETWEEN :previousStart AND :startDate', { previousStart: previousPeriodStart, startDate })
        .getCount();

      const previousActiveUsers = await this.messageRepository
        .createQueryBuilder('message')
        .select('DISTINCT message.sender_id')
        .where('message.created_at BETWEEN :previousStart AND :startDate', { previousStart: previousPeriodStart, startDate })
        .getCount();

      // Calculate growth percentages
      const messageGrowth = previousMessages > 0 ? ((totalMessages - previousMessages) / previousMessages) * 100 : 0;
      const conversationGrowth = previousConversations > 0 ? ((totalConversations - previousConversations) / previousConversations) * 100 : 0;
      const userGrowth = previousActiveUsers > 0 ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100 : 0;

      // Calculate averages
      const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

      // Calculate average response time (simplified - time between consecutive messages in conversations)
      const responseTimeQuery = await this.messageRepository.query(`
        WITH message_times AS (
          SELECT 
            conversation_id,
            sender_id,
            created_at,
            LAG(created_at) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_message_time,
            LAG(sender_id) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_sender_id
          FROM messages 
          WHERE created_at BETWEEN $1 AND $2
        )
        SELECT AVG(EXTRACT(EPOCH FROM (created_at - prev_message_time))/60) as avg_response_minutes
        FROM message_times 
        WHERE prev_message_time IS NOT NULL 
        AND sender_id != prev_sender_id
        AND EXTRACT(EPOCH FROM (created_at - prev_message_time)) < 3600
      `, [startDate, endDate]);

      const avgResponseTime = responseTimeQuery[0]?.avg_response_minutes || 0;

      return {
        totalMessages,
        totalConversations,
        activeUsers,
        messageGrowth,
        conversationGrowth,
        userGrowth,
        avgMessagesPerConversation,
        avgResponseTime,
      };
    } catch (error) {
      logger.error('Failed to get analytics overview', error);
      throw error;
    }
  }

  async getMessageVolumeData(filters: AnalyticsFilters = {}): Promise<MessageVolumeData[]> {
    try {
      const endDate = filters.endDate || new Date();
      const startDate = filters.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as messages,
          COUNT(DISTINCT conversation_id) as conversations,
          COUNT(DISTINCT sender_id) as active_users
        FROM messages 
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const results = await this.messageRepository.query(query, [startDate, endDate]);

      return results.map((row: any) => ({
        date: row.date,
        messages: parseInt(row.messages),
        conversations: parseInt(row.conversations),
        activeUsers: parseInt(row.active_users),
      }));
    } catch (error) {
      logger.error('Failed to get message volume data', error);
      throw error;
    }
  }

  async getUserEngagementMetrics(filters: AnalyticsFilters = {}): Promise<UserEngagementMetrics> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get active users for different periods
      const dailyActiveUsers = await this.messageRepository
        .createQueryBuilder('message')
        .select('DISTINCT message.sender_id')
        .where('message.created_at > :date', { date: oneDayAgo })
        .getCount();

      const weeklyActiveUsers = await this.messageRepository
        .createQueryBuilder('message')
        .select('DISTINCT message.sender_id')
        .where('message.created_at > :date', { date: oneWeekAgo })
        .getCount();

      const monthlyActiveUsers = await this.messageRepository
        .createQueryBuilder('message')
        .select('DISTINCT message.sender_id')
        .where('message.created_at > :date', { date: oneMonthAgo })
        .getCount();

      // Get total users from user service
      const totalUsersResponse = await this.userServiceClient.get('/api/users/count');
      const totalUsers = totalUsersResponse.data.count || 0;

      // Calculate average session duration from presence data
      const avgSessionQuery = await this.presenceRepository.query(`
        SELECT AVG(
          CASE 
            WHEN status = 'offline' AND last_seen_at > NOW() - INTERVAL '24 hours'
            THEN EXTRACT(EPOCH FROM (last_seen_at - (last_seen_at - INTERVAL '1 hour')))
            ELSE 3600
          END
        ) / 60 as avg_session_minutes
        FROM user_presence
        WHERE last_seen_at > NOW() - INTERVAL '7 days'
      `);

      const avgSessionDuration = avgSessionQuery[0]?.avg_session_minutes || 30;

      // Calculate average messages per user
      const avgMessagesQuery = await this.messageRepository.query(`
        SELECT AVG(message_count) as avg_messages
        FROM (
          SELECT sender_id, COUNT(*) as message_count
          FROM messages 
          WHERE created_at > $1
          GROUP BY sender_id
        ) user_messages
      `, [oneMonthAgo]);

      const avgMessagesPerUser = avgMessagesQuery[0]?.avg_messages || 0;

      // Get top active users
      const topActiveUsersQuery = await this.messageRepository.query(`
        SELECT 
          sender_id as user_id,
          COUNT(*) as message_count,
          COUNT(DISTINCT conversation_id) as conversation_count,
          MAX(created_at) as last_active
        FROM messages 
        WHERE created_at > $1
        GROUP BY sender_id
        ORDER BY message_count DESC
        LIMIT 10
      `, [oneMonthAgo]);

      // Fetch user details for top active users
      const topActiveUsers = await Promise.all(
        topActiveUsersQuery.map(async (user: any) => {
          try {
            const userResponse = await this.userServiceClient.get(`/api/users/${user.user_id}`);
            return {
              userId: user.user_id,
              userName: userResponse.data.name || 'Unknown User',
              messageCount: parseInt(user.message_count),
              conversationCount: parseInt(user.conversation_count),
              lastActive: new Date(user.last_active),
            };
          } catch {
            return {
              userId: user.user_id,
              userName: 'Unknown User',
              messageCount: parseInt(user.message_count),
              conversationCount: parseInt(user.conversation_count),
              lastActive: new Date(user.last_active),
            };
          }
        })
      );

      return {
        totalUsers,
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        avgSessionDuration,
        avgMessagesPerUser,
        topActiveUsers,
      };
    } catch (error) {
      logger.error('Failed to get user engagement metrics', error);
      throw error;
    }
  }

  async getConversationAnalytics(filters: AnalyticsFilters = {}): Promise<ConversationAnalytics> {
    try {
      // Type breakdown
      const typeBreakdownQuery = await this.conversationRepository.query(`
        SELECT 
          type,
          COUNT(*) as count,
          AVG(participant_count) as avg_participants,
          AVG(message_count) as avg_messages
        FROM (
          SELECT 
            c.type,
            c.id,
            COUNT(DISTINCT cp.user_id) as participant_count,
            COUNT(DISTINCT m.id) as message_count
          FROM conversations c
          LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
          LEFT JOIN messages m ON c.id = m.conversation_id
          WHERE c.created_at > NOW() - INTERVAL '30 days'
          GROUP BY c.type, c.id
        ) conv_stats
        GROUP BY type
        ORDER BY count DESC
      `);

      const totalConversations = typeBreakdownQuery.reduce((sum: number, row: any) => sum + parseInt(row.count), 0);
      
      const typeBreakdown = typeBreakdownQuery.map((row: any) => ({
        type: row.type,
        count: parseInt(row.count),
        percentage: totalConversations > 0 ? (parseInt(row.count) / totalConversations) * 100 : 0,
        avgParticipants: parseFloat(row.avg_participants) || 0,
        avgMessages: parseFloat(row.avg_messages) || 0,
      }));

      // Popular conversations
      const popularConversationsQuery = await this.conversationRepository.query(`
        SELECT 
          c.id,
          c.name,
          c.type,
          COUNT(DISTINCT cp.user_id) as participant_count,
          COUNT(DISTINCT m.id) as message_count,
          MAX(m.created_at) as last_activity
        FROM conversations c
        LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.created_at > NOW() - INTERVAL '30 days'
        GROUP BY c.id, c.name, c.type
        ORDER BY message_count DESC
        LIMIT 10
      `);

      const popularConversations = popularConversationsQuery.map((row: any) => ({
        id: row.id,
        name: row.name || 'Unnamed Conversation',
        type: row.type,
        participantCount: parseInt(row.participant_count) || 0,
        messageCount: parseInt(row.message_count) || 0,
        lastActivity: row.last_activity ? new Date(row.last_activity) : new Date(),
      }));

      // Response times by type (simplified)
      const responseTimesQuery = await this.conversationRepository.query(`
        WITH response_times AS (
          SELECT 
            c.type,
            EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at)))/60 as response_minutes
          FROM messages m
          JOIN conversations c ON m.conversation_id = c.id
          WHERE m.created_at > NOW() - INTERVAL '7 days'
          AND LAG(m.sender_id) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at) != m.sender_id
        )
        SELECT 
          type,
          AVG(response_minutes) as avg_response_time,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_minutes) as median_response_time
        FROM response_times
        WHERE response_minutes IS NOT NULL AND response_minutes < 1440
        GROUP BY type
      `);

      const responseTimesByType = responseTimesQuery.map((row: any) => ({
        type: row.type,
        avgResponseTime: parseFloat(row.avg_response_time) || 0,
        medianResponseTime: parseFloat(row.median_response_time) || 0,
      }));

      return {
        typeBreakdown,
        popularConversations,
        responseTimesByType,
      };
    } catch (error) {
      logger.error('Failed to get conversation analytics', error);
      throw error;
    }
  }

  async getUsagePatterns(filters: AnalyticsFilters = {}): Promise<UsagePatterns> {
    try {
      // Hourly activity pattern
      const hourlyActivityQuery = await this.messageRepository.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as message_count,
          COUNT(DISTINCT sender_id) as active_users
        FROM messages
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);

      const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
        const data = hourlyActivityQuery.find((row: any) => parseInt(row.hour) === i);
        return {
          hour: i,
          messageCount: data ? parseInt(data.message_count) : 0,
          activeUsers: data ? parseInt(data.active_users) : 0,
        };
      });

      // Weekly activity pattern (0 = Sunday, 6 = Saturday)
      const weeklyActivityQuery = await this.messageRepository.query(`
        SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          COUNT(*) as message_count,
          COUNT(DISTINCT sender_id) as active_users
        FROM messages
        WHERE created_at > NOW() - INTERVAL '4 weeks'
        GROUP BY EXTRACT(DOW FROM created_at)
        ORDER BY day_of_week
      `);

      const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
        const data = weeklyActivityQuery.find((row: any) => parseInt(row.day_of_week) === i);
        return {
          dayOfWeek: i,
          messageCount: data ? parseInt(data.message_count) : 0,
          activeUsers: data ? parseInt(data.active_users) : 0,
        };
      });

      // Peak usage times
      const peakTimes = hourlyActivity
        .map(({ hour, messageCount }) => ({ hour, messageCount }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 3)
        .map((peak, index) => {
          const getTimeRange = (hour: number) => {
            const startHour = hour;
            const endHour = (hour + 1) % 24;
            return `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`;
          };

          const getDescription = (hour: number) => {
            if (hour >= 6 && hour < 12) return 'Morning Peak';
            if (hour >= 12 && hour < 18) return 'Afternoon Peak';
            if (hour >= 18 && hour < 22) return 'Evening Peak';
            return 'Late Night Peak';
          };

          return {
            timeRange: getTimeRange(peak.hour),
            messageCount: peak.messageCount,
            description: getDescription(peak.hour),
          };
        });

      return {
        hourlyActivity,
        weeklyActivity,
        peakUsageTimes: peakTimes,
      };
    } catch (error) {
      logger.error('Failed to get usage patterns', error);
      throw error;
    }
  }

  async getContentAnalytics(filters: AnalyticsFilters = {}): Promise<ContentAnalytics> {
    try {
      const endDate = filters.endDate || new Date();
      const startDate = filters.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Message types breakdown
      const messageTypesQuery = await this.messageRepository.query(`
        SELECT 
          type,
          COUNT(*) as count
        FROM messages
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY type
        ORDER BY count DESC
      `, [startDate, endDate]);

      const totalMessages = messageTypesQuery.reduce((sum: number, row: any) => sum + parseInt(row.count), 0);
      
      const messageTypes = messageTypesQuery.map((row: any) => ({
        type: row.type,
        count: parseInt(row.count),
        percentage: totalMessages > 0 ? (parseInt(row.count) / totalMessages) * 100 : 0,
      }));

      // Attachment statistics
      const attachmentStatsQuery = await this.messageRepository.query(`
        SELECT 
          COUNT(*) as total_attachments,
          COUNT(CASE WHEN attachments::text LIKE '%"type":"image"%' THEN 1 END) as image_count,
          COUNT(CASE WHEN attachments::text LIKE '%"type":"video"%' THEN 1 END) as video_count,
          COUNT(CASE WHEN attachments::text LIKE '%"type":"audio"%' THEN 1 END) as audio_count,
          COUNT(CASE WHEN attachments::text LIKE '%"type":"document"%' THEN 1 END) as document_count,
          AVG((attachments->0->>'size')::bigint) as avg_file_size
        FROM messages
        WHERE created_at BETWEEN $1 AND $2
        AND attachments IS NOT NULL
        AND jsonb_array_length(attachments) > 0
      `, [startDate, endDate]);

      const attachmentStats = attachmentStatsQuery[0] ? {
        totalAttachments: parseInt(attachmentStatsQuery[0].total_attachments) || 0,
        imageCount: parseInt(attachmentStatsQuery[0].image_count) || 0,
        videoCount: parseInt(attachmentStatsQuery[0].video_count) || 0,
        audioCount: parseInt(attachmentStatsQuery[0].audio_count) || 0,
        documentCount: parseInt(attachmentStatsQuery[0].document_count) || 0,
        avgFileSize: parseFloat(attachmentStatsQuery[0].avg_file_size) || 0,
      } : {
        totalAttachments: 0,
        imageCount: 0,
        videoCount: 0,
        audioCount: 0,
        documentCount: 0,
        avgFileSize: 0,
      };

      // Reaction statistics
      const reactionStatsQuery = await this.reactionRepository.query(`
        SELECT 
          COUNT(*) as total_reactions,
          COUNT(DISTINCT emoji) as unique_emojis
        FROM message_reactions mr
        JOIN messages m ON mr.message_id = m.id
        WHERE m.created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);

      const topReactionsQuery = await this.reactionRepository.query(`
        SELECT 
          emoji,
          COUNT(*) as count
        FROM message_reactions mr
        JOIN messages m ON mr.message_id = m.id
        WHERE m.created_at BETWEEN $1 AND $2
        GROUP BY emoji
        ORDER BY count DESC
        LIMIT 10
      `, [startDate, endDate]);

      const reactionStats = {
        totalReactions: reactionStatsQuery[0] ? parseInt(reactionStatsQuery[0].total_reactions) : 0,
        uniqueEmojis: reactionStatsQuery[0] ? parseInt(reactionStatsQuery[0].unique_emojis) : 0,
        topReactions: topReactionsQuery.map((row: any) => ({
          emoji: row.emoji,
          count: parseInt(row.count),
        })),
      };

      // Broadcast statistics
      const broadcastStatsQuery = await this.broadcastRepository.query(`
        SELECT 
          COUNT(*) as total_broadcasts,
          SUM(total_recipients) as total_recipients,
          AVG(CASE WHEN total_recipients > 0 THEN (delivered_count::float / total_recipients) * 100 ELSE 0 END) as avg_delivery_rate,
          AVG(CASE WHEN delivered_count > 0 THEN (read_count::float / delivered_count) * 100 ELSE 0 END) as avg_read_rate
        FROM broadcasts
        WHERE created_at BETWEEN $1 AND $2
        AND status = 'sent'
      `, [startDate, endDate]);

      const broadcastStats = broadcastStatsQuery[0] ? {
        totalBroadcasts: parseInt(broadcastStatsQuery[0].total_broadcasts) || 0,
        totalRecipients: parseInt(broadcastStatsQuery[0].total_recipients) || 0,
        avgDeliveryRate: parseFloat(broadcastStatsQuery[0].avg_delivery_rate) || 0,
        avgReadRate: parseFloat(broadcastStatsQuery[0].avg_read_rate) || 0,
      } : {
        totalBroadcasts: 0,
        totalRecipients: 0,
        avgDeliveryRate: 0,
        avgReadRate: 0,
      };

      return {
        messageTypes,
        attachmentStats,
        reactionStats,
        broadcastStats,
      };
    } catch (error) {
      logger.error('Failed to get content analytics', error);
      throw error;
    }
  }

  async exportAnalyticsData(filters: AnalyticsFilters = {}): Promise<{
    overview: ChatAnalyticsOverview;
    messageVolume: MessageVolumeData[];
    userEngagement: UserEngagementMetrics;
    conversationAnalytics: ConversationAnalytics;
    usagePatterns: UsagePatterns;
    contentAnalytics: ContentAnalytics;
    exportedAt: Date;
  }> {
    try {
      const [overview, messageVolume, userEngagement, conversationAnalytics, usagePatterns, contentAnalytics] = await Promise.all([
        this.getAnalyticsOverview(filters),
        this.getMessageVolumeData(filters),
        this.getUserEngagementMetrics(filters),
        this.getConversationAnalytics(filters),
        this.getUsagePatterns(filters),
        this.getContentAnalytics(filters),
      ]);

      return {
        overview,
        messageVolume,
        userEngagement,
        conversationAnalytics,
        usagePatterns,
        contentAnalytics,
        exportedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to export analytics data', error);
      throw error;
    }
  }

  private applyFilters(query: any, filters: AnalyticsFilters, alias: string): void {
    if (filters.organizationId) {
      query.andWhere(`${alias}.organization_id = :organizationId`, { organizationId: filters.organizationId });
    }

    if (filters.teamId) {
      query.andWhere(`${alias}.team_id = :teamId`, { teamId: filters.teamId });
    }

    if (filters.conversationType && alias === 'conversation') {
      query.andWhere(`${alias}.type = :type`, { type: filters.conversationType });
    }

    if (filters.userId && alias === 'message') {
      query.andWhere(`${alias}.sender_id = :userId`, { userId: filters.userId });
    }
  }
}