import { Server } from 'socket.io';
import { AuthenticatedSocket } from './authMiddleware';
import { ChatHandler } from './chatHandler';
import { OptimizedSocketManager } from './OptimizedSocketManager';
import { Logger } from '@hockey-hub/shared-lib';
import { CachedMessageRepository } from '../repositories/CachedMessageRepository';
import { CachedConversationRepository } from '../repositories/CachedConversationRepository';

const logger = new Logger('OptimizedChatHandler');

export class OptimizedChatHandler extends ChatHandler {
  private socketManager: OptimizedSocketManager;
  private messageQueue: Map<string, QueuedMessage[]> = new Map();
  private batchInterval: NodeJS.Timer;
  private cachedMessageRepo: CachedMessageRepository;
  private cachedConversationRepo: CachedConversationRepository;

  constructor(io: Server) {
    super(io);
    
    // Initialize optimized socket manager
    this.socketManager = new OptimizedSocketManager(io, {
      maxConnectionsPerUser: 5,
      heartbeatInterval: 25000,
      heartbeatTimeout: 60000,
      enableCompression: true,
      perMessageDeflate: true,
    });

    // Initialize cached repositories
    this.cachedMessageRepo = new CachedMessageRepository();
    this.cachedConversationRepo = new CachedConversationRepository();

    // Start batch processing
    this.startBatchProcessing();
  }

  handleConnection(socket: AuthenticatedSocket) {
    // Use optimized socket manager
    const accepted = this.socketManager.handleConnection(socket);
    if (!accepted) {
      return;
    }

    // Call parent handler
    super.handleConnection(socket);

    // Add optimized handlers
    this.registerOptimizedHandlers(socket);
  }

  private registerOptimizedHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Optimized message fetching with caching
    socket.on('messages:fetch', async (data: {
      conversationId: string;
      limit?: number;
      beforeMessageId?: string;
    }) => {
      try {
        const result = await this.cachedMessageRepo.findConversationMessages(
          data.conversationId,
          data.limit || 50,
          0,
          data.beforeMessageId
        );

        socket.emit('messages:fetched', {
          conversationId: data.conversationId,
          messages: result.messages,
          hasMore: result.hasMore,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'messages:fetch',
          message: error.message,
        });
      }
    });

    // Batch message sending
    socket.on('message:send:batch', (messages: any[]) => {
      this.queueMessages(userId, messages);
    });

    // Optimized presence updates
    socket.on('presence:batch', async (updates: Array<{
      status: string;
      conversationIds: string[];
    }>) => {
      try {
        // Process presence updates in batch
        for (const update of updates) {
          for (const conversationId of update.conversationIds) {
            this.socketManager.broadcastToRoom(
              `conversation:${conversationId}`,
              'presence:updated',
              {
                userId,
                status: update.status,
                timestamp: new Date(),
              },
              userId
            );
          }
        }
      } catch (error: any) {
        logger.error('Batch presence update failed:', error);
      }
    });

    // Optimized room joining
    socket.on('conversations:join:batch', async (conversationIds: string[]) => {
      const joinedConversations: string[] = [];
      const errors: Array<{ conversationId: string; error: string }> = [];

      for (const conversationId of conversationIds) {
        try {
          // Verify access using cached repository
          const conversation = await this.cachedConversationRepo.findById(conversationId);
          if (conversation) {
            this.socketManager.joinRoom(socket, `conversation:${conversationId}`);
            joinedConversations.push(conversationId);
          }
        } catch (error: any) {
          errors.push({
            conversationId,
            error: error.message,
          });
        }
      }

      socket.emit('conversations:joined:batch', {
        joined: joinedConversations,
        errors,
      });
    });

    // Prefetch conversations for better performance
    socket.on('conversations:prefetch', async () => {
      try {
        const result = await this.cachedConversationRepo.findUserConversations(
          userId,
          20,
          0
        );

        socket.emit('conversations:prefetched', {
          conversations: result.conversations,
          total: result.total,
        });
      } catch (error: any) {
        logger.error('Conversation prefetch failed:', error);
      }
    });

