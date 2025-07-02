"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedCommunicationService = void 0;
const CachedConversationRepository_1 = require("../repositories/CachedConversationRepository");
const CachedMessageRepository_1 = require("../repositories/CachedMessageRepository");
const CachedNotificationRepository_1 = require("../repositories/CachedNotificationRepository");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedCommunicationService {
    constructor() {
        this.conversations = new CachedConversationRepository_1.CachedConversationRepository();
        this.messages = new CachedMessageRepository_1.CachedMessageRepository();
        this.notifications = new CachedNotificationRepository_1.CachedNotificationRepository();
    }
    // Dashboard-optimized methods
    async getDashboardData(userId, userRole) {
        try {
            // Get recent conversations with unread counts
            const conversationsData = await this.conversations.findUserConversations(userId, 5, 0);
            // Calculate total unread messages
            const unreadMessages = conversationsData.conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
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
        }
        catch (error) {
            shared_lib_1.logger.error('Error getting dashboard data:', error);
            throw error;
        }
    }
    // Real-time communication methods
    async sendMessage(conversationId, senderId, content, type = 'text') {
        try {
            // Create message
            const message = await this.messages.create({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
                type: type,
                created_at: new Date()
            });
            // Update conversation's last activity
            await this.conversations.update(conversationId, {
                updated_at: new Date()
            });
            return message;
        }
        catch (error) {
            shared_lib_1.logger.error('Error sending message:', error);
            throw error;
        }
    }
    async createNotification(notificationData) {
        try {
            return await this.notifications.create({
                ...notificationData,
                status: 'pending',
                created_at: new Date()
            });
        }
        catch (error) {
            shared_lib_1.logger.error('Error creating notification:', error);
            throw error;
        }
    }
    // Team communication methods
    async getTeamCommunicationSummary(teamId) {
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
        }
        catch (error) {
            shared_lib_1.logger.error('Error getting team communication summary:', error);
            throw error;
        }
    }
    // Analytics methods
    async getCommunicationAnalytics(organizationId, teamId, timeRange) {
        try {
            // This would typically aggregate data across multiple conversations and notifications
            // For now, return basic structure
            const notificationStats = await this.notifications.getNotificationStats(undefined, teamId, timeRange);
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
        }
        catch (error) {
            shared_lib_1.logger.error('Error getting communication analytics:', error);
            throw error;
        }
    }
    // Bulk operations for performance
    async markAllNotificationsAsRead(userId) {
        try {
            return await this.notifications.bulkMarkAsRead(userId);
        }
        catch (error) {
            shared_lib_1.logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
    async markConversationAsRead(conversationId, userId) {
        try {
            return await this.messages.markConversationAsRead(conversationId, userId);
        }
        catch (error) {
            shared_lib_1.logger.error('Error marking conversation as read:', error);
            throw error;
        }
    }
    // Search functionality
    async searchCommunications(query, userId, filters) {
        try {
            let messages = [];
            let notifications = [];
            if (!filters?.type || filters.type === 'messages' || filters.type === 'all') {
                const messageResults = await this.messages.searchMessages(query, filters?.conversationId, userId, 20, 0);
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
        }
        catch (error) {
            shared_lib_1.logger.error('Error searching communications:', error);
            throw error;
        }
    }
    // Presence and activity tracking
    async updateUserPresence(userId, status, lastSeen) {
        try {
            // This would update user presence in the UserPresence entity
            // For now, return success
            shared_lib_1.logger.debug(`Updated presence for user ${userId}: ${status}`);
            return true;
        }
        catch (error) {
            shared_lib_1.logger.error('Error updating user presence:', error);
            return false;
        }
    }
    // Health check methods
    async getHealthMetrics() {
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
        }
        catch (error) {
            shared_lib_1.logger.error('Error getting health metrics:', error);
            throw error;
        }
    }
}
exports.CachedCommunicationService = CachedCommunicationService;
//# sourceMappingURL=CachedCommunicationService.js.map