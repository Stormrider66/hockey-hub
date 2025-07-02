"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const entities_1 = require("../entities");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class ConversationService {
    constructor() {
        this.conversationRepo = database_1.AppDataSource.getRepository(entities_1.Conversation);
        this.participantRepo = database_1.AppDataSource.getRepository(entities_1.ConversationParticipant);
        this.messageRepo = database_1.AppDataSource.getRepository(entities_1.Message);
    }
    async createConversation(userId, data) {
        // Validate direct conversations have exactly 2 participants
        if (data.type === entities_1.ConversationType.DIRECT && data.participant_ids.length !== 2) {
            throw new shared_lib_1.ConflictError('Direct conversations must have exactly 2 participants');
        }
        // Check if direct conversation already exists
        if (data.type === entities_1.ConversationType.DIRECT) {
            const existingConversation = await this.findExistingDirectConversation(data.participant_ids[0], data.participant_ids[1]);
            if (existingConversation) {
                return existingConversation;
            }
        }
        // Ensure creator is in participant list
        if (!data.participant_ids.includes(userId)) {
            data.participant_ids.push(userId);
        }
        // Create conversation
        const conversation = this.conversationRepo.create({
            type: data.type,
            name: data.name,
            description: data.description,
            avatar_url: data.avatar_url,
            created_by: userId,
            metadata: data.metadata,
        });
        await this.conversationRepo.save(conversation);
        // Add participants
        const participants = data.participant_ids.map((participantId) => {
            return this.participantRepo.create({
                conversation_id: conversation.id,
                user_id: participantId,
                role: participantId === userId ? entities_1.ParticipantRole.ADMIN : entities_1.ParticipantRole.MEMBER,
            });
        });
        await this.participantRepo.save(participants);
        // Create system message for group creation
        if (data.type === entities_1.ConversationType.GROUP || data.type === entities_1.ConversationType.TEAM) {
            await this.createSystemMessage(conversation.id, `Conversation created by user ${userId}`);
        }
        // Load and return with participants
        return this.getConversationById(conversation.id, userId);
    }
    async getConversationById(conversationId, userId) {
        // Check if user is participant
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
        const conversation = await this.conversationRepo
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.participants', 'participants', 'participants.left_at IS NULL')
            .where('conversation.id = :conversationId', { conversationId })
            .getOne();
        if (!conversation) {
            throw new shared_lib_1.NotFoundError('Conversation not found');
        }
        // Get last message
        const lastMessage = await this.messageRepo.findOne({
            where: { conversation_id: conversationId, deleted_at: (0, typeorm_1.IsNull)() },
            order: { created_at: 'DESC' },
        });
        // Get unread count
        const unreadCount = await this.getUnreadCount(conversationId, userId, participant.last_read_at);
        conversation.last_message = lastMessage || undefined;
        conversation.unread_count = unreadCount;
        conversation.participant_count = conversation.participants.length;
        return conversation;
    }
    async getUserConversations(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;
        const query = this.conversationRepo
            .createQueryBuilder('conversation')
            .innerJoin('conversation.participants', 'participant', 'participant.user_id = :userId AND participant.left_at IS NULL', { userId: params.user_id })
            .leftJoinAndSelect('conversation.participants', 'participants', 'participants.left_at IS NULL')
            .where('conversation.is_archived = :archived', { archived: params.include_archived || false });
        if (params.type) {
            query.andWhere('conversation.type = :type', { type: params.type });
        }
        const [conversations, total] = await query
            .orderBy('conversation.updated_at', 'DESC')
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        // Enhance conversations with last message and unread count
        const enhancedConversations = await Promise.all(conversations.map(async (conversation) => {
            const participant = await this.participantRepo.findOne({
                where: {
                    conversation_id: conversation.id,
                    user_id: params.user_id,
                },
            });
            const lastMessage = await this.messageRepo.findOne({
                where: { conversation_id: conversation.id, deleted_at: (0, typeorm_1.IsNull)() },
                order: { created_at: 'DESC' },
            });
            const unreadCount = await this.getUnreadCount(conversation.id, params.user_id, participant?.last_read_at);
            conversation.last_message = lastMessage || undefined;
            conversation.unread_count = unreadCount;
            conversation.participant_count = conversation.participants.length;
            return conversation;
        }));
        return {
            conversations: enhancedConversations,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async updateConversation(conversationId, userId, data) {
        // Check if user is admin
        await this.checkUserIsAdmin(conversationId, userId);
        await this.conversationRepo.update(conversationId, {
            ...data,
            updated_at: new Date(),
        });
        return this.getConversationById(conversationId, userId);
    }
    async archiveConversation(conversationId, userId) {
        await this.checkUserIsAdmin(conversationId, userId);
        await this.conversationRepo.update(conversationId, {
            is_archived: true,
            updated_at: new Date(),
        });
        await this.createSystemMessage(conversationId, `Conversation archived by user ${userId}`);
    }
    async addParticipants(conversationId, userId, participantIds) {
        const conversation = await this.getConversationById(conversationId, userId);
        if (conversation.type === entities_1.ConversationType.DIRECT) {
            throw new shared_lib_1.ConflictError('Cannot add participants to direct conversations');
        }
        await this.checkUserIsAdmin(conversationId, userId);
        // Filter out existing participants
        const existingParticipants = await this.participantRepo.find({
            where: {
                conversation_id: conversationId,
                user_id: (0, typeorm_1.In)(participantIds),
            },
        });
        const existingUserIds = existingParticipants.map((p) => p.user_id);
        const newParticipantIds = participantIds.filter((id) => !existingUserIds.includes(id));
        if (newParticipantIds.length === 0) {
            return;
        }
        // Add new participants
        const newParticipants = newParticipantIds.map((participantId) => {
            return this.participantRepo.create({
                conversation_id: conversationId,
                user_id: participantId,
                role: entities_1.ParticipantRole.MEMBER,
            });
        });
        await this.participantRepo.save(newParticipants);
        // Create system message
        await this.createSystemMessage(conversationId, `${newParticipantIds.length} participant(s) added by user ${userId}`);
        // Update conversation timestamp
        await this.conversationRepo.update(conversationId, { updated_at: new Date() });
    }
    async removeParticipant(conversationId, userId, participantId) {
        const conversation = await this.getConversationById(conversationId, userId);
        if (conversation.type === entities_1.ConversationType.DIRECT) {
            throw new shared_lib_1.ConflictError('Cannot remove participants from direct conversations');
        }
        // Users can remove themselves, admins can remove anyone
        if (userId !== participantId) {
            await this.checkUserIsAdmin(conversationId, userId);
        }
        const participant = await this.participantRepo.findOne({
            where: {
                conversation_id: conversationId,
                user_id: participantId,
                left_at: (0, typeorm_1.IsNull)(),
            },
        });
        if (!participant) {
            throw new shared_lib_1.NotFoundError('Participant not found in conversation');
        }
        // Mark as left instead of deleting
        participant.left_at = new Date();
        await this.participantRepo.save(participant);
        // Create system message
        const message = userId === participantId
            ? `User ${participantId} left the conversation`
            : `User ${participantId} was removed by user ${userId}`;
        await this.createSystemMessage(conversationId, message);
        // Update conversation timestamp
        await this.conversationRepo.update(conversationId, { updated_at: new Date() });
    }
    async markAsRead(conversationId, userId) {
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
        participant.last_read_at = new Date();
        await this.participantRepo.save(participant);
    }
    async muteConversation(conversationId, userId, until) {
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
        participant.is_muted = true;
        participant.muted_until = until;
        await this.participantRepo.save(participant);
    }
    async unmuteConversation(conversationId, userId) {
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
        participant.is_muted = false;
        participant.muted_until = null;
        await this.participantRepo.save(participant);
    }
    // Helper methods
    async findExistingDirectConversation(userId1, userId2) {
        const conversations = await this.conversationRepo
            .createQueryBuilder('conversation')
            .innerJoin('conversation.participants', 'p1', 'p1.user_id = :userId1', { userId1 })
            .innerJoin('conversation.participants', 'p2', 'p2.user_id = :userId2', { userId2 })
            .where('conversation.type = :type', { type: entities_1.ConversationType.DIRECT })
            .andWhere('conversation.is_archived = false')
            .getOne();
        return conversations || null;
    }
    async checkUserIsAdmin(conversationId, userId) {
        const participant = await this.participantRepo.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                role: entities_1.ParticipantRole.ADMIN,
                left_at: (0, typeorm_1.IsNull)(),
            },
        });
        if (!participant) {
            throw new shared_lib_1.ForbiddenError('You must be an admin to perform this action');
        }
    }
    async createSystemMessage(conversationId, content) {
        const message = this.messageRepo.create({
            conversation_id: conversationId,
            sender_id: 'system',
            content,
            type: entities_1.MessageType.SYSTEM,
        });
        await this.messageRepo.save(message);
    }
    async getUnreadCount(conversationId, userId, lastReadAt) {
        const query = this.messageRepo
            .createQueryBuilder('message')
            .where('message.conversation_id = :conversationId', { conversationId })
            .andWhere('message.sender_id != :userId', { userId })
            .andWhere('message.deleted_at IS NULL');
        if (lastReadAt) {
            query.andWhere('message.created_at > :lastReadAt', { lastReadAt });
        }
        return query.getCount();
    }
}
exports.ConversationService = ConversationService;
//# sourceMappingURL=ConversationService.js.map