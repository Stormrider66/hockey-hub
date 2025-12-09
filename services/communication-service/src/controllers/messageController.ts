import { Request, Response } from 'express';
import { MessageService } from '../services/MessageService';
import { asyncHandler } from '@hockey-hub/shared-lib';

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const conversationId = (req.body && (req.body as any).conversation_id) || req.params.conversationId;
    
    const message = await this.messageService.sendMessage(
      conversationId,
      userId,
      req.body
    );
    
    res.status(201).json({ message });
  });

  getMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const conversationId = (req.query.conversation_id as string) || req.params.conversationId;
    
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
    const normalize = (m: any) => ({
      ...m,
      createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
      updatedAt: typeof m.updatedAt === 'string' ? m.updatedAt : new Date(m.updatedAt).toISOString(),
    });
    res.json({ data: Array.isArray(result.data) ? result.data.map(normalize) : [], total: result.total, hasMore: (result as any).hasMore, cursor: (result as any).cursor });
  });

  editMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const { messageId } = req.params;
    
    const message = await this.messageService.updateMessage(
      messageId,
      userId,
      req.body
    );
    
    res.json({ message });
  });

  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const { messageId } = req.params;
    
    await this.messageService.deleteMessage(messageId, userId);
    
    res.json({ message: 'Message deleted successfully' });
  });

  addReaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const { messageId } = req.params;
    
    const reaction = await this.messageService.addReaction(messageId, userId, req.body);
    res.status(200).json({ message: 'Reaction added' });
  });

  removeReaction = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const { messageId } = req.params;
    const { emoji } = req.query as any;
    
    await this.messageService.removeReaction(
      messageId,
      userId,
      emoji as string
    );
    res.status(200).json({ message: 'Reaction removed' });
  });

  searchMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const q = (req.query.q as string) || (req.query.query as string);
    const conversation_id = (req.query.conversation_id as string) || undefined;
    
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    const result = await this.messageService.searchMessages(userId, { query: q, conversation_id });
    res.json({ data: result.data });
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.userId || (req as any).user?.id;
    const { message_ids } = req.body;
    await this.messageService.markAsRead(message_ids, userId);
    res.json({ message: 'Message marked as read' });
  });
}