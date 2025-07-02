"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedConversationRepository = void 0;
const database_1 = require("../config/database");
const Conversation_1 = require("../entities/Conversation");
const ConversationParticipant_1 = require("../entities/ConversationParticipant");
const Message_1 = require("../entities/Message");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedConversationRepository {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
        this.longTTL = 1800; // 30 minutes for static data
        this.repository = database_1.AppDataSource.getRepository(Conversation_1.Conversation);
    }
    // Conversation management
    async findById(id, useCache = true) {
        const cacheKey = `conversation:${id}`;
        if (useCache) {
            try {
                const cached = await database_1.redisClient.get(cacheKey);
                if (cached) {
                    shared_lib_1.logger.debug(`Cache hit for conversation: ${id}`);
                    return JSON.parse(cached);
                }
            }
            catch (error) {
                shared_lib_1.logger.warn('Redis get error for conversation:', error);
            }
        }
        const conversation = await this.repository.findOne({
            where: { id, is_archived: false },
            relations: ['participants', 'messages'],
            order: { 'messages.created_at': 'DESC' }
        });
        if (conversation && useCache) {
            try {
                await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(conversation));
            }
            catch (error) {
                shared_lib_1.logger.warn('Redis set error for conversation:', error);
            }
        }
        return conversation;
    }
    async findUserConversations(userId, limit = 20, offset = 0) {
        const cacheKey = `user_conversations:${userId}:${limit}:${offset}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for user conversations: ${userId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for user conversations:', error);
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
        const conversationsWithVirtuals = await Promise.all(conversations.map(async (conv) => {
            // Get last message
            const lastMessage = await database_1.AppDataSource.getRepository(Message_1.Message)
                .findOne({
                where: { conversation_id: conv.id },
                order: { created_at: 'DESC' }
            });
            // Get unread count for this user
            const unreadCount = await database_1.AppDataSource.getRepository(Message_1.Message)
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
        }));
        const result = {
            conversations: conversationsWithVirtuals,
            total
        };
        try {
            await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for user conversations:', error);
        }
        return result;
    }
    async findTeamConversations(teamId, limit = 20, offset = 0) {
        const cacheKey = `team_conversations:${teamId}:${limit}:${offset}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for team conversations: ${teamId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for team conversations:', error);
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
            await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for team conversations:', error);
        }
        return result;
    }
    // Conversation creation and updates
    async create(conversationData) {
        const conversation = this.repository.create(conversationData);
        const savedConversation = await this.repository.save(conversation);
        // Invalidate related caches
        await this.invalidateUserCaches(conversationData.created_by);
        if (conversationData.metadata?.team_id) {
            await this.invalidateTeamCaches(conversationData.metadata.team_id);
        }
        return savedConversation;
    }
    async update(id, updates) {
        const conversation = await this.repository.findOne({
            where: { id },
            relations: ['participants']
        });
        if (!conversation)
            return null;
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
    async archive(id) {
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
    async addParticipant(conversationId, userId, role = 'member') {
        try {
            const participantRepo = database_1.AppDataSource.getRepository(ConversationParticipant_1.ConversationParticipant);
            // Check if participant already exists
            const existing = await participantRepo.findOne({
                where: { conversation_id: conversationId, user_id: userId }
            });
            if (existing) {
                // Reactivate if inactive
                if (!existing.is_active) {
                    await participantRepo.update(existing.id, {
                        is_active: true,
                        role: role
                    });
                }
            }
            else {
                // Create new participant
                const participant = participantRepo.create({
                    conversation_id: conversationId,
                    user_id: userId,
                    role: role,
                    is_active: true
                });
                await participantRepo.save(participant);
            }
            // Invalidate caches
            await this.invalidateConversationCache(conversationId);
            await this.invalidateUserCaches(userId);
            return true;
        }
        catch (error) {
            shared_lib_1.logger.error('Error adding participant:', error);
            return false;
        }
    }
    async removeParticipant(conversationId, userId) {
        try {
            const participantRepo = database_1.AppDataSource.getRepository(ConversationParticipant_1.ConversationParticipant);
            const result = await participantRepo.update({ conversation_id: conversationId, user_id: userId }, { is_active: false });
            if (result.affected && result.affected > 0) {
                // Invalidate caches
                await this.invalidateConversationCache(conversationId);
                await this.invalidateUserCaches(userId);
                return true;
            }
            return false;
        }
        catch (error) {
            shared_lib_1.logger.error('Error removing participant:', error);
            return false;
        }
    }
    // Cache invalidation
    async invalidateConversationCache(conversationId) {
        try {
            const pattern = `conversation:${conversationId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} conversation cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating conversation cache:', error);
        }
    }
    async invalidateUserCaches(userId) {
        try {
            const pattern = `user_conversations:${userId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} user conversation cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating user conversation cache:', error);
        }
    }
    async invalidateTeamCaches(teamId) {
        try {
            const pattern = `team_conversations:${teamId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} team conversation cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating team conversation cache:', error);
        }
    }
    // Analytics methods
    async getConversationStats(conversationId) {
        const cacheKey = `conversation_stats:${conversationId}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for conversation stats: ${conversationId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for conversation stats:', error);
        }
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        const participantRepo = database_1.AppDataSource.getRepository(ConversationParticipant_1.ConversationParticipant);
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
            await database_1.redisClient.setex(cacheKey, this.longTTL, JSON.stringify(stats));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for conversation stats:', error);
        }
        return stats;
    }
    async calculateAverageResponseTime(conversationId) {
        // Simplified calculation - in real implementation, you'd want more sophisticated analysis
        const messages = await database_1.AppDataSource.getRepository(Message_1.Message)
            .find({
            where: { conversation_id: conversationId, deleted_at: null },
            order: { created_at: 'ASC' },
            take: 100 // Analyze last 100 messages
        });
        if (messages.length < 2)
            return 0;
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
exports.CachedConversationRepository = CachedConversationRepository;
//# sourceMappingURL=CachedConversationRepository.js.map