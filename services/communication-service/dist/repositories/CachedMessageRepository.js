"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedMessageRepository = void 0;
const database_1 = require("../config/database");
const Message_1 = require("../entities/Message");
const MessageReaction_1 = require("../entities/MessageReaction");
const MessageReadReceipt_1 = require("../entities/MessageReadReceipt");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class CachedMessageRepository {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
        this.shortTTL = 60; // 1 minute for frequently changing data
        this.repository = database_1.AppDataSource.getRepository(Message_1.Message);
    }
    // Message retrieval
    async findById(id, useCache = true) {
        const cacheKey = `message:${id}`;
        if (useCache) {
            try {
                const cached = await database_1.redisClient.get(cacheKey);
                if (cached) {
                    shared_lib_1.logger.debug(`Cache hit for message: ${id}`);
                    return JSON.parse(cached);
                }
            }
            catch (error) {
                shared_lib_1.logger.warn('Redis get error for message:', error);
            }
        }
        const message = await this.repository.findOne({
            where: { id, deleted_at: null },
            relations: ['attachments', 'reactions', 'read_receipts', 'reply_to']
        });
        if (message && useCache) {
            try {
                await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(message));
            }
            catch (error) {
                shared_lib_1.logger.warn('Redis set error for message:', error);
            }
        }
        return message;
    }
    async findConversationMessages(conversationId, limit = 50, offset = 0, beforeMessageId) {
        const cacheKey = `conversation_messages:${conversationId}:${limit}:${offset}:${beforeMessageId || 'latest'}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for conversation messages: ${conversationId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for conversation messages:', error);
        }
        let queryBuilder = this.repository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.attachments', 'attachments')
            .leftJoinAndSelect('message.reactions', 'reactions')
            .leftJoinAndSelect('message.read_receipts', 'read_receipts')
            .leftJoinAndSelect('message.reply_to', 'reply_to')
            .where('message.conversation_id = :conversationId', { conversationId })
            .andWhere('message.deleted_at IS NULL')
            .orderBy('message.created_at', 'DESC');
        // If beforeMessageId is provided, get messages before that message
        if (beforeMessageId) {
            const beforeMessage = await this.repository.findOne({ where: { id: beforeMessageId } });
            if (beforeMessage) {
                queryBuilder = queryBuilder.andWhere('message.created_at < :beforeTime', {
                    beforeTime: beforeMessage.created_at
                });
            }
        }
        const [messages, total] = await queryBuilder
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        // Add virtual fields
        const messagesWithVirtuals = messages.map(message => ({
            ...message,
            reaction_counts: this.calculateReactionCounts(message.reactions || [])
        }));
        const hasMore = offset + messages.length < total;
        const result = {
            messages: messagesWithVirtuals,
            total,
            hasMore
        };
        try {
            // Cache for shorter time as messages change frequently
            await database_1.redisClient.setex(cacheKey, this.shortTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for conversation messages:', error);
        }
        return result;
    }
    async findUserMentions(userId, limit = 20, offset = 0) {
        const cacheKey = `user_mentions:${userId}:${limit}:${offset}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for user mentions: ${userId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for user mentions:', error);
        }
        // Search for mentions in message content
        const [messages, total] = await this.repository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.conversation', 'conversation')
            .where('message.content ILIKE :mention', { mention: `%@${userId}%` })
            .andWhere('message.deleted_at IS NULL')
            .orderBy('message.created_at', 'DESC')
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        const result = { messages, total };
        try {
            await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for user mentions:', error);
        }
        return result;
    }
    async searchMessages(query, conversationId, userId, limit = 20, offset = 0) {
        const cacheKey = `search:${Buffer.from(query).toString('base64')}:${conversationId || 'all'}:${userId || 'any'}:${limit}:${offset}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for message search: ${query}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for message search:', error);
        }
        let queryBuilder = this.repository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.conversation', 'conversation')
            .where('message.content ILIKE :query', { query: `%${query}%` })
            .andWhere('message.deleted_at IS NULL');
        if (conversationId) {
            queryBuilder = queryBuilder.andWhere('message.conversation_id = :conversationId', { conversationId });
        }
        if (userId) {
            queryBuilder = queryBuilder.andWhere('message.sender_id = :userId', { userId });
        }
        const [messages, total] = await queryBuilder
            .orderBy('message.created_at', 'DESC')
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        const result = { messages, total };
        try {
            // Cache search results for shorter time
            await database_1.redisClient.setex(cacheKey, this.shortTTL, JSON.stringify(result));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for message search:', error);
        }
        return result;
    }
    // Message creation and updates
    async create(messageData) {
        const message = this.repository.create(messageData);
        const savedMessage = await this.repository.save(message);
        // Invalidate related caches
        await this.invalidateConversationMessageCache(messageData.conversation_id);
        // Invalidate search and mention caches if needed
        if (messageData.content?.includes('@')) {
            await this.invalidateSearchCaches();
        }
        return savedMessage;
    }
    async update(id, updates) {
        const message = await this.repository.findOne({ where: { id } });
        if (!message)
            return null;
        await this.repository.update(id, {
            ...updates,
            edited_at: new Date()
        });
        const updatedMessage = await this.repository.findOne({
            where: { id },
            relations: ['attachments', 'reactions', 'read_receipts', 'reply_to']
        });
        // Invalidate caches
        await this.invalidateMessageCache(id);
        await this.invalidateConversationMessageCache(message.conversation_id);
        return updatedMessage;
    }
    async softDelete(id) {
        const result = await this.repository.update(id, {
            deleted_at: new Date(),
            content: '[Message deleted]'
        });
        if (result.affected && result.affected > 0) {
            const message = await this.repository.findOne({ where: { id } });
            if (message) {
                await this.invalidateMessageCache(id);
                await this.invalidateConversationMessageCache(message.conversation_id);
            }
            return true;
        }
        return false;
    }
    // Message reactions
    async addReaction(messageId, userId, emoji) {
        try {
            const reactionRepo = database_1.AppDataSource.getRepository(MessageReaction_1.MessageReaction);
            // Check if reaction already exists
            const existing = await reactionRepo.findOne({
                where: { message_id: messageId, user_id: userId, emoji }
            });
            if (existing)
                return false;
            // Create new reaction
            const reaction = reactionRepo.create({
                message_id: messageId,
                user_id: userId,
                emoji
            });
            await reactionRepo.save(reaction);
            // Invalidate caches
            await this.invalidateMessageCache(messageId);
            const message = await this.repository.findOne({ where: { id: messageId } });
            if (message) {
                await this.invalidateConversationMessageCache(message.conversation_id);
            }
            return true;
        }
        catch (error) {
            shared_lib_1.logger.error('Error adding reaction:', error);
            return false;
        }
    }
    async removeReaction(messageId, userId, emoji) {
        try {
            const reactionRepo = database_1.AppDataSource.getRepository(MessageReaction_1.MessageReaction);
            const result = await reactionRepo.delete({
                message_id: messageId,
                user_id: userId,
                emoji
            });
            if (result.affected && result.affected > 0) {
                // Invalidate caches
                await this.invalidateMessageCache(messageId);
                const message = await this.repository.findOne({ where: { id: messageId } });
                if (message) {
                    await this.invalidateConversationMessageCache(message.conversation_id);
                }
                return true;
            }
            return false;
        }
        catch (error) {
            shared_lib_1.logger.error('Error removing reaction:', error);
            return false;
        }
    }
    // Read receipts
    async markAsRead(messageId, userId) {
        try {
            const receiptRepo = database_1.AppDataSource.getRepository(MessageReadReceipt_1.MessageReadReceipt);
            // Check if read receipt already exists
            const existing = await receiptRepo.findOne({
                where: { message_id: messageId, user_id: userId }
            });
            if (existing)
                return true;
            // Create read receipt
            const receipt = receiptRepo.create({
                message_id: messageId,
                user_id: userId,
                read_at: new Date()
            });
            await receiptRepo.save(receipt);
            // Invalidate relevant caches
            await this.invalidateMessageCache(messageId);
            const message = await this.repository.findOne({ where: { id: messageId } });
            if (message) {
                await this.invalidateConversationMessageCache(message.conversation_id);
            }
            return true;
        }
        catch (error) {
            shared_lib_1.logger.error('Error marking message as read:', error);
            return false;
        }
    }
    async markConversationAsRead(conversationId, userId) {
        try {
            const receiptRepo = database_1.AppDataSource.getRepository(MessageReadReceipt_1.MessageReadReceipt);
            // Get all unread messages for this user in this conversation
            const unreadMessages = await this.repository
                .createQueryBuilder('message')
                .leftJoin('message.read_receipts', 'receipt', 'receipt.user_id = :userId', { userId })
                .where('message.conversation_id = :conversationId', { conversationId })
                .andWhere('message.sender_id != :userId', { userId })
                .andWhere('receipt.id IS NULL')
                .andWhere('message.deleted_at IS NULL')
                .getMany();
            // Create read receipts for all unread messages
            const receipts = unreadMessages.map(message => receiptRepo.create({
                message_id: message.id,
                user_id: userId,
                read_at: new Date()
            }));
            if (receipts.length > 0) {
                await receiptRepo.save(receipts);
                // Invalidate conversation message cache
                await this.invalidateConversationMessageCache(conversationId);
            }
            return receipts.length;
        }
        catch (error) {
            shared_lib_1.logger.error('Error marking conversation as read:', error);
            return 0;
        }
    }
    // Analytics methods
    async getMessageStats(conversationId, timeRange) {
        const cacheKey = `message_stats:${conversationId}:${timeRange ? `${timeRange.start.getTime()}-${timeRange.end.getTime()}` : 'all'}`;
        try {
            const cached = await database_1.redisClient.get(cacheKey);
            if (cached) {
                shared_lib_1.logger.debug(`Cache hit for message stats: ${conversationId}`);
                return JSON.parse(cached);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis get error for message stats:', error);
        }
        let queryBuilder = this.repository
            .createQueryBuilder('message')
            .where('message.conversation_id = :conversationId', { conversationId })
            .andWhere('message.deleted_at IS NULL');
        if (timeRange) {
            queryBuilder = queryBuilder
                .andWhere('message.created_at >= :start', { start: timeRange.start })
                .andWhere('message.created_at <= :end', { end: timeRange.end });
        }
        const messages = await queryBuilder.getMany();
        const totalMessages = messages.length;
        const messagesByType = messages.reduce((acc, message) => {
            acc[message.type] = (acc[message.type] || 0) + 1;
            return acc;
        }, {});
        const activeUsers = new Set(messages.map(m => m.sender_id)).size;
        // Calculate average messages per day
        const dayCount = timeRange
            ? Math.max(1, Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (24 * 60 * 60 * 1000)))
            : Math.max(1, Math.ceil((Date.now() - new Date(messages[0]?.created_at || Date.now()).getTime()) / (24 * 60 * 60 * 1000)));
        const avgMessagesPerDay = Math.round(totalMessages / dayCount);
        const stats = {
            totalMessages,
            messagesByType,
            activeUsers,
            avgMessagesPerDay
        };
        try {
            await database_1.redisClient.setex(cacheKey, this.defaultTTL, JSON.stringify(stats));
        }
        catch (error) {
            shared_lib_1.logger.warn('Redis set error for message stats:', error);
        }
        return stats;
    }
    // Utility methods
    calculateReactionCounts(reactions) {
        return reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
        }, {});
    }
    // Cache invalidation
    async invalidateMessageCache(messageId) {
        try {
            const pattern = `message:${messageId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} message cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating message cache:', error);
        }
    }
    async invalidateConversationMessageCache(conversationId) {
        try {
            const pattern = `conversation_messages:${conversationId}*`;
            const keys = await database_1.redisClient.keys(pattern);
            if (keys.length > 0) {
                await database_1.redisClient.del(...keys);
                shared_lib_1.logger.debug(`Invalidated ${keys.length} conversation message cache keys`);
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating conversation message cache:', error);
        }
    }
    async invalidateSearchCaches() {
        try {
            const patterns = ['search:*', 'user_mentions:*'];
            for (const pattern of patterns) {
                const keys = await database_1.redisClient.keys(pattern);
                if (keys.length > 0) {
                    await database_1.redisClient.del(...keys);
                    shared_lib_1.logger.debug(`Invalidated ${keys.length} search cache keys`);
                }
            }
        }
        catch (error) {
            shared_lib_1.logger.warn('Error invalidating search caches:', error);
        }
    }
}
exports.CachedMessageRepository = CachedMessageRepository;
//# sourceMappingURL=CachedMessageRepository.js.map