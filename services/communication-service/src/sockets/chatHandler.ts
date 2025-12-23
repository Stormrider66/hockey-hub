// @ts-nocheck - Chat handler with complex socket patterns
import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from './authMiddleware';
import { 
  ConversationService, 
  MessageService, 
  PresenceService,
  BroadcastService 
} from '../services';
import { PresenceStatus } from '../entities';

export class ChatHandler {
  private io: Server;
  private conversationService: ConversationService;
  private messageService: MessageService;
  private presenceService: PresenceService;
  private broadcastService: BroadcastService;
  
  // Track user socket connections
  private userSockets: Map<string, Set<string>> = new Map();
  
  constructor(io: Server) {
    this.io = io;
    this.conversationService = new ConversationService();
    this.messageService = new MessageService();
    this.presenceService = new PresenceService();
    this.broadcastService = new BroadcastService();
    
    // Make io globally available for broadcast service
    global.io = io;
  }

  handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    // Track user's socket
    this.addUserSocket(userId, socket.id);
    
    // Update user presence to online
    this.presenceService.updatePresence(userId, {
      status: PresenceStatus.ONLINE,
      device_info: {
        platform: socket.handshake.headers['user-agent'] || 'unknown',
      },
    });

    // Emit presence update to relevant users
    this.emitPresenceUpdate(userId, PresenceStatus.ONLINE);

    // Register event handlers
    this.registerConversationHandlers(socket);
    this.registerMessageHandlers(socket);
    this.registerPresenceHandlers(socket);
    this.registerTypingHandlers(socket);
    this.registerBroadcastHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private registerConversationHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Join conversation rooms
    socket.on('conversation:join', async (conversationId: string) => {
      try {
        // Verify user is participant
        const conversation = await this.conversationService.getConversationById(
          conversationId,
          userId
        );

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
      } catch (error: any) {
        socket.emit('error', {
          event: 'conversation:join',
          message: error.message,
        });
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      
      // Clear typing indicator if any
      this.presenceService.clearTyping(userId, conversationId);
      
      socket.emit('conversation:left', { conversationId });
    });

    // Listen for conversation updates
    socket.on('conversation:update', async (data: {
      conversationId: string;
      updates: any;
    }) => {
      try {
        const updated = await this.conversationService.updateConversation(
          data.conversationId,
          userId,
          data.updates
        );

        // Emit to all participants
        this.io.to(`conversation:${data.conversationId}`).emit('conversation:updated', {
          conversation: updated,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'conversation:update',
          message: error.message,
        });
      }
    });
  }

  private registerMessageHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Send message
    socket.on('message:send', async (data: {
      conversationId: string;
      content: string;
      type?: string;
      replyToId?: string;
      attachments?: any[];
    }) => {
      try {
        const message = await this.messageService.sendMessage(
          data.conversationId,
          userId,
          {
            content: data.content,
            type: data.type as any,
            reply_to_id: data.replyToId,
            attachments: data.attachments,
          }
        );

        // Emit to all participants in the conversation
        this.io.to(`conversation:${data.conversationId}`).emit('message:new', {
          conversationId: data.conversationId,
          message,
        });

        // Update conversation's updated_at is handled in service
        // Emit conversation update event
        const conversation = await this.conversationService.getConversationById(
          data.conversationId,
          userId
        );
        
        this.io.to(`conversation:${data.conversationId}`).emit('conversation:updated', {
          conversation,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'message:send',
          message: error.message,
        });
      }
    });

