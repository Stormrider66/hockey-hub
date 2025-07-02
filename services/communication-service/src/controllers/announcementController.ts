import { Request, Response } from 'express';
import { AnnouncementChannelService } from '../services/AnnouncementChannelService';
import { ConversationService } from '../services/ConversationService';
import { MessageService } from '../services/MessageService';
import { NotificationService } from '../services/NotificationService';
import { asyncHandler } from '@hockey-hub/shared-lib';

export class AnnouncementController {
  private announcementService: AnnouncementChannelService;

  constructor() {
    const conversationService = new ConversationService();
    const messageService = new MessageService();
    const notificationService = new NotificationService();
    
    this.announcementService = new AnnouncementChannelService(
      conversationService,
      messageService,
      notificationService
    );
  }

  /**
   * Create a new announcement channel
   */
  createAnnouncementChannel = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const channel = await this.announcementService.createAnnouncementChannel(
      userId,
      userRole,
      req.body
    );

    res.status(201).json({
      success: true,
      data: channel,
    });
  });

  /**
   * Get all announcement channels for the current user
   */
  getAnnouncementChannels = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const channels = await this.announcementService.getUserAnnouncementChannels(userId);

    res.json({
      success: true,
      data: channels,
    });
  });

  /**
   * Post an announcement to a channel
   */
  postAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { conversationId } = req.params;

    const message = await this.announcementService.postAnnouncement(
      userId,
      userRole,
      conversationId,
      req.body
    );

    res.status(201).json({
      success: true,
      data: message,
    });
  });

  /**
   * Toggle pin status of an announcement
   */
  togglePinAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { conversationId, messageId } = req.params;

    const message = await this.announcementService.togglePinAnnouncement(
      userId,
      userRole,
      conversationId,
      messageId
    );

    res.json({
      success: true,
      data: message,
    });
  });

  /**
   * Get pinned announcements for a channel
   */
  getPinnedAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    const messages = await this.announcementService.getPinnedAnnouncements(conversationId);

    res.json({
      success: true,
      data: messages,
    });
  });

  /**
   * React to an announcement
   */
  reactToAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId, messageId } = req.params;
    const { emoji } = req.body;

    await this.announcementService.reactToAnnouncement(
      userId,
      conversationId,
      messageId,
      emoji
    );

    res.json({
      success: true,
      message: 'Reaction updated successfully',
    });
  });

  /**
   * Get read receipts for an announcement
   */
  getAnnouncementReadReceipts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { messageId } = req.params;

    const receipts = await this.announcementService.getAnnouncementReadReceipts(
      userId,
      userRole,
      messageId
    );

    res.json({
      success: true,
      data: receipts,
    });
  });

  /**
   * Add a moderator to an announcement channel
   */
  addModerator = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { conversationId } = req.params;
    const { moderatorId } = req.body;

    await this.announcementService.addModerator(
      userId,
      userRole,
      conversationId,
      moderatorId
    );

    res.json({
      success: true,
      message: 'Moderator added successfully',
    });
  });

  /**
   * Update announcement channel settings
   */
  updateAnnouncementChannelSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { conversationId } = req.params;

    const channel = await this.announcementService.updateAnnouncementChannelSettings(
      userId,
      userRole,
      conversationId,
      req.body
    );

    res.json({
      success: true,
      data: channel,
    });
  });
}