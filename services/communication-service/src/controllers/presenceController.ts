import { Request, Response, NextFunction } from 'express';
import { PresenceService } from '../services/PresenceService';
import { asyncHandler } from '@hockey-hub/shared-lib';

export class PresenceController {
  private presenceService: PresenceService;

  constructor() {
    this.presenceService = new PresenceService();
  }

  updatePresence = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const presence = await this.presenceService.updatePresence(userId, req.body);
    
    res.json({
      success: true,
      data: presence,
    });
  });

  getUserPresence = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    const presence = await this.presenceService.getUserPresence(userId);
    
    res.json({
      success: true,
      data: presence,
    });
  });

  getMultipleUserPresence = asyncHandler(async (req: Request, res: Response) => {
    const { user_ids } = req.query;
    
    const userIds = (user_ids as string).split(',');
    const presences = await this.presenceService.getMultipleUserPresence(userIds);
    
    res.json({
      success: true,
      data: presences,
    });
  });

  getOnlineUsers = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user!.organizationId;
    
    const userIds = await this.presenceService.getOnlineUsersInOrganization(
      organizationId
    );
    
    res.json({
      success: true,
      data: userIds,
    });
  });

  getConversationPresence = asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    
    const presences = await this.presenceService.getConversationPresence(
      conversationId
    );
    
    res.json({
      success: true,
      data: presences,
    });
  });

  heartbeat = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    await this.presenceService.heartbeat(userId);
    
    res.json({
      success: true,
      message: 'Heartbeat received',
    });
  });
}