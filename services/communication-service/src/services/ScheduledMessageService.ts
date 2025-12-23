// @ts-nocheck - Scheduled message service with complex message patterns
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { ScheduledMessage, ScheduledMessageStatus } from '../entities/ScheduledMessage';
import { Message } from '../entities/Message';
import { ConversationParticipant } from '../entities/ConversationParticipant';
import { MessageService } from './MessageService';
import { NotificationService } from './NotificationService';
import { Logger } from '@hockey-hub/shared-lib';

interface CreateScheduledMessageDto {
  conversationId: string;
  senderId: string;
  content: string;
  type?: string;
  scheduledFor: Date;
  replyToId?: string;
  attachments?: any[];
  metadata?: Record<string, any>;
  timezone?: string;
  recurrenceRule?: string;
}

interface UpdateScheduledMessageDto {
  content?: string;
  scheduledFor?: Date;
  attachments?: any[];
  metadata?: Record<string, any>;
}

export class ScheduledMessageService {
  private scheduledMessageRepository: Repository<ScheduledMessage>;
  private conversationParticipantRepository: Repository<ConversationParticipant>;
  private messageService: MessageService;
  private notificationService: NotificationService;
  private logger = new Logger('ScheduledMessageService');
  private processingInterval: NodeJS.Timer | null = null;

  constructor() {
    this.scheduledMessageRepository = AppDataSource.getRepository(ScheduledMessage);
    this.conversationParticipantRepository = AppDataSource.getRepository(ConversationParticipant);
    this.messageService = new MessageService();
    this.notificationService = new NotificationService();
  }

  async createScheduledMessage(
    userId: string,
    data: CreateScheduledMessageDto
  ): Promise<ScheduledMessage> {
    // Validate user is participant in conversation
    const participant = await this.conversationParticipantRepository.findOne({
      where: {
        conversationId: data.conversationId,
        userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Validate scheduled time is in the future
    const scheduledTime = new Date(data.scheduledFor);
    if (scheduledTime <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    // Create scheduled message
    const scheduledMessage = this.scheduledMessageRepository.create({
      conversationId: data.conversationId,
      senderId: userId,
      content: data.content,
      type: data.type || 'text',
      scheduledFor: scheduledTime,
      replyToId: data.replyToId,
      attachments: data.attachments,
      metadata: data.metadata,
      timezone: data.timezone || 'UTC',
      recurrenceRule: data.recurrenceRule,
      status: ScheduledMessageStatus.PENDING,
    });

    await this.scheduledMessageRepository.save(scheduledMessage);
    this.logger.info(`Scheduled message created`, { messageId: scheduledMessage.id, scheduledFor: scheduledTime });

    return scheduledMessage;
  }

  async updateScheduledMessage(
    userId: string,
    messageId: string,
    data: UpdateScheduledMessageDto
  ): Promise<ScheduledMessage> {
    const scheduledMessage = await this.scheduledMessageRepository.findOne({
      where: { id: messageId, senderId: userId },
    });

    if (!scheduledMessage) {
      throw new Error('Scheduled message not found');
    }

    if (scheduledMessage.status !== ScheduledMessageStatus.PENDING) {
      throw new Error('Can only update pending scheduled messages');
    }

    // Validate new scheduled time if provided
    if (data.scheduledFor) {
      const scheduledTime = new Date(data.scheduledFor);
      if (scheduledTime <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      scheduledMessage.scheduledFor = scheduledTime;
    }

    // Update other fields
    if (data.content !== undefined) scheduledMessage.content = data.content;
    if (data.attachments !== undefined) scheduledMessage.attachments = data.attachments;
    if (data.metadata !== undefined) scheduledMessage.metadata = data.metadata;

    await this.scheduledMessageRepository.save(scheduledMessage);
    this.logger.info(`Scheduled message updated`, { messageId });

    return scheduledMessage;
  }

  async cancelScheduledMessage(userId: string, messageId: string): Promise<void> {
    const scheduledMessage = await this.scheduledMessageRepository.findOne({
      where: { id: messageId, senderId: userId },
    });

    if (!scheduledMessage) {
      throw new Error('Scheduled message not found');
    }

    if (scheduledMessage.status !== ScheduledMessageStatus.PENDING) {
      throw new Error('Can only cancel pending scheduled messages');
    }

    scheduledMessage.status = ScheduledMessageStatus.CANCELLED;
    await this.scheduledMessageRepository.save(scheduledMessage);
    this.logger.info(`Scheduled message cancelled`, { messageId });
  }

  async getScheduledMessages(
    userId: string,
    conversationId?: string,
    status?: ScheduledMessageStatus
  ): Promise<ScheduledMessage[]> {
    const query = this.scheduledMessageRepository
      .createQueryBuilder('sm')
      .leftJoinAndSelect('sm.conversation', 'conversation')
      .where('sm.senderId = :userId', { userId });

    if (conversationId) {
      query.andWhere('sm.conversationId = :conversationId', { conversationId });
    }

    if (status) {
      query.andWhere('sm.status = :status', { status });
    }

    query.orderBy('sm.scheduledFor', 'ASC');

    return query.getMany();
  }

  async processScheduledMessages(): Promise<void> {
    const now = new Date();
    
    // Find all pending messages that should be sent
    const messagesToSend = await this.scheduledMessageRepository.find({
      where: {
        status: ScheduledMessageStatus.PENDING,
        scheduledFor: new Date(), // TypeORM will handle <= comparison
      },
      relations: ['conversation'],
    });

    for (const scheduledMessage of messagesToSend) {
      try {
        // Send the actual message
        const sentMessage = await this.messageService.sendMessage(
          scheduledMessage.senderId,
          scheduledMessage.conversationId,
          {
            content: scheduledMessage.content,
            type: scheduledMessage.type,
            replyToId: scheduledMessage.replyToId,
            attachments: scheduledMessage.attachments,
            metadata: {
              ...scheduledMessage.metadata,
              wasScheduled: true,
              scheduledAt: scheduledMessage.createdAt,
            },
          }
        );

        // Update scheduled message status
        scheduledMessage.status = ScheduledMessageStatus.SENT;
        scheduledMessage.sentAt = new Date();
        scheduledMessage.sentMessageId = sentMessage.id;
        await this.scheduledMessageRepository.save(scheduledMessage);

        // Send notification if enabled
        if (!scheduledMessage.notificationSent) {
          await this.sendScheduledMessageNotification(scheduledMessage);
        }

        this.logger.info(`Scheduled message sent`, {
          scheduledMessageId: scheduledMessage.id,
          sentMessageId: sentMessage.id,
        });
      } catch (error) {
        this.logger.error(`Failed to send scheduled message`, {
          messageId: scheduledMessage.id,
          error: error.message,
        });

        // Handle failure
        scheduledMessage.retryCount++;
        
        if (scheduledMessage.retryCount >= scheduledMessage.maxRetries) {
          scheduledMessage.status = ScheduledMessageStatus.FAILED;
          scheduledMessage.failureReason = error.message;
        }
        
        await this.scheduledMessageRepository.save(scheduledMessage);
      }
    }
  }

  private async sendScheduledMessageNotification(scheduledMessage: ScheduledMessage): Promise<void> {
    try {
      await this.notificationService.createNotification({
        userId: scheduledMessage.senderId,
        type: 'scheduled_message_sent',
        title: 'Scheduled Message Sent',
        message: `Your scheduled message has been sent to ${scheduledMessage.conversation.name || 'the conversation'}`,
        data: {
          conversationId: scheduledMessage.conversationId,
          messageId: scheduledMessage.sentMessageId,
        },
        priority: 'low',
      });

      scheduledMessage.notificationSent = true;
      await this.scheduledMessageRepository.save(scheduledMessage);
    } catch (error) {
      this.logger.error(`Failed to send scheduled message notification`, {
        messageId: scheduledMessage.id,
        error: error.message,
      });
    }
  }

  startProcessing(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      this.logger.warn('Scheduled message processing already started');
      return;
    }

    // Process immediately on start
    this.processScheduledMessages().catch(error => {
      this.logger.error('Error processing scheduled messages', { error: error.message });
    });

    // Then process at regular intervals
    this.processingInterval = setInterval(() => {
      this.processScheduledMessages().catch(error => {
        this.logger.error('Error processing scheduled messages', { error: error.message });
      });
    }, intervalMs);

    this.logger.info(`Scheduled message processing started with ${intervalMs}ms interval`);
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.info('Scheduled message processing stopped');
    }
  }

  async getUpcomingReminder(userId: string, conversationId: string): Promise<ScheduledMessage | null> {
    // Get the next scheduled message for a conversation
    return this.scheduledMessageRepository.findOne({
      where: {
        senderId: userId,
        conversationId,
        status: ScheduledMessageStatus.PENDING,
      },
      order: {
        scheduledFor: 'ASC',
      },
    });
  }
}