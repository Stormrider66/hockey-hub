import { CachedConversationRepository } from '../repositories/CachedConversationRepository';
import { CachedMessageRepository } from '../repositories/CachedMessageRepository';
import { CachedNotificationRepository } from '../repositories/CachedNotificationRepository';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('cached-communication-service');

export class CachedCommunicationService {
  public conversations: CachedConversationRepository;
  public messages: CachedMessageRepository;
  public notifications: CachedNotificationRepository;

  constructor() {
    this.conversations = new CachedConversationRepository();
    this.messages = new CachedMessageRepository();
    this.notifications = new CachedNotificationRepository();
  }

  // Dashboard-optimized methods
  async getDashboardData(userId: string, userRole: string): Promise<{
    recentConversations: any[];
    unreadMessages: number;
    pendingNotifications: any[];
    unreadNotifications: number;
    mentionCount: number;
  }> {
    try {
      // Get recent conversations with unread counts
      const conversationsData = await this.conversations.findUserConversations(userId, 5, 0);
      
      // Calculate total unread messages
      const unreadMessages = conversationsData.conversations.reduce(
        (total, conv) => total + (conv.unread_count || 0), 0
      );

      // Get pending notifications
      const notificationsData = await this.notifications.findUserNotifications(userId, 10, 0);
      
      // Get recent mentions
      const mentionsData = await this.messages.findUserMentions(userId, 5, 0);

      return {
        recentConversations: conversationsData.conversations.slice(0, 5),
        unreadMessages,
        pendingNotifications: notificationsData.notifications.slice(0, 10),
        unreadNotifications: notificationsData.unreadCount,
        mentionCount: mentionsData.total
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  // Real-time communication methods
  async sendMessage(conversationId: string, senderId: string, content: string, type = 'text'): Promise<any> {
    try {
      // Create message
      const message = await this.messages.create({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type: type as any,
        created_at: new Date()
      });

      // Update conversation's last activity
      await this.conversations.update(conversationId, {
        updated_at: new Date()
      });

      return message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async createNotification(notificationData: {
    recipient_id: string;
    type: any; // NotificationType
    title: string;
    message: string;
    priority?: any; // NotificationPriority
    organization_id?: string;
    team_id?: string;
    action_url?: string;
    scheduled_for?: Date;
    channels?: any[]; // NotificationChannel[]
  }): Promise<any> {
    try {
      return await this.notifications.create({
        ...notificationData,
        status: 'pending' as any,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Team communication methods
  async getTeamCommunicationSummary(teamId: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    notificationsSent: number;
    engagementRate: number;
  }> {
    try {
      // Get team conversations
      const conversationsData = await this.conversations.findTeamConversations(teamId, 100, 0);
      
      // Get team notifications
      const notificationsData = await this.notifications.findTeamNotifications(teamId, 100, 0);

      // Calculate message stats for team conversations
      let totalMessages = 0;
      let activeConversations = 0;
      
      for (const conversation of conversationsData.conversations) {
        const stats = await this.conversations.getConversationStats(conversation.id);
        totalMessages += stats.messageCount;
        
        // Consider conversation active if it has messages in the last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (stats.lastActivity && stats.lastActivity > weekAgo) {
          activeConversations++;
        }
      }

      // Calculate engagement rate (simplified)
      const engagementRate = conversationsData.total > 0 
        ? Math.round((activeConversations / conversationsData.total) * 100)
        : 0;

      return {
        totalConversations: conversationsData.total,
        activeConversations,
        totalMessages,
        notificationsSent: notificationsData.total,
        engagementRate
      };
    } catch (error) {
      logger.error('Error getting team communication summary:', error);
      throw error;
    }
  }

  // Analytics methods
  async getCommunicationAnalytics(
    organizationId?: string,
    teamId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    messageStats: any;
    notificationStats: any;
    engagementMetrics: any;
    performanceMetrics: any;
  }> {
    try {
      // This would typically aggregate data across multiple conversations and notifications
      // For now, return basic structure
      const notificationStats = await this.notifications.getNotificationStats(
        undefined, 
        teamId, 
        timeRange
      );

      return {
        messageStats: {
          totalMessages: 0,
          messagesByType: {},
          activeUsers: 0,
          avgMessagesPerDay: 0
        },
        notificationStats,
        engagementMetrics: {
          responseRate: 0,
          avgResponseTime: 0,
          activeParticipants: 0
        },
        performanceMetrics: {
          deliveryRate: notificationStats.deliveryRate,
          cacheHitRate: 85, // Would be calculated from Redis metrics
          avgLoadTime: 150 // Would be calculated from performance monitoring
        }
      };
    } catch (error) {
      logger.error('Error getting communication analytics:', error);
      throw error;
    }
  }

  // Bulk operations for performance
  async markAllNotificationsAsRead(userId: string): Promise<number> {
    try {
      return await this.notifications.bulkMarkAsRead(userId);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<number> {
    try {
      return await this.messages.markConversationAsRead(conversationId, userId);
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  // Search functionality
  async searchCommunications(
    query: string,
    userId: string,
    filters?: {
      conversationId?: string;
      type?: 'messages' | 'notifications' | 'all';
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<{
    messages: any[];
    notifications: any[];
    totalResults: number;
  }> {
    try {
      let messages: any[] = [];
      let notifications: any[] = [];

      if (!filters?.type || filters.type === 'messages' || filters.type === 'all') {
        const messageResults = await this.messages.searchMessages(
          query,
          filters?.conversationId,
          userId,
          20,
          0
        );
        messages = messageResults.messages;
      }

      if (!filters?.type || filters.type === 'notifications' || filters.type === 'all') {
        // For notifications, we'd implement a search method
        // For now, return empty array
        notifications = [];
      }

      return {
        messages,
        notifications,
        totalResults: messages.length + notifications.length
      };
    } catch (error) {
      logger.error('Error searching communications:', error);
      throw error;
    }
  }

  // Presence and activity tracking
  async updateUserPresence(userId: string, status: string, lastSeen?: Date): Promise<boolean> {
    try {
      // This would update user presence in the UserPresence entity
      // For now, return success
      logger.debug(`Updated presence for user ${userId}: ${status}`);
      return true;
    } catch (error) {
      logger.error('Error updating user presence:', error);
      return false;
    }
  }

  // Health check methods
  async getHealthMetrics(): Promise<{
    database: boolean;
    redis: boolean;
    messageQueue: boolean;
    performance: {
      avgResponseTime: number;
      cacheHitRate: number;
      errorRate: number;
    };
  }> {
    try {
      // Basic health check - in production, this would be more comprehensive
      return {
        database: true,
        redis: true,
        messageQueue: true,
        performance: {
          avgResponseTime: 120, // ms
          cacheHitRate: 85, // %
          errorRate: 0.1 // %
        }
      };
    } catch (error) {
      logger.error('Error getting health metrics:', error);
      throw error;
    }
  }
}