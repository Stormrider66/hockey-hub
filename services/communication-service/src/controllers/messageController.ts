import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/MessageService';
import { asyncHandler } from '@hockey-hub/shared-lib';

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    const message = await this.messageService.sendMessage(
      conversationId,
      userId,
      req.body
    );
    
    res.status(201).json({
      success: true,
      data: message,
    });
  });

  getMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    // Support both cursor-based and page-based pagination
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;
    
    const params = {
      conversation_id: conversationId,
      before_id: req.query.before_id as string,
      after_id: req.query.after_id as string,
      limit: limit,
      search: req.query.search as string,
      page: page,
    };
    
    const result = await this.messageService.getMessages(userId, params);
    
    res.json({
      success: true,
      data: result.messages,
      meta: {
        total: result.total || 0,
        page: page,
        limit: limit,
        totalPages: result.total ? Math.ceil(result.total / limit) : 0,
        hasMore: result.hasMore,
        cursor: {
          before: result.messages.length > 0 ? result.messages[0].id : null,
          after: result.messages.length > 0 ? result.messages[result.messages.length - 1].id : null,
        }
      }
    });
  });

  editMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    
    const message = await this.messageService.editMessage(
      messageId,
      userId,
      req.body
    );
    
    res.json({
      success: true,
      data: message,
    });
  });

  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    
    await this.messageService.deleteMessage(messageId, userId);
    
    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  });

  addReaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    
    await this.messageService.addReaction(messageId, userId, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Reaction added successfully',
    });
  });

  removeReaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { emoji } = req.query;
    
    await this.messageService.removeReaction(
      messageId,
      userId,
      emoji as string
    );
    
    res.json({
      success: true,
      message: 'Reaction removed successfully',
    });
  });

  searchMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { query, conversation_ids } = req.query;
    
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;
    
    const conversationIds = conversation_ids
      ? (conversation_ids as string).split(',')
      : undefined;
    
    const result = await this.messageService.searchMessages(
      userId,
      query as string,
      conversationIds,
      page,
      limit
    );
    
    res.json({
      success: true,
      data: result.messages,
      meta: {
        total: result.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { message_ids } = req.body;
    
    await this.messageService.markAsRead(message_ids, userId);
    
    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  });
}