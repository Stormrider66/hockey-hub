"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const entities_1 = require("../entities");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class MessageService {
    constructor() {
        this.EDIT_TIME_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
        this.messageRepo = database_1.AppDataSource.getRepository(entities_1.Message);
        this.participantRepo = database_1.AppDataSource.getRepository(entities_1.ConversationParticipant);
        this.attachmentRepo = database_1.AppDataSource.getRepository(entities_1.MessageAttachment);
        this.reactionRepo = database_1.AppDataSource.getRepository(entities_1.MessageReaction);
        this.readReceiptRepo = database_1.AppDataSource.getRepository(entities_1.MessageReadReceipt);
        this.conversationRepo = database_1.AppDataSource.getRepository(entities_1.Conversation);
    }
    async sendMessage(conversationId, userId, data) {
        // Verify user is participant
        await this.verifyParticipant(conversationId, userId);
        // Validate content
        if (!data.content.trim() && (!data.attachments || data.attachments.length === 0)) {
            throw new shared_lib_1.ValidationError('Message must have content or attachments');
        }
        // Validate reply_to_id if provided
        if (data.reply_to_id) {
            const replyToMessage = await this.messageRepo.findOne({
                where: {
                    id: data.reply_to_id,
                    conversation_id: conversationId,
                    deleted_at: (0, typeorm_1.IsNull)(),
                },
            });
            if (!replyToMessage) {
                throw new shared_lib_1.NotFoundError('Reply message not found');
            }
        }
        // Create message
        const message = this.messageRepo.create({
            conversation_id: conversationId,
            sender_id: userId,
            content: data.content,
            type: data.type || entities_1.MessageType.TEXT,
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
        return message;
    }
    async getMessages(userId, params) {
        // Verify user is participant
        await this.verifyParticipant(params.conversation_id, userId);
        const limit = params.limit || 50;
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
        const enhancedMessages = await Promise.all(messages.map(async (message) => {
            // Check if current user has read this message
            const readReceipt = await this.readReceiptRepo.findOne({
                where: {
                    message_id: message.id,
                    user_id: userId,
                },
            });
            message.is_read = !!readReceipt;
            // Calculate reaction counts
            const reactionCounts = {};
            message.reactions.forEach((reaction) => {
                reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
            });
            message.reaction_counts = reactionCounts;
            return message;
        }));
        return {
            messages: enhancedMessages.reverse(), // Return in chronological order
            hasMore,
        };
    }
    async editMessage(messageId, userId, data) {
        const message = await this.messageRepo.findOne({
            where: {
                id: messageId,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
            relations: ['conversation'],
        });
        if (!message) {
            throw new shared_lib_1.NotFoundError('Message not found');
        }
        // Verify user is sender
        if (message.sender_id !== userId) {
            throw new shared_lib_1.ForbiddenError('You can only edit your own messages');
        }
        // Check time limit
        const timeSinceCreation = Date.now() - message.created_at.getTime();
        if (timeSinceCreation > this.EDIT_TIME_LIMIT_MS) {
            throw new shared_lib_1.ForbiddenError('Message can no longer be edited');
        }
        // System messages cannot be edited
        if (message.type === entities_1.MessageType.SYSTEM) {
            throw new shared_lib_1.ForbiddenError('System messages cannot be edited');
        }
        // Update message
        message.content = data.content;
        message.edited_at = new Date();
        await this.messageRepo.save(message);
        return message;
    }
    async deleteMessage(messageId, userId) {
        const message = await this.messageRepo.findOne({
            where: {
                id: messageId,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
        if (!message) {
            throw new shared_lib_1.NotFoundError('Message not found');
        }
        // Verify user is sender or admin
        if (message.sender_id !== userId) {
            const participant = await this.participantRepo.findOne({
                where: {
                    conversation_id: message.conversation_id,
                    user_id: userId,
                    left_at: (0, typeorm_1.IsNull)(),
                },
            });
            if (!participant || participant.role !== 'admin') {
                throw new shared_lib_1.ForbiddenError('You can only delete your own messages');
            }
        }
        // Soft delete
        message.deleted_at = new Date();
        await this.messageRepo.save(message);
        return message;
    }
    async addReaction(messageId, userId, data) {
        const message = await this.messageRepo.findOne({
            where: {
                id: messageId,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
        if (!message) {
            throw new shared_lib_1.NotFoundError('Message not found');
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
    async removeReaction(messageId, userId, emoji) {
        const reaction = await this.reactionRepo.findOne({
            where: {
                message_id: messageId,
                user_id: userId,
                emoji,
            },
        });
        if (!reaction) {
            throw new shared_lib_1.NotFoundError('Reaction not found');
        }
        await this.reactionRepo.remove(reaction);
    }
    async markAsRead(messageIds, userId) {
        if (messageIds.length === 0) {
            return;
        }
        // Get messages to verify they exist and get conversation IDs
        const messages = await this.messageRepo.find({
            where: {
                id: (0, typeorm_1.In)(messageIds),
                deleted_at: (0, typeorm_1.IsNull)(),
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
            await this.participantRepo.update({
                conversation_id: conversationId,
                user_id: userId,
            }, {
                last_read_at: new Date(),
            });
        }
    }
    async searchMessages(userId, query, conversationIds) {
        const queryBuilder = this.messageRepo
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.conversation', 'conversation')
            .innerJoin('conversation.participants', 'participant', 'participant.user_id = :userId AND participant.left_at IS NULL', { userId })
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
    async verifyParticipant(conversationId, userId) {
        const participant = await this.participantRepo.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                left_at: (0, typeorm_1.IsNull)(),
            },
        });
        if (!participant) {
            throw new shared_lib_1.ForbiddenError('You are not a participant in this conversation');
        }
    }
    determineAttachmentType(fileType) {
        if (fileType.startsWith('image/'))
            return 'image';
        if (fileType.startsWith('video/'))
            return 'video';
        if (fileType.startsWith('audio/'))
            return 'audio';
        if (fileType === 'application/pdf' ||
            fileType.startsWith('application/msword') ||
            fileType.startsWith('application/vnd.')) {
            return 'document';
        }
        return 'other';
    }
}
exports.MessageService = MessageService;
//# sourceMappingURL=MessageService.js.map