    // Message search with caching
    socket.on('messages:search', async (data: {
      query: string;
      conversationId?: string;
      limit?: number;
    }) => {
      try {
        const result = await this.cachedMessageRepo.searchMessages(
          data.query,
          data.conversationId,
          userId,
          data.limit || 20,
          0
        );

        socket.emit('messages:search:result', {
          messages: result.messages,
          total: result.total,
          query: data.query,
        });
      } catch (error: any) {
        socket.emit('error', {
          event: 'messages:search',
          message: error.message,
        });
      }
    });

    // Connection quality monitoring
    socket.on('connection:quality', (data: {
      latency: number;
      packetLoss: number;
    }) => {
      logger.debug(`User ${userId} connection quality - Latency: ${data.latency}ms, Packet loss: ${data.packetLoss}%`);
      
      // Adjust quality settings based on connection
      if (data.latency > 500 || data.packetLoss > 5) {
        socket.emit('connection:quality:adjust', {
          reduceQuality: true,
          suggestions: [
            'disable_video_preview',
            'reduce_image_quality',
            'increase_batch_interval',
          ],
        });
      }
    });
  }

  // Message queuing for batch processing
  private queueMessages(userId: string, messages: any[]) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }

    const userQueue = this.messageQueue.get(userId)!;
    messages.forEach(msg => {
      userQueue.push({
        ...msg,
        queuedAt: Date.now(),
      });
    });

    // If queue is getting large, process immediately
    if (userQueue.length >= 10) {
      this.processBatchForUser(userId);
    }
  }

  private startBatchProcessing() {
    // Process message batches every 100ms
    this.batchInterval = setInterval(() => {
      this.messageQueue.forEach((messages, userId) => {
        if (messages.length > 0) {
          this.processBatchForUser(userId);
        }
      });
    }, 100);
  }

  private async processBatchForUser(userId: string) {
    const messages = this.messageQueue.get(userId);
    if (!messages || messages.length === 0) return;

    // Clear queue
    this.messageQueue.set(userId, []);

    try {
      // Process messages in batch
      const processedMessages = [];
      
      for (const queuedMessage of messages) {
        const message = await this.messageService.sendMessage(
          queuedMessage.conversationId,
          userId,
          {
            content: queuedMessage.content,
            type: queuedMessage.type,
            reply_to_id: queuedMessage.replyToId,
            attachments: queuedMessage.attachments,
          }
        );
        
        processedMessages.push(message);
      }

      // Emit batch of new messages
      const messagesByConversation = new Map<string, any[]>();
      processedMessages.forEach(msg => {
        if (!messagesByConversation.has(msg.conversation_id)) {
          messagesByConversation.set(msg.conversation_id, []);
        }
        messagesByConversation.get(msg.conversation_id)!.push(msg);
      });

      // Broadcast to conversation rooms
      messagesByConversation.forEach((messages, conversationId) => {
        this.socketManager.broadcastToRoom(
          `conversation:${conversationId}`,
          'messages:new:batch',
          {
            conversationId,
            messages,
          }
        );
      });

    } catch (error: any) {
      logger.error(`Batch processing failed for user ${userId}:`, error);
      
      // Notify user of failure
      this.socketManager.broadcastToUser(userId, 'messages:batch:failed', {
        error: error.message,
        messageCount: messages.length,
      });
    }
  }

  // Override sendToUser to use optimized socket manager
  sendToUser(userId: string, event: string, data: any) {
    this.socketManager.broadcastToUser(userId, event, data);
  }

  // Get connection statistics
  getConnectionStats() {
    return this.socketManager.getConnectionStats();
  }

  // Graceful shutdown
  async shutdown() {
    // Stop batch processing
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }

    // Process any remaining queued messages
    for (const [userId, messages] of this.messageQueue) {
      if (messages.length > 0) {
        await this.processBatchForUser(userId);
      }
    }

    // Shutdown socket manager
    await this.socketManager.shutdown();
  }
}

interface QueuedMessage {
  conversationId: string;
  content: string;
  type?: string;
  replyToId?: string;
  attachments?: any[];
  queuedAt: number;
}