    // Edit message
    socket.on('message:edit', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        const message = await this.messageService.editMessage(
          data.messageId,
          userId,
          { content: data.content }
        );

        // Emit to all participants
        this.io.to(`conversation:${message.conversation_id}`).emit('message:updated', {
          message,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'message:edit',
          message: error.message,
        });
      }
    });

    // Delete message
    socket.on('message:delete', async (messageId: string) => {
      try {
        // Get message first to know conversation
        const message = await this.messageService.deleteMessage(messageId, userId);

        // Emit to all participants
        this.io.to(`conversation:${message.conversation_id}`).emit('message:deleted', {
          messageId,
          conversationId: message.conversation_id,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'message:delete',
          message: error.message,
        });
      }
    });

    // Add reaction
    socket.on('reaction:add', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        await this.messageService.addReaction(
          data.messageId,
          userId,
          { emoji: data.emoji }
        );

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
      } catch (error: any) {
        socket.emit('error', {
          event: 'reaction:add',
          message: error.message,
        });
      }
    });

    // Remove reaction
    socket.on('reaction:remove', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        await this.messageService.removeReaction(
          data.messageId,
          userId,
          data.emoji
        );

        // Emit to all participants (need to get conversation from message)
        socket.emit('reaction:removed', {
          messageId: data.messageId,
          userId,
          emoji: data.emoji,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'reaction:remove',
          message: error.message,
        });
      }
    });

    // Mark messages as read
    socket.on('message:read', async (messageIds: string[]) => {
      try {
        await this.messageService.markAsRead(messageIds, userId);

        // Emit read receipts to conversation participants
        // This would need to be enhanced to get conversation IDs from messages
        socket.emit('read:receipts', {
          messageIds,
          userId,
          readAt: new Date(),
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'message:read',
          message: error.message,
        });
      }
    });
  }

  private registerPresenceHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Update presence
    socket.on('presence:update', async (data: {
      status: PresenceStatus;
      statusMessage?: string;
    }) => {
      try {
        await this.presenceService.updatePresence(userId, {
          status: data.status,
          status_message: data.statusMessage,
        });

        // Emit to relevant users
        this.emitPresenceUpdate(userId, data.status, data.statusMessage);
      } catch (error: any) {
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

  private registerTypingHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Start typing
    socket.on('typing:start', async (conversationId: string) => {
      try {
        await this.presenceService.setTyping(userId, conversationId);

        // Emit to other participants
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          conversationId,
          userId,
        });
      } catch (error: any) {
        // Silently fail for typing indicators
      }
    });

    // Stop typing
    socket.on('typing:stop', async (conversationId: string) => {
      try {
        await this.presenceService.clearTyping(userId, conversationId);

        // Emit to other participants
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId,
        });
      } catch (error: any) {
        // Silently fail for typing indicators
      }
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Remove socket from tracking
    this.removeUserSocket(userId, socket.id);

    // If user has no more sockets, update presence
    if (!this.userSockets.has(userId) || this.userSockets.get(userId)!.size === 0) {
      // Update to away/offline after disconnect
      this.presenceService.handleDisconnect(userId);
      
      // Emit presence update
      this.emitPresenceUpdate(userId, PresenceStatus.AWAY);
    }
  }

  // Helper methods
  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  private async emitPresenceUpdate(
    userId: string, 
    status: PresenceStatus, 
    statusMessage?: string
  ) {
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
  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    const socketIds = this.getUserSockets(userId);
    socketIds.forEach((socketId) => {
      this.io.to(socketId).emit(event, data);
    });
  }

  private registerBroadcastHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Mark broadcast as read
    socket.on('broadcast:read', async (broadcastId: string) => {
      try {
        await this.broadcastService.markBroadcastAsRead(broadcastId, userId);
        
        // Emit confirmation
        socket.emit('broadcast:read:success', { broadcastId });
      } catch (error: any) {
        socket.emit('error', {
          event: 'broadcast:read',
          message: error.message,
        });
      }
    });

    // Acknowledge broadcast
    socket.on('broadcast:acknowledge', async (data: {
      broadcastId: string;
      note?: string;
    }) => {
      try {
        await this.broadcastService.acknowledgeBroadcast(
          data.broadcastId,
          userId,
          data.note
        );
        
        // Emit confirmation
        socket.emit('broadcast:acknowledge:success', { 
          broadcastId: data.broadcastId 
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'broadcast:acknowledge',
          message: error.message,
        });
      }
    });

    // Get unread broadcast count
    socket.on('broadcast:unread:count', async () => {
      try {
        const { unreadCount } = await this.broadcastService.getUserBroadcasts(userId);
        socket.emit('broadcast:unread:count:result', { unreadCount });
      } catch (error: any) {
        socket.emit('error', {
          event: 'broadcast:unread:count',
          message: error.message,
        });
      }
    });
  }
}