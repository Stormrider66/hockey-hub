"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const entities_1 = require("../entities");
class PresenceService {
    constructor() {
        // In-memory typing indicators (should be moved to Redis in production)
        this.typingIndicators = new Map();
        this.TYPING_TIMEOUT_MS = 5000;
        this.AWAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
        this.OFFLINE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
        this.presenceRepo = database_1.AppDataSource.getRepository(entities_1.UserPresence);
        this.participantRepo = database_1.AppDataSource.getRepository(entities_1.ConversationParticipant);
    }
    async updatePresence(userId, data) {
        let presence = await this.presenceRepo.findOne({
            where: { user_id: userId },
        });
        if (!presence) {
            presence = this.presenceRepo.create({
                user_id: userId,
                status: data.status,
                status_message: data.status_message,
                device_info: data.device_info,
                active_device: data.device_info?.platform,
            });
        }
        else {
            presence.status = data.status;
            presence.status_message = data.status_message || presence.status_message;
            presence.last_seen_at = new Date();
            if (data.device_info) {
                presence.device_info = data.device_info;
                presence.active_device = data.device_info.platform;
            }
            // Clear away/busy timestamps if going online
            if (data.status === entities_1.PresenceStatus.ONLINE) {
                presence.away_since = null;
                presence.busy_until = null;
            }
            else if (data.status === entities_1.PresenceStatus.AWAY && !presence.away_since) {
                presence.away_since = new Date();
            }
        }
        await this.presenceRepo.save(presence);
        return presence;
    }
    async getUserPresence(userId) {
        const presence = await this.presenceRepo.findOne({
            where: { user_id: userId },
        });
        if (presence) {
            // Check if presence should be updated to away/offline based on last seen
            const now = Date.now();
            const lastSeenTime = presence.last_seen_at.getTime();
            const timeSinceLastSeen = now - lastSeenTime;
            if (presence.status === entities_1.PresenceStatus.ONLINE &&
                timeSinceLastSeen > this.AWAY_TIMEOUT_MS) {
                presence.status = entities_1.PresenceStatus.AWAY;
                presence.away_since = new Date(lastSeenTime + this.AWAY_TIMEOUT_MS);
                await this.presenceRepo.save(presence);
            }
            else if ((presence.status === entities_1.PresenceStatus.ONLINE || presence.status === entities_1.PresenceStatus.AWAY) &&
                timeSinceLastSeen > this.OFFLINE_TIMEOUT_MS) {
                presence.status = entities_1.PresenceStatus.OFFLINE;
                await this.presenceRepo.save(presence);
            }
        }
        return presence;
    }
    async getMultipleUserPresence(userIds) {
        if (userIds.length === 0) {
            return [];
        }
        const presences = await this.presenceRepo.find({
            where: { user_id: (0, typeorm_1.In)(userIds) },
        });
        // Create a map for quick lookup
        const presenceMap = new Map(presences.map((p) => [p.user_id, p]));
        // Return presence info for all requested users
        return userIds.map((userId) => {
            const presence = presenceMap.get(userId);
            if (!presence) {
                return {
                    user_id: userId,
                    status: entities_1.PresenceStatus.OFFLINE,
                    last_seen_at: new Date(0), // Never seen
                };
            }
            // Check typing status
            const conversationTyping = this.getTypingConversation(userId);
            return {
                user_id: userId,
                status: presence.status,
                last_seen_at: presence.last_seen_at,
                status_message: presence.status_message,
                is_typing: !!conversationTyping,
                typing_in_conversation_id: conversationTyping,
            };
        });
    }
    async getOnlineUsersInOrganization(organizationId) {
        // This would need to join with user table to filter by organization
        // For now, returning online users within a time window
        const onlineThreshold = new Date(Date.now() - this.AWAY_TIMEOUT_MS);
        const onlinePresences = await this.presenceRepo.find({
            where: [
                { status: entities_1.PresenceStatus.ONLINE },
                { status: entities_1.PresenceStatus.AWAY, last_seen_at: (0, typeorm_1.MoreThan)(onlineThreshold) },
            ],
        });
        return onlinePresences.map((p) => p.user_id);
    }
    async getConversationPresence(conversationId) {
        // Get all participants in the conversation
        const participants = await this.participantRepo.find({
            where: {
                conversation_id: conversationId,
                left_at: null,
            },
        });
        const userIds = participants.map((p) => p.user_id);
        return this.getMultipleUserPresence(userIds);
    }
    // Typing indicators
    async setTyping(userId, conversationId) {
        // Verify user is participant
        const participant = await this.participantRepo.findOne({
            where: {
                conversation_id: conversationId,
                user_id: userId,
                left_at: null,
            },
        });
        if (!participant) {
            return;
        }
        // Clear existing timeout
        this.clearTyping(userId, conversationId);
        // Set new typing indicator
        if (!this.typingIndicators.has(conversationId)) {
            this.typingIndicators.set(conversationId, new Map());
        }
        const conversationTyping = this.typingIndicators.get(conversationId);
        // Set timeout to clear typing
        const timeout = setTimeout(() => {
            this.clearTyping(userId, conversationId);
        }, this.TYPING_TIMEOUT_MS);
        conversationTyping.set(userId, timeout);
    }
    async clearTyping(userId, conversationId) {
        const conversationTyping = this.typingIndicators.get(conversationId);
        if (conversationTyping) {
            const timeout = conversationTyping.get(userId);
            if (timeout) {
                clearTimeout(timeout);
                conversationTyping.delete(userId);
            }
            if (conversationTyping.size === 0) {
                this.typingIndicators.delete(conversationId);
            }
        }
    }
    getTypingUsers(conversationId) {
        const conversationTyping = this.typingIndicators.get(conversationId);
        if (!conversationTyping) {
            return [];
        }
        return Array.from(conversationTyping.keys());
    }
    getTypingConversation(userId) {
        for (const [conversationId, typingMap] of this.typingIndicators.entries()) {
            if (typingMap.has(userId)) {
                return conversationId;
            }
        }
        return undefined;
    }
    // Heartbeat for maintaining online status
    async heartbeat(userId) {
        await this.presenceRepo.update({ user_id: userId }, { last_seen_at: new Date() });
    }
    // Cleanup method for disconnections
    async handleDisconnect(userId) {
        // Clear all typing indicators for this user
        for (const [conversationId] of this.typingIndicators.entries()) {
            this.clearTyping(userId, conversationId);
        }
        // Update presence to away
        await this.updatePresence(userId, {
            status: entities_1.PresenceStatus.AWAY,
        });
    }
}
exports.PresenceService = PresenceService;
//# sourceMappingURL=PresenceService.js.map