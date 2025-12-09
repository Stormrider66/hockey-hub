import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Message, MessageType, Conversation, ConversationType } from '../entities';
import { MessageService } from '../services/MessageService';
import { ConversationService } from '../services/ConversationService';
import { BotUser, BotType, BotPermission, BOT_USERS } from './BotUser';
import { Logger } from '@hockey-hub/shared-lib';
import { OptimizedSocketManager } from '../sockets/OptimizedSocketManager';

export interface BotMessageOptions {
  type?: MessageType;
  metadata?: Record<string, any>;
  attachments?: any[];
  actions?: BotAction[];
  replyToId?: string;
  isEphemeral?: boolean; // Message only visible to specific user
}

export interface BotAction {
  id: string;
  type: 'button' | 'link' | 'quick_reply';
  label: string;
  value: string;
  style?: 'primary' | 'secondary' | 'danger';
  url?: string; // For link type
}

export interface BotInteraction {
  messageId: string;
  userId: string;
  actionId: string;
  value: string;
  timestamp: Date;
}

export abstract class BaseBotService {
  protected botUser: BotUser;
  protected messageService: MessageService;
  protected conversationService: ConversationService;
  protected logger: Logger;
  protected socketManager?: OptimizedSocketManager;
  private interactionHandlers: Map<string, (interaction: BotInteraction) => Promise<void>>;

  constructor(botType: BotType) {
    this.botUser = BOT_USERS[botType];
    this.messageService = new MessageService();
    this.conversationService = new ConversationService();
    this.logger = new Logger(`Bot:${this.botUser.name}`);
    this.interactionHandlers = new Map();
    
    if (!this.botUser.isActive) {
      throw new Error(`Bot ${botType} is not active`);
    }
  }

  public setSocketManager(socketManager: OptimizedSocketManager) {
    this.socketManager = socketManager;
  }

  /**
   * Send a message to a user
   */
  public async sendDirectMessage(
    userId: string,
    content: string,
    options?: BotMessageOptions
  ): Promise<Message> {
    try {
      // Find or create direct conversation with user
      const conversation = await this.findOrCreateDirectConversation(userId);
      
      // Send message
      const message = await this.sendMessage(conversation.id, content, options);
      
      // Emit socket event for real-time delivery
      if (this.socketManager) {
        this.socketManager.broadcastToUser(userId, 'new_message', {
          message: this.formatMessageForSocket(message),
          conversation_id: conversation.id,
        });
      }
      
      this.logger.info(`Sent direct message to user ${userId}`);
      return message;
    } catch (error) {
      this.logger.error('Failed to send direct message:', error);
      throw error;
    }
  }

  /**
   * Send a message to a conversation
   */
  public async sendConversationMessage(
    conversationId: string,
    content: string,
    options?: BotMessageOptions
  ): Promise<Message> {
    try {
      const message = await this.sendMessage(conversationId, content, options);
      
      // Emit socket event for real-time delivery
      if (this.socketManager) {
        this.socketManager.broadcastToRoom(
          `conversation:${conversationId}`,
          'new_message',
          {
            message: this.formatMessageForSocket(message),
            conversation_id: conversationId,
          }
        );
      }
      
      this.logger.info(`Sent message to conversation ${conversationId}`);
      return message;
    } catch (error) {
      this.logger.error('Failed to send conversation message:', error);
      throw error;
    }
  }

  /**
   * Send a broadcast message to multiple users
   */
  public async sendBroadcast(
    userIds: string[],
    content: string,
    options?: BotMessageOptions
  ): Promise<void> {
    const broadcastId = this.generateBroadcastId();
    
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          await this.sendDirectMessage(userId, content, {
            ...options,
            type: MessageType.BROADCAST,
            metadata: {
              ...options?.metadata,
              broadcast_id: broadcastId,
            },
          });
        } catch (error) {
          this.logger.error(`Failed to send broadcast to user ${userId}:`, error);
        }
      })
    );
    
    this.logger.info(`Sent broadcast ${broadcastId} to ${userIds.length} users`);
  }

  /**
   * Register an interaction handler
   */
  protected registerInteractionHandler(
    actionId: string,
    handler: (interaction: BotInteraction) => Promise<void>
  ) {
    this.interactionHandlers.set(actionId, handler);
  }

  /**
   * Handle user interaction with bot message
   */
  public async handleInteraction(interaction: BotInteraction): Promise<void> {
    const handler = this.interactionHandlers.get(interaction.actionId);
    if (handler) {
      await handler(interaction);
      this.logger.info(`Handled interaction ${interaction.actionId} from user ${interaction.userId}`);
    } else {
      this.logger.warn(`No handler found for interaction ${interaction.actionId}`);
    }
  }

  /**
   * Abstract method for bot-specific initialization
   */
  public abstract initialize(): Promise<void>;

  /**
   * Check if bot has permission
   */
  protected hasPermission(permission: BotPermission): boolean {
    return this.botUser.permissions.includes(permission);
  }

  /**
   * Send a message as the bot
   */
  private async sendMessage(
    conversationId: string,
    content: string,
    options?: BotMessageOptions
  ): Promise<Message> {
    const messageData = {
      content: this.formatContent(content, options),
      type: options?.type || MessageType.TEXT,
      metadata: {
        ...options?.metadata,
        bot_id: this.botUser.id,
        bot_type: this.botUser.type,
        actions: options?.actions,
        is_ephemeral: options?.isEphemeral,
      },
      attachments: options?.attachments,
      reply_to_id: options?.replyToId,
    };

    // Use bot user ID as sender
    return await this.messageService.sendMessage(
      conversationId,
      this.botUser.id,
      messageData
    );
  }

  /**
   * Find or create a direct conversation with a user
   */
  private async findOrCreateDirectConversation(userId: string): Promise<Conversation> {
    // Try to find existing conversation
    const conversations = await this.conversationService.getUserConversations(this.botUser.id);
    
    const existingConversation = conversations.find(
      (conv) =>
        conv.type === ConversationType.DIRECT &&
        conv.participants.some((p) => p.user_id === userId)
    );

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    return await this.conversationService.createConversation(this.botUser.id, {
      type: ConversationType.DIRECT,
      participant_ids: [userId],
      name: `${this.botUser.name} Chat`,
    });
  }

  /**
   * Format content with bot-specific styling
   */
  private formatContent(content: string, options?: BotMessageOptions): string {
    let formattedContent = content;

    // Add bot avatar at the beginning if it's an emoji
    if (this.botUser.avatar.length <= 2) {
      formattedContent = `${this.botUser.avatar} ${content}`;
    }

    // Add action buttons as formatted text if specified
    if (options?.actions && options.actions.length > 0) {
      formattedContent += '\n\n';
      options.actions.forEach((action) => {
        formattedContent += `[${action.label}](action:${action.id}:${action.value}) `;
      });
    }

    return formattedContent;
  }

  /**
   * Format message for socket emission
   */
  private formatMessageForSocket(message: Message): any {
    return {
      ...message,
      sender: {
        id: this.botUser.id,
        firstName: this.botUser.name,
        lastName: '',
        fullName: this.botUser.name,
        profileImageUrl: this.botUser.avatar,
        isBot: true,
        botType: this.botUser.type,
      },
    };
  }

  /**
   * Generate unique broadcast ID
   */
  private generateBroadcastId(): string {
    return `${this.botUser.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log bot activity
   */
  protected logActivity(action: string, details: any) {
    this.logger.info(`Bot activity: ${action}`, details);
    // Could also save to database for analytics
  }
}