import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import axios from 'axios';
import FormData from 'form-data';
import {
  Message,
  MessageType,
  ConversationParticipant,
  MessageAttachment,
  Conversation,
  ConversationType,
} from '../entities';
import { NotFoundError, ForbiddenError, ValidationError, Logger } from '@hockey-hub/shared-lib';
import { PrivacyService } from './PrivacyService';
import { MessageService, SendMessageDto, CreateAttachmentDto } from './MessageService';

const logger = new Logger('OptimizedMessageService');

interface ImageProcessingResponse {
  original: {
    key: string;
    size: number;
    dimensions: { width: number; height: number };
  };
  variants: {
    thumbnail?: {
      key: string;
      size: number;
      dimensions: { width: number; height: number };
    };
    small?: {
      key: string;
      size: number;
      dimensions: { width: number; height: number };
    };
    medium?: {
      key: string;
      size: number;
      dimensions: { width: number; height: number };
    };
    large?: {
      key: string;
      size: number;
      dimensions: { width: number; height: number };
    };
  };
}

export class OptimizedMessageService extends MessageService {
  private fileServiceUrl: string;
  private cdnUrl: string;

  constructor() {
    super();
    this.fileServiceUrl = process.env.FILE_SERVICE_URL || 'http://localhost:3010';
    this.cdnUrl = process.env.CDN_URL || '';
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    data: SendMessageDto
  ): Promise<Message> {
    // Process image attachments if present
    if (data.attachments) {
      data.attachments = await this.processAttachments(data.attachments, userId);
    }

    return super.sendMessage(conversationId, userId, data);
  }

  private async processAttachments(
    attachments: CreateAttachmentDto[],
    userId: string
  ): Promise<CreateAttachmentDto[]> {
    const processedAttachments: CreateAttachmentDto[] = [];

    for (const attachment of attachments) {
      if (this.isImage(attachment.file_type)) {
        try {
          // Process image through file service
          const processed = await this.processImage(attachment, userId);
          processedAttachments.push(processed);
        } catch (error) {
          logger.error('Failed to process image attachment:', error);
          // Fall back to original attachment if processing fails
          processedAttachments.push(attachment);
        }
      } else {
        // Non-image attachments pass through
        processedAttachments.push(attachment);
      }
    }

    return processedAttachments;
  }

  private async processImage(
    attachment: CreateAttachmentDto,
    userId: string
  ): Promise<CreateAttachmentDto> {
    try {
      // Call file service to process image
      const response = await axios.post<ImageProcessingResponse>(
        `${this.fileServiceUrl}/api/v1/images/process`,
        {
          url: attachment.url,
          userId,
          optimize: true,
          generateVariants: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { original, variants } = response.data;

      // Use CDN URL if available
      const baseUrl = this.cdnUrl || attachment.url.split('/').slice(0, 3).join('/');

      // Update attachment with optimized versions
      const optimizedAttachment: CreateAttachmentDto = {
        ...attachment,
        url: `${baseUrl}/${original.key}`,
        file_size: original.size,
        width: original.dimensions.width,
        height: original.dimensions.height,
      };

      // Use thumbnail variant if available
      if (variants.thumbnail) {
        optimizedAttachment.thumbnail_url = `${baseUrl}/${variants.thumbnail.key}`;
      } else if (variants.small) {
        optimizedAttachment.thumbnail_url = `${baseUrl}/${variants.small.key}`;
      }

      // Store variant URLs in metadata
      const variantUrls: Record<string, string> = {};
      Object.entries(variants).forEach(([size, data]) => {
        if (data) {
          variantUrls[size] = `${baseUrl}/${data.key}`;
        }
      });

      // Add variant URLs to attachment metadata
      if (Object.keys(variantUrls).length > 0) {
        optimizedAttachment.metadata = {
          ...attachment.metadata,
          variants: variantUrls,
        };
      }

      return optimizedAttachment;
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw error;
    }
  }

  private isImage(fileType: string): boolean {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(fileType.toLowerCase());
  }

  async getMessagesWithOptimizedImages(userId: string, params: any): Promise<{
    messages: Message[];
    hasMore: boolean;
  }> {
    const result = await super.getMessages(userId, params);

    // Transform attachment URLs to use CDN if available
    if (this.cdnUrl) {
      result.messages = result.messages.map(message => {
        if (message.attachments && message.attachments.length > 0) {
          message.attachments = message.attachments.map(attachment => {
            // Replace origin with CDN URL
            if (attachment.url && !attachment.url.startsWith(this.cdnUrl)) {
              const path = new URL(attachment.url).pathname;
              attachment.url = `${this.cdnUrl}${path}`;
            }
            if (attachment.thumbnail_url && !attachment.thumbnail_url.startsWith(this.cdnUrl)) {
              const path = new URL(attachment.thumbnail_url).pathname;
              attachment.thumbnail_url = `${this.cdnUrl}${path}`;
            }
            return attachment;
          });
        }
        return message;
      });
    }

    return result;
  }

  // Batch process existing images for optimization
  async optimizeExistingImages(conversationId: string, limit: number = 100): Promise<number> {
    logger.info(`Starting image optimization for conversation: ${conversationId}`);

    const messages = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.attachments', 'attachments')
      .where('message.conversation_id = :conversationId', { conversationId })
      .andWhere('message.deleted_at IS NULL')
      .andWhere('attachments.type = :type', { type: 'image' })
      .andWhere('attachments.thumbnail_url IS NULL')
      .take(limit)
      .getMany();

    let optimizedCount = 0;

    for (const message of messages) {
      for (const attachment of message.attachments) {
        if (this.isImage(attachment.file_type)) {
          try {
            const optimized = await this.processImage({
              url: attachment.url,
              file_name: attachment.file_name,
              file_type: attachment.file_type,
              file_size: attachment.file_size,
            }, message.sender_id);

            // Update attachment with optimized data
            await this.attachmentRepo.update(attachment.id, {
              thumbnail_url: optimized.thumbnail_url,
              width: optimized.width,
              height: optimized.height,
              metadata: optimized.metadata,
            });

            optimizedCount++;
          } catch (error) {
            logger.error(`Failed to optimize attachment ${attachment.id}:`, error);
          }
        }
      }
    }

    logger.info(`Optimized ${optimizedCount} images in conversation ${conversationId}`);
    return optimizedCount;
  }
}