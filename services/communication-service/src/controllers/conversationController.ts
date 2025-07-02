import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/ConversationService';
import { asyncHandler } from '@hockey-hub/shared-lib';

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  createConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversation = await this.conversationService.createConversation(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: conversation,
    });
  });

  getConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;
    
    const params = {
      user_id: userId,
      include_archived: req.query.include_archived === 'true',
      type: req.query.type as any,
      page: page,
      limit: limit,
    };

    const result = await this.conversationService.getUserConversations(params);
    
    res.json({
      success: true,
      data: result.conversations,
      meta: {
        total: result.total,
        page: page,
        limit: limit,
        totalPages: result.totalPages || Math.ceil(result.total / limit),
      },
    });
  });

  getConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    const conversation = await this.conversationService.getConversationById(
      conversationId,
      userId
    );
    
    res.json({
      success: true,
      data: conversation,
    });
  });

  updateConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    const conversation = await this.conversationService.updateConversation(
      conversationId,
      userId,
      req.body
    );
    
    res.json({
      success: true,
      data: conversation,
    });
  });

  archiveConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    await this.conversationService.archiveConversation(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation archived successfully',
    });
  });

  addParticipants = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { participant_ids } = req.body;
    
    await this.conversationService.addParticipants(
      conversationId,
      userId,
      participant_ids
    );
    
    res.json({
      success: true,
      message: 'Participants added successfully',
    });
  });

  removeParticipant = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId, participantId } = req.params;
    
    await this.conversationService.removeParticipant(
      conversationId,
      userId,
      participantId
    );
    
    res.json({
      success: true,
      message: 'Participant removed successfully',
    });
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    await this.conversationService.markAsRead(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation marked as read',
    });
  });

  muteConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { until } = req.body;
    
    await this.conversationService.muteConversation(
      conversationId,
      userId,
      until ? new Date(until) : undefined
    );
    
    res.json({
      success: true,
      message: 'Conversation muted successfully',
    });
  });

  unmuteConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    
    await this.conversationService.unmuteConversation(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation unmuted successfully',
    });
  });
}