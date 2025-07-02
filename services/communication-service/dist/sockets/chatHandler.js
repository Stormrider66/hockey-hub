"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHandler = void 0;
const services_1 = require("../services");
const entities_1 = require("../entities");
class ChatHandler {
    constructor(io) {
        // Track user socket connections
        this.userSockets = new Map();
        this.io = io;
        this.conversationService = new services_1.ConversationService();
        this.messageService = new services_1.MessageService();
        this.presenceService = new services_1.PresenceService();
    }
    handleConnection(socket) {
        const userId = socket.userId;
        // Track user's socket
        this.addUserSocket(userId, socket.id);
        // Update user presence to online
        this.presenceService.updatePresence(userId, {
            status: entities_1.PresenceStatus.ONLINE,
            device_info: {
                platform: socket.handshake.headers['user-agent'] || 'unknown',
            },
        });
        // Emit presence update to relevant users
        this.emitPresenceUpdate(userId, entities_1.PresenceStatus.ONLINE);
        // Register event handlers
        this.registerConversationHandlers(socket);
        this.registerMessageHandlers(socket);
        this.registerPresenceHandlers(socket);
        this.registerTypingHandlers(socket);
        // Handle disconnection
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });
    }
    registerConversationHandlers(socket) {
        const userId = socket.userId;
        // Join conversation rooms
        socket.on('conversation:join', async (conversationId) => {
            try {
                // Verify user is participant
                const conversation = await this.conversationService.getConversationById(conversationId, userId);
                // Join the room
                socket.join(`conversation:${conversationId}`);
                // Send success acknowledgment
                socket.emit('conversation:joined', {
                    conversationId,
                    conversation,
                });
                // Get and send initial presence for conversation participants
                const presences = await this.presenceService.getConversationPresence(conversationId);
                socket.emit('presence:conversation', {
                    conversationId,
                    presences,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'conversation:join',
                    message: error.message,
                });
            }
        });
        // Leave conversation room
        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            // Clear typing indicator if any
            this.presenceService.clearTyping(userId, conversationId);
            socket.emit('conversation:left', { conversationId });
        });
        // Listen for conversation updates
        socket.on('conversation:update', async (data) => {
            try {
                const updated = await this.conversationService.updateConversation(data.conversationId, userId, data.updates);
                // Emit to all participants
                this.io.to(`conversation:${data.conversationId}`).emit('conversation:updated', {
                    conversation: updated,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'conversation:update',
                    message: error.message,
                });
            }
        });
    }
    registerMessageHandlers(socket) {
        const userId = socket.userId;
        // Send message
        socket.on('message:send', async (data) => {
            try {
                const message = await this.messageService.sendMessage(data.conversationId, userId, {
                    content: data.content,
                    type: data.type,
                    reply_to_id: data.replyToId,
                    attachments: data.attachments,
                });
                // Emit to all participants in the conversation
                this.io.to(`conversation:${data.conversationId}`).emit('message:new', {
                    conversationId: data.conversationId,
                    message,
                });
                // Update conversation's updated_at is handled in service
                // Emit conversation update event
                const conversation = await this.conversationService.getConversationById(data.conversationId, userId);
                this.io.to(`conversation:${data.conversationId}`).emit('conversation:updated', {
                    conversation,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'message:send',
                    message: error.message,
                });
            }
        });
        // Edit message
        socket.on('message:edit', async (data) => {
            try {
                const message = await this.messageService.editMessage(data.messageId, userId, { content: data.content });
                // Emit to all participants
                this.io.to(`conversation:${message.conversation_id}`).emit('message:updated', {
                    message,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'message:edit',
                    message: error.message,
                });
            }
        });
        // Delete message
        socket.on('message:delete', async (messageId) => {
            try {
                // Get message first to know conversation
                const message = await this.messageService.deleteMessage(messageId, userId);
                // Emit to all participants
                this.io.to(`conversation:${message.conversation_id}`).emit('message:deleted', {
                    messageId,
                    conversationId: message.conversation_id,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'message:delete',
                    message: error.message,
                });
            }
        });
        // Add reaction
        socket.on('reaction:add', async (data) => {
            try {
                await this.messageService.addReaction(data.messageId, userId, { emoji: data.emoji });
                // Get updated message to know conversation
                const message = await this.messageService.getMessages(userId, {
                    conversation_id: '', // Will be fetched from message
                    limit: 1,
                });
                // Emit to all participants
                this.io.to(`conversation:${message.messages[0].conversation_id}`).emit('reaction:added', {
                    messageId: data.messageId,
                    userId,
                    emoji: data.emoji,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'reaction:add',
                    message: error.message,
                });
            }
        });
        // Remove reaction
        socket.on('reaction:remove', async (data) => {
            try {
                await this.messageService.removeReaction(data.messageId, userId, data.emoji);
                // Emit to all participants (need to get conversation from message)
                socket.emit('reaction:removed', {
                    messageId: data.messageId,
                    userId,
                    emoji: data.emoji,
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'reaction:remove',
                    message: error.message,
                });
            }
        });
        // Mark messages as read
        socket.on('message:read', async (messageIds) => {
            try {
                await this.messageService.markAsRead(messageIds, userId);
                // Emit read receipts to conversation participants
                // This would need to be enhanced to get conversation IDs from messages
                socket.emit('read:receipts', {
                    messageIds,
                    userId,
                    readAt: new Date(),
                });
            }
            catch (error) {
                socket.emit('error', {
                    event: 'message:read',
                    message: error.message,
                });
            }
        });
    }
    registerPresenceHandlers(socket) {
        const userId = socket.userId;
        // Update presence
        socket.on('presence:update', async (data) => {
            try {
                await this.presenceService.updatePresence(userId, {
                    status: data.status,
                    status_message: data.statusMessage,
                });
                // Emit to relevant users
                this.emitPresenceUpdate(userId, data.status, data.statusMessage);
            }
            catch (error) {
                socket.emit('error', {
                    event: 'presence:update',
                    message: error.message,
                });
            }
        });
        // Heartbeat to maintain online status
        socket.on('presence:heartbeat', async () => {
            await this.presenceService.heartbeat(userId);
        });
    }
    registerTypingHandlers(socket) {
        const userId = socket.userId;
        // Start typing
        socket.on('typing:start', async (conversationId) => {
            try {
                await this.presenceService.setTyping(userId, conversationId);
                // Emit to other participants
                socket.to(`conversation:${conversationId}`).emit('typing:start', {
                    conversationId,
                    userId,
                });
            }
            catch (error) {
                // Silently fail for typing indicators
            }
        });
        // Stop typing
        socket.on('typing:stop', async (conversationId) => {
            try {
                await this.presenceService.clearTyping(userId, conversationId);
                // Emit to other participants
                socket.to(`conversation:${conversationId}`).emit('typing:stop', {
                    conversationId,
                    userId,
                });
            }
            catch (error) {
                // Silently fail for typing indicators
            }
        });
    }
    handleDisconnect(socket) {
        const userId = socket.userId;
        // Remove socket from tracking
        this.removeUserSocket(userId, socket.id);
        // If user has no more sockets, update presence
        if (!this.userSockets.has(userId) || this.userSockets.get(userId).size === 0) {
            // Update to away/offline after disconnect
            this.presenceService.handleDisconnect(userId);
            // Emit presence update
            this.emitPresenceUpdate(userId, entities_1.PresenceStatus.AWAY);
        }
    }
    // Helper methods
    addUserSocket(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);
    }
    removeUserSocket(userId, socketId) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        }
    }
    async emitPresenceUpdate(userId, status, statusMessage) {
        // Get all conversations this user is part of
        const conversations = await this.conversationService.getUserConversations({
            user_id: userId,
        });
        // Emit to all conversation rooms
        conversations.conversations.forEach((conversation) => {
            this.io.to(`conversation:${conversation.id}`).emit('presence:updated', {
                userId,
                status,
                statusMessage,
                lastSeenAt: new Date(),
            });
        });
    }
    // Get all socket IDs for a user
    getUserSockets(userId) {
        const sockets = this.userSockets.get(userId);
        return sockets ? Array.from(sockets) : [];
    }
    // Send notification to specific user
    sendToUser(userId, event, data) {
        const socketIds = this.getUserSockets(userId);
        socketIds.forEach((socketId) => {
            this.io.to(socketId).emit(event, data);
        });
    }
}
exports.ChatHandler = ChatHandler;
//# sourceMappingURL=chatHandler.js.map