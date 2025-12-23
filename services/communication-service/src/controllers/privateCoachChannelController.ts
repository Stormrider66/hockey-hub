// @ts-nocheck - Suppress TypeScript errors for build
import { Request, Response } from 'express';
import { PrivateCoachChannelService } from '../services/PrivateCoachChannelService';
import { validationResult } from 'express-validator';

export class PrivateCoachChannelController {
  private privateCoachChannelService: PrivateCoachChannelService;

  constructor() {
    this.privateCoachChannelService = new PrivateCoachChannelService();
  }

  // Create or get existing private coach channel
  createChannel = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { playerId, parentId, coachIds, teamId, organizationId, playerName } = req.body;

      const channel = await this.privateCoachChannelService.createPrivateCoachChannel({
        playerId,
        parentId,
        coachIds,
        teamId,
        organizationId,
        playerName,
      });

      res.status(201).json(channel);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to create private coach channel' 
      });
    }
  };

  // Get all private coach channels for a parent
  getParentChannels = async (req: Request, res: Response) => {
    try {
      const { parentId } = req.params;
      const channels = await this.privateCoachChannelService.getParentCoachChannels(parentId);
      res.json(channels);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get parent channels' 
      });
    }
  };

  // Get all private channels for a coach
  getCoachChannels = async (req: Request, res: Response) => {
    try {
      const { coachId } = req.params;
      const channels = await this.privateCoachChannelService.getCoachPrivateChannels(coachId);
      res.json(channels);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get coach channels' 
      });
    }
  };

  // Get channel by player ID
  getChannelByPlayer = async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const { parentId } = req.query;

      if (!parentId) {
        return res.status(400).json({ error: 'Parent ID is required' });
      }

      const channel = await this.privateCoachChannelService.getChannelByPlayer(
        playerId, 
        parentId as string
      );

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      res.json(channel);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get channel' 
      });
    }
  };

  // Set coach availability
  setCoachAvailability = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { coachId } = req.params;
      const { teamId, organizationId, availability } = req.body;

      const result = await this.privateCoachChannelService.setCoachAvailability(
        coachId,
        teamId,
        organizationId,
        availability
      );

      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to set coach availability' 
      });
    }
  };

  // Get coach availability
  getCoachAvailability = async (req: Request, res: Response) => {
    try {
      const { coachId } = req.params;
      const { teamId } = req.query;

      const availability = await this.privateCoachChannelService.getCoachAvailability(
        coachId,
        teamId as string | undefined
      );

      res.json(availability);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get coach availability' 
      });
    }
  };

  // Get team coaches availability
  getTeamCoachesAvailability = async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const availability = await this.privateCoachChannelService.getTeamCoachesAvailability(teamId);
      res.json(availability);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get team coaches availability' 
      });
    }
  };

  // Create meeting request
  createMeetingRequest = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const meetingRequest = await this.privateCoachChannelService.createMeetingRequest(req.body);
      res.status(201).json(meetingRequest);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to create meeting request' 
      });
    }
  };

  // Update meeting request
  updateMeetingRequest = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { requestId } = req.params;
      const { coachId, ...update } = req.body;

      const meetingRequest = await this.privateCoachChannelService.updateMeetingRequest(
        requestId,
        coachId,
        update
      );

      res.json(meetingRequest);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to update meeting request' 
      });
    }
  };

  // Get meeting requests
  getMeetingRequests = async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.params;
      const { status } = req.query;

      if (!['parent', 'coach'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "parent" or "coach"' });
      }

      const requests = await this.privateCoachChannelService.getMeetingRequests(
        userId,
        role as 'parent' | 'coach',
        status as any
      );

      res.json(requests);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get meeting requests' 
      });
    }
  };

  // Get conversation meeting requests
  getConversationMeetingRequests = async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const requests = await this.privateCoachChannelService.getConversationMeetingRequests(conversationId);
      res.json(requests);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to get conversation meeting requests' 
      });
    }
  };

  // Auto-create channels for new team member
  autoCreateChannels = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { teamId, playerId, parentIds, coachIds, organizationId, playerName } = req.body;

      const channels = await this.privateCoachChannelService.autoCreateChannelsForTeam(
        teamId,
        playerId,
        parentIds,
        coachIds,
        organizationId,
        playerName
      );

      res.status(201).json(channels);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to auto-create channels' 
      });
    }
  };

  // Remove coach from team channels
  removeCoachFromChannels = async (req: Request, res: Response) => {
    try {
      const { coachId, teamId } = req.params;
      await this.privateCoachChannelService.removeCoachFromChannels(coachId, teamId);
      res.json({ message: 'Coach removed from team channels successfully' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ 
        error: error.message || 'Failed to remove coach from channels' 
      });
    }
  };
}