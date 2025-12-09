import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { PlayerFeedback, FeedbackType, FeedbackTone, FeedbackStatus } from '../../entities/PlayerFeedback';
import {
  CreatePlayerFeedbackDto,
  UpdatePlayerFeedbackDto,
  PlayerFeedbackResponseDto,
  PlayerResponseDto,
  MarkDiscussedDto,
  UpdateFeedbackStatusDto,
  PlayerFeedbackFilterDto,
  BulkFeedbackDto,
  BulkStatusUpdateDto,
  FeedbackTemplateDto,
  CreateFromTemplateDto,
  FeedbackStatsFilterDto,
  PlayerFeedbackStatsDto,
  CoachFeedbackStatsDto
} from '../../dto/coach';
import { validationResult } from 'express-validator';
import { validateUUID } from '@hockey-hub/shared-lib';

export class PlayerFeedbackController {
  private repository: Repository<PlayerFeedback>;

  constructor() {
    this.repository = AppDataSource.getRepository(PlayerFeedback);
  }

  /**
   * Create new player feedback
   * POST /api/training/player-feedback
   */
  public createPlayerFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const feedbackData: CreatePlayerFeedbackDto = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      const feedback = this.repository.create({
        ...feedbackData,
        coachId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedFeedback = await this.repository.save(feedback);

      const response: PlayerFeedbackResponseDto = {
        id: savedFeedback.id,
        playerId: savedFeedback.playerId,
        coachId: savedFeedback.coachId,
        teamId: savedFeedback.teamId,
        type: savedFeedback.type,
        title: savedFeedback.title,
        content: savedFeedback.content,
        tone: savedFeedback.tone,
        isPrivate: savedFeedback.isPrivate,
        status: savedFeedback.status,
        playerResponse: savedFeedback.playerResponse,
        discussionDate: savedFeedback.discussionDate,
        followUpRequired: savedFeedback.followUpRequired,
        followUpDate: savedFeedback.followUpDate,
        tags: savedFeedback.tags,
        relatedSessionId: savedFeedback.relatedSessionId,
        relatedGameId: savedFeedback.relatedGameId,
        createdAt: savedFeedback.createdAt,
        updatedAt: savedFeedback.updatedAt
      };

      // TODO: Send notification to player
      // This would integrate with the notification service

      res.status(201).json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error creating player feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get feedback for a specific player
   * GET /api/training/player-feedback/player/:playerId
   */
  public getPlayerFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId } = req.params;
      const { type, status, fromDate, toDate, limit = 10, offset = 0 } = req.query;

      if (!validateUUID(playerId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid player ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('feedback')
        .where('feedback.playerId = :playerId', { playerId })
        .orderBy('feedback.createdAt', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (type && ['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting'].includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('feedback.type = :type', { type });
      }

      if (status && ['pending', 'read', 'acknowledged', 'discussed', 'follow_up_completed'].includes(status as string)) {
        queryBuilder = queryBuilder.andWhere('feedback.status = :status', { status });
      }

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('feedback.createdAt >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('feedback.createdAt <= :toDate', { toDate });
      }

      const [feedbacks, total] = await queryBuilder.getManyAndCount();

      const response = feedbacks.map(feedback => ({
        id: feedback.id,
        playerId: feedback.playerId,
        coachId: feedback.coachId,
        teamId: feedback.teamId,
        type: feedback.type,
        title: feedback.title,
        content: feedback.content,
        tone: feedback.tone,
        isPrivate: feedback.isPrivate,
        status: feedback.status,
        playerResponse: feedback.playerResponse,
        discussionDate: feedback.discussionDate,
        followUpRequired: feedback.followUpRequired,
        followUpDate: feedback.followUpDate,
        tags: feedback.tags,
        relatedSessionId: feedback.relatedSessionId,
        relatedGameId: feedback.relatedGameId,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      }));

      res.json({
        success: true,
        data: response,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(offset as string) + parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Error fetching player feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get team feedback overview
   * GET /api/training/player-feedback/team/:teamId
   */
  public getTeamFeedbackOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId } = req.params;
      const { status, type, limit = 20, offset = 0 } = req.query;

      if (!validateUUID(teamId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid team ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('feedback')
        .where('feedback.teamId = :teamId', { teamId })
        .orderBy('feedback.createdAt', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (type && ['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting'].includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('feedback.type = :type', { type });
      }

      if (status && ['pending', 'read', 'acknowledged', 'discussed', 'follow_up_completed'].includes(status as string)) {
        queryBuilder = queryBuilder.andWhere('feedback.status = :status', { status });
      }

      const [feedbacks, total] = await queryBuilder.getManyAndCount();

      // Group feedback by player for overview
      const playerFeedbackCounts = feedbacks.reduce((acc, feedback) => {
        if (!acc[feedback.playerId]) {
          acc[feedback.playerId] = {
            total: 0,
            pending: 0,
            discussed: 0,
            lastFeedback: null as any
          };
        }

        acc[feedback.playerId].total++;
        if (feedback.status === 'pending') acc[feedback.playerId].pending++;
        if (feedback.status === 'discussed') acc[feedback.playerId].discussed++;

        if (!acc[feedback.playerId].lastFeedback || 
            new Date(feedback.createdAt) > new Date(acc[feedback.playerId].lastFeedback.createdAt)) {
          acc[feedback.playerId].lastFeedback = feedback;
        }

        return acc;
      }, {} as Record<string, any>);

      const response = feedbacks.map(feedback => ({
        id: feedback.id,
        playerId: feedback.playerId,
        coachId: feedback.coachId,
        teamId: feedback.teamId,
        type: feedback.type,
        title: feedback.title,
        tone: feedback.tone,
        status: feedback.status,
        followUpRequired: feedback.followUpRequired,
        followUpDate: feedback.followUpDate,
        tags: feedback.tags,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt
      }));

      res.json({
        success: true,
        data: {
          feedbacks: response,
          playerSummary: playerFeedbackCounts,
          pagination: {
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            hasMore: total > parseInt(offset as string) + parseInt(limit as string)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching team feedback overview:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update feedback
   * PUT /api/training/player-feedback/:id
   */
  public updatePlayerFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdatePlayerFeedbackDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid feedback ID format'
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const feedback = await this.repository.findOne({ where: { id } });

      if (!feedback) {
        res.status(404).json({
          success: false,
          error: 'Feedback not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && feedback.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this feedback'
        });
        return;
      }

      // Update the feedback
      Object.assign(feedback, {
        ...updateData,
        updatedAt: new Date()
      });

      const savedFeedback = await this.repository.save(feedback);

      const response: PlayerFeedbackResponseDto = {
        id: savedFeedback.id,
        playerId: savedFeedback.playerId,
        coachId: savedFeedback.coachId,
        teamId: savedFeedback.teamId,
        type: savedFeedback.type,
        title: savedFeedback.title,
        content: savedFeedback.content,
        tone: savedFeedback.tone,
        isPrivate: savedFeedback.isPrivate,
        status: savedFeedback.status,
        playerResponse: savedFeedback.playerResponse,
        discussionDate: savedFeedback.discussionDate,
        followUpRequired: savedFeedback.followUpRequired,
        followUpDate: savedFeedback.followUpDate,
        tags: savedFeedback.tags,
        relatedSessionId: savedFeedback.relatedSessionId,
        relatedGameId: savedFeedback.relatedGameId,
        createdAt: savedFeedback.createdAt,
        updatedAt: savedFeedback.updatedAt
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Add player response to feedback
   * POST /api/training/player-feedback/:id/response
   */
  public addPlayerResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const responseData: PlayerResponseDto = req.body;
      const playerId = req.user?.id || req.body.playerId;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid feedback ID format'
        });
        return;
      }

      if (!playerId) {
        res.status(401).json({
          success: false,
          error: 'Player ID is required'
        });
        return;
      }

      const feedback = await this.repository.findOne({ where: { id } });

      if (!feedback) {
        res.status(404).json({
          success: false,
          error: 'Feedback not found'
        });
        return;
      }

      // Check if player is authorized to respond
      if (feedback.playerId !== playerId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to respond to this feedback'
        });
        return;
      }

      // Add player response
      feedback.playerResponse = responseData.response;
      feedback.status = 'acknowledged';
      feedback.updatedAt = new Date();

      const savedFeedback = await this.repository.save(feedback);

      res.json({
        success: true,
        data: {
          playerResponse: savedFeedback.playerResponse,
          status: savedFeedback.status,
          respondedAt: savedFeedback.updatedAt
        }
      });
    } catch (error) {
      console.error('Error adding player response:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Mark feedback as discussed
   * POST /api/training/player-feedback/:id/discussed
   */
  public markAsDiscussed = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const discussedData: MarkDiscussedDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid feedback ID format'
        });
        return;
      }

      const feedback = await this.repository.findOne({ where: { id } });

      if (!feedback) {
        res.status(404).json({
          success: false,
          error: 'Feedback not found'
        });
        return;
      }

      // Check authorization (coach or player can mark as discussed)
      const userId = req.user?.id;
      if (userId && feedback.coachId !== userId && feedback.playerId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to mark this feedback as discussed'
        });
        return;
      }

      // Mark as discussed
      feedback.status = 'discussed';
      feedback.discussionDate = discussedData.discussionDate || new Date();
      
      if (discussedData.notes) {
        feedback.playerResponse = (feedback.playerResponse || '') + '\n' + 
          `Discussion notes (${new Date().toISOString()}): ${discussedData.notes}`;
      }

      feedback.updatedAt = new Date();

      const savedFeedback = await this.repository.save(feedback);

      res.json({
        success: true,
        data: {
          status: savedFeedback.status,
          discussionDate: savedFeedback.discussionDate,
          updatedAt: savedFeedback.updatedAt
        }
      });
    } catch (error) {
      console.error('Error marking feedback as discussed:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Bulk update feedback status
   * POST /api/training/player-feedback/bulk-status-update
   */
  public bulkUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const updateData: BulkStatusUpdateDto = req.body;
      const coachId = req.user?.id;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      if (!updateData.feedbackIds || updateData.feedbackIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Feedback IDs are required'
        });
        return;
      }

      // Validate all feedback IDs
      for (const feedbackId of updateData.feedbackIds) {
        if (!validateUUID(feedbackId)) {
          res.status(400).json({
            success: false,
            error: `Invalid feedback ID format: ${feedbackId}`
          });
          return;
        }
      }

      // Find and update all feedback items
      const feedbacks = await this.repository.find({
        where: {
          id: { $in: updateData.feedbackIds } as any,
          coachId
        }
      });

      if (feedbacks.length !== updateData.feedbackIds.length) {
        res.status(404).json({
          success: false,
          error: 'Some feedback items not found or not authorized'
        });
        return;
      }

      // Update all feedback items
      const updatePromises = feedbacks.map(feedback => {
        feedback.status = updateData.status;
        feedback.updatedAt = new Date();
        return this.repository.save(feedback);
      });

      await Promise.all(updatePromises);

      res.json({
        success: true,
        data: {
          updatedCount: feedbacks.length,
          newStatus: updateData.status
        }
      });
    } catch (error) {
      console.error('Error bulk updating feedback status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Create feedback from template
   * POST /api/training/player-feedback/from-template
   */
  public createFromTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const templateData: CreateFromTemplateDto = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      // Validate player IDs
      for (const playerId of templateData.playerIds) {
        if (!validateUUID(playerId)) {
          res.status(400).json({
            success: false,
            error: `Invalid player ID format: ${playerId}`
          });
          return;
        }
      }

      // Create feedback for each player
      const feedbackItems = templateData.playerIds.map(playerId => 
        this.repository.create({
          playerId,
          coachId,
          teamId: templateData.teamId,
          type: templateData.template.type,
          title: templateData.template.title,
          content: templateData.template.content
            .replace('{{playerName}}', templateData.playerNames?.[playerId] || 'Player')
            .replace('{{date}}', new Date().toLocaleDateString()),
          tone: templateData.template.tone,
          isPrivate: templateData.template.isPrivate || false,
          status: 'pending',
          tags: templateData.template.tags || [],
          followUpRequired: templateData.template.followUpRequired || false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );

      const savedFeedbacks = await this.repository.save(feedbackItems);

      res.status(201).json({
        success: true,
        data: {
          created: savedFeedbacks.length,
          feedbacks: savedFeedbacks.map(feedback => ({
            id: feedback.id,
            playerId: feedback.playerId,
            title: feedback.title,
            type: feedback.type,
            createdAt: feedback.createdAt
          }))
        }
      });
    } catch (error) {
      console.error('Error creating feedback from template:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get feedback statistics for coach
   * GET /api/training/player-feedback/coach-stats
   */
  public getCoachFeedbackStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId, fromDate, toDate } = req.query;
      const coachId = req.user?.id;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('feedback')
        .where('feedback.coachId = :coachId', { coachId });

      if (teamId && validateUUID(teamId as string)) {
        queryBuilder = queryBuilder.andWhere('feedback.teamId = :teamId', { teamId });
      }

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('feedback.createdAt >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('feedback.createdAt <= :toDate', { toDate });
      }

      const feedbacks = await queryBuilder.getMany();

      // Calculate statistics
      const totalFeedback = feedbacks.length;
      
      const feedbackByType = feedbacks.reduce((acc, feedback) => {
        acc[feedback.type] = (acc[feedback.type] || 0) + 1;
        return acc;
      }, {} as Record<FeedbackType, number>);

      const feedbackByStatus = feedbacks.reduce((acc, feedback) => {
        acc[feedback.status] = (acc[feedback.status] || 0) + 1;
        return acc;
      }, {} as Record<FeedbackStatus, number>);

      const feedbackByTone = feedbacks.reduce((acc, feedback) => {
        acc[feedback.tone] = (acc[feedback.tone] || 0) + 1;
        return acc;
      }, {} as Record<FeedbackTone, number>);

      const responseRate = totalFeedback > 0 
        ? Math.round((feedbacks.filter(f => f.playerResponse).length / totalFeedback) * 100) 
        : 0;

      const discussedRate = totalFeedback > 0
        ? Math.round((feedbacks.filter(f => f.status === 'discussed').length / totalFeedback) * 100)
        : 0;

      const followUpRequired = feedbacks.filter(f => f.followUpRequired && f.status !== 'follow_up_completed').length;

      const stats: CoachFeedbackStatsDto = {
        totalFeedback,
        feedbackByType,
        feedbackByStatus,
        feedbackByTone,
        responseRate,
        discussedRate,
        followUpRequired,
        averageFeedbackPerPlayer: 0, // Will calculate below
        mostCommonTags: []
      };

      // Calculate average feedback per player
      const uniquePlayers = [...new Set(feedbacks.map(f => f.playerId))];
      stats.averageFeedbackPerPlayer = uniquePlayers.length > 0 
        ? Math.round((totalFeedback / uniquePlayers.length) * 100) / 100 
        : 0;

      // Calculate most common tags
      const tagCounts = feedbacks.reduce((acc, feedback) => {
        feedback.tags?.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      stats.mostCommonTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting coach feedback stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Delete feedback
   * DELETE /api/training/player-feedback/:id
   */
  public deleteFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid feedback ID format'
        });
        return;
      }

      const feedback = await this.repository.findOne({ where: { id } });

      if (!feedback) {
        res.status(404).json({
          success: false,
          error: 'Feedback not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && feedback.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this feedback'
        });
        return;
      }

      await this.repository.remove(feedback);

      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}