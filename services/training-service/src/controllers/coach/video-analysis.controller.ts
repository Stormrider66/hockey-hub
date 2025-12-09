import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { VideoAnalysis, VideoAnalysisType, ClipCategory, ImportanceLevel } from '../../entities/VideoAnalysis';
import {
  CreateVideoAnalysisDto,
  UpdateVideoAnalysisDto,
  VideoAnalysisResponseDto,
  AddVideoClipDto,
  UpdateVideoClipDto,
  ShareVideoAnalysisDto,
  VideoAnalysisFilterDto,
  BulkShareDto
} from '../../dto/coach';
import { validationResult } from 'express-validator';
import { validateUUID } from '@hockey-hub/shared-lib';

export class VideoAnalysisController {
  private repository: Repository<VideoAnalysis>;

  constructor() {
    this.repository = AppDataSource.getRepository(VideoAnalysis);
  }

  /**
   * Create a new video analysis
   * POST /api/training/video-analysis
   */
  public createVideoAnalysis = async (req: Request, res: Response): Promise<void> => {
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

      const analysisData: CreateVideoAnalysisDto = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      const analysis = this.repository.create({
        ...analysisData,
        coachId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedAnalysis = await this.repository.save(analysis);

      const response: VideoAnalysisResponseDto = {
        id: savedAnalysis.id,
        playerId: savedAnalysis.playerId,
        coachId: savedAnalysis.coachId,
        teamId: savedAnalysis.teamId,
        title: savedAnalysis.title,
        description: savedAnalysis.description,
        analysisDate: savedAnalysis.analysisDate,
        gameDate: savedAnalysis.gameDate,
        opponent: savedAnalysis.opponent,
        type: savedAnalysis.type,
        videoClips: savedAnalysis.videoClips,
        analysisPoints: savedAnalysis.analysisPoints,
        playerPerformance: savedAnalysis.playerPerformance,
        teamAnalysis: savedAnalysis.teamAnalysis,
        tags: savedAnalysis.tags,
        isShared: savedAnalysis.isShared,
        sharedWith: savedAnalysis.sharedWith,
        playerViewed: savedAnalysis.playerViewed,
        playerViewedAt: savedAnalysis.playerViewedAt,
        createdAt: savedAnalysis.createdAt,
        updatedAt: savedAnalysis.updatedAt
      };

      res.status(201).json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error creating video analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get video analyses for a specific player
   * GET /api/training/video-analysis/player/:playerId
   */
  public getPlayerVideoAnalyses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId } = req.params;
      const { type, fromDate, toDate, limit = 10, offset = 0 } = req.query;

      if (!validateUUID(playerId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid player ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('analysis')
        .where('analysis.playerId = :playerId', { playerId })
        .orderBy('analysis.analysisDate', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (type && ['game', 'practice', 'skill_development', 'tactical'].includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('analysis.type = :type', { type });
      }

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('analysis.analysisDate >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('analysis.analysisDate <= :toDate', { toDate });
      }

      const [analyses, total] = await queryBuilder.getManyAndCount();

      const response = analyses.map(analysis => ({
        id: analysis.id,
        playerId: analysis.playerId,
        coachId: analysis.coachId,
        teamId: analysis.teamId,
        title: analysis.title,
        description: analysis.description,
        analysisDate: analysis.analysisDate,
        gameDate: analysis.gameDate,
        opponent: analysis.opponent,
        type: analysis.type,
        videoClips: analysis.videoClips,
        analysisPoints: analysis.analysisPoints,
        playerPerformance: analysis.playerPerformance,
        teamAnalysis: analysis.teamAnalysis,
        tags: analysis.tags,
        isShared: analysis.isShared,
        sharedWith: analysis.sharedWith,
        playerViewed: analysis.playerViewed,
        playerViewedAt: analysis.playerViewedAt,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
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
      console.error('Error fetching player video analyses:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get team video analyses
   * GET /api/training/video-analysis/team/:teamId
   */
  public getTeamVideoAnalyses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId } = req.params;
      const { type, fromDate, toDate, limit = 20, offset = 0 } = req.query;

      if (!validateUUID(teamId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid team ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('analysis')
        .where('analysis.teamId = :teamId', { teamId })
        .orderBy('analysis.analysisDate', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (type && ['game', 'practice', 'skill_development', 'tactical'].includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('analysis.type = :type', { type });
      }

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('analysis.analysisDate >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('analysis.analysisDate <= :toDate', { toDate });
      }

      const [analyses, total] = await queryBuilder.getManyAndCount();

      const response = analyses.map(analysis => ({
        id: analysis.id,
        playerId: analysis.playerId,
        coachId: analysis.coachId,
        teamId: analysis.teamId,
        title: analysis.title,
        description: analysis.description,
        analysisDate: analysis.analysisDate,
        gameDate: analysis.gameDate,
        opponent: analysis.opponent,
        type: analysis.type,
        videoClips: analysis.videoClips.map(clip => ({
          id: clip.id,
          title: clip.title,
          startTime: clip.startTime,
          endTime: clip.endTime,
          category: clip.category,
          importance: clip.importance
        })),
        analysisPoints: analysis.analysisPoints,
        playerPerformance: analysis.playerPerformance,
        teamAnalysis: analysis.teamAnalysis,
        tags: analysis.tags,
        isShared: analysis.isShared,
        playerViewed: analysis.playerViewed,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
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
      console.error('Error fetching team video analyses:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update a video analysis
   * PUT /api/training/video-analysis/:id
   */
  public updateVideoAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateVideoAnalysisDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid video analysis ID format'
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

      const analysis = await this.repository.findOne({ where: { id } });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Video analysis not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && analysis.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this video analysis'
        });
        return;
      }

      // Update the analysis
      Object.assign(analysis, {
        ...updateData,
        updatedAt: new Date()
      });

      const savedAnalysis = await this.repository.save(analysis);

      const response: VideoAnalysisResponseDto = {
        id: savedAnalysis.id,
        playerId: savedAnalysis.playerId,
        coachId: savedAnalysis.coachId,
        teamId: savedAnalysis.teamId,
        title: savedAnalysis.title,
        description: savedAnalysis.description,
        analysisDate: savedAnalysis.analysisDate,
        gameDate: savedAnalysis.gameDate,
        opponent: savedAnalysis.opponent,
        type: savedAnalysis.type,
        videoClips: savedAnalysis.videoClips,
        analysisPoints: savedAnalysis.analysisPoints,
        playerPerformance: savedAnalysis.playerPerformance,
        teamAnalysis: savedAnalysis.teamAnalysis,
        tags: savedAnalysis.tags,
        isShared: savedAnalysis.isShared,
        sharedWith: savedAnalysis.sharedWith,
        playerViewed: savedAnalysis.playerViewed,
        playerViewedAt: savedAnalysis.playerViewedAt,
        createdAt: savedAnalysis.createdAt,
        updatedAt: savedAnalysis.updatedAt
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error updating video analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Add video clip to analysis
   * POST /api/training/video-analysis/:id/clips
   */
  public addVideoClip = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const clipData: AddVideoClipDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid video analysis ID format'
        });
        return;
      }

      const analysis = await this.repository.findOne({ where: { id } });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Video analysis not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && analysis.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this video analysis'
        });
        return;
      }

      // Add the new clip
      const newClip = {
        id: Date.now().toString(), // Simple ID generation
        title: clipData.title,
        videoUrl: clipData.videoUrl,
        startTime: clipData.startTime,
        endTime: clipData.endTime,
        category: clipData.category,
        importance: clipData.importance,
        description: clipData.description,
        notes: clipData.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      analysis.videoClips.push(newClip);
      analysis.updatedAt = new Date();

      const savedAnalysis = await this.repository.save(analysis);

      res.json({
        success: true,
        data: {
          clip: newClip,
          totalClips: savedAnalysis.videoClips.length
        }
      });
    } catch (error) {
      console.error('Error adding video clip:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update video clip
   * PUT /api/training/video-analysis/:id/clips/:clipId
   */
  public updateVideoClip = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, clipId } = req.params;
      const clipData: UpdateVideoClipDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid video analysis ID format'
        });
        return;
      }

      const analysis = await this.repository.findOne({ where: { id } });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Video analysis not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && analysis.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this video analysis'
        });
        return;
      }

      // Find and update the clip
      const clipIndex = analysis.videoClips.findIndex(clip => clip.id === clipId);

      if (clipIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Video clip not found'
        });
        return;
      }

      // Update clip
      analysis.videoClips[clipIndex] = {
        ...analysis.videoClips[clipIndex],
        ...clipData,
        updatedAt: new Date()
      };

      analysis.updatedAt = new Date();
      const savedAnalysis = await this.repository.save(analysis);

      res.json({
        success: true,
        data: {
          clip: analysis.videoClips[clipIndex],
          analysisLastUpdated: savedAnalysis.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating video clip:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Share video analysis with player
   * POST /api/training/video-analysis/:id/share
   */
  public shareVideoAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const shareData: ShareVideoAnalysisDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid video analysis ID format'
        });
        return;
      }

      const analysis = await this.repository.findOne({ where: { id } });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Video analysis not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && analysis.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to share this video analysis'
        });
        return;
      }

      // Update sharing information
      analysis.isShared = true;
      analysis.sharedWith = shareData.sharedWith || [analysis.playerId];
      analysis.updatedAt = new Date();

      const savedAnalysis = await this.repository.save(analysis);

      // TODO: Send notification to shared users
      // This would integrate with the notification service

      res.json({
        success: true,
        data: {
          isShared: savedAnalysis.isShared,
          sharedWith: savedAnalysis.sharedWith,
          sharedAt: savedAnalysis.updatedAt
        }
      });
    } catch (error) {
      console.error('Error sharing video analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Mark video analysis as viewed by player
   * POST /api/training/video-analysis/:id/viewed
   */
  public markAsViewed = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const playerId = req.user?.id || req.body.playerId;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid video analysis ID format'
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

      const analysis = await this.repository.findOne({ where: { id } });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Video analysis not found'
        });
        return;
      }

      // Check if the player is authorized to view this analysis
      if (analysis.playerId !== playerId && !analysis.sharedWith?.includes(playerId)) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to view this video analysis'
        });
        return;
      }

      // Mark as viewed
      analysis.playerViewed = true;
      analysis.playerViewedAt = new Date();
      analysis.updatedAt = new Date();

      const savedAnalysis = await this.repository.save(analysis);

      res.json({
        success: true,
        data: {
          playerViewed: savedAnalysis.playerViewed,
          playerViewedAt: savedAnalysis.playerViewedAt
        }
      });
    } catch (error) {
      console.error('Error marking video analysis as viewed:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Bulk share video analyses
   * POST /api/training/video-analysis/bulk-share
   */
  public bulkShareAnalyses = async (req: Request, res: Response): Promise<void> => {
    try {
      const shareData: BulkShareDto = req.body;
      const coachId = req.user?.id;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      if (!shareData.analysisIds || shareData.analysisIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Analysis IDs are required'
        });
        return;
      }

      // Validate all analysis IDs
      for (const analysisId of shareData.analysisIds) {
        if (!validateUUID(analysisId)) {
          res.status(400).json({
            success: false,
            error: `Invalid analysis ID format: ${analysisId}`
          });
          return;
        }
      }

      // Find and update all analyses
      const analyses = await this.repository.find({
        where: {
          id: { $in: shareData.analysisIds } as any,
          coachId
        }
      });

      if (analyses.length !== shareData.analysisIds.length) {
        res.status(404).json({
          success: false,
          error: 'Some analyses not found or not authorized'
        });
        return;
      }

      // Update all analyses
      const updatePromises = analyses.map(analysis => {
        analysis.isShared = true;
        analysis.sharedWith = shareData.sharedWith;
        analysis.updatedAt = new Date();
        return this.repository.save(analysis);
      });

      await Promise.all(updatePromises);

      res.json({
        success: true,
        data: {
          sharedCount: analyses.length,
          sharedWith: shareData.sharedWith
        }
      });
    } catch (error) {
      console.error('Error bulk sharing video analyses:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Delete a video analysis
   * DELETE /api/training/video-analysis/:id
   */
  public deleteVideoAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid video analysis ID format'
        });
        return;
      }

      const analysis = await this.repository.findOne({ where: { id } });

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Video analysis not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && analysis.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this video analysis'
        });
        return;
      }

      await this.repository.remove(analysis);

      res.json({
        success: true,
        message: 'Video analysis deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting video analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get video analysis statistics
   * GET /api/training/video-analysis/stats
   */
  public getVideoAnalysisStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId, playerId, fromDate, toDate } = req.query;

      let queryBuilder = this.repository.createQueryBuilder('analysis');

      if (teamId && validateUUID(teamId as string)) {
        queryBuilder = queryBuilder.where('analysis.teamId = :teamId', { teamId });
      }

      if (playerId && validateUUID(playerId as string)) {
        queryBuilder = queryBuilder.andWhere('analysis.playerId = :playerId', { playerId });
      }

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('analysis.analysisDate >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('analysis.analysisDate <= :toDate', { toDate });
      }

      const analyses = await queryBuilder.getMany();

      // Calculate statistics
      const totalAnalyses = analyses.length;
      const sharedAnalyses = analyses.filter(a => a.isShared).length;
      const viewedAnalyses = analyses.filter(a => a.playerViewed).length;

      const analysesByType = analyses.reduce((acc, analysis) => {
        acc[analysis.type] = (acc[analysis.type] || 0) + 1;
        return acc;
      }, {} as Record<VideoAnalysisType, number>);

      const totalClips = analyses.reduce((sum, analysis) => sum + analysis.videoClips.length, 0);
      const avgClipsPerAnalysis = totalAnalyses > 0 ? Math.round((totalClips / totalAnalyses) * 100) / 100 : 0;

      res.json({
        success: true,
        data: {
          totalAnalyses,
          sharedAnalyses,
          viewedAnalyses,
          shareRate: totalAnalyses > 0 ? Math.round((sharedAnalyses / totalAnalyses) * 100) : 0,
          viewRate: sharedAnalyses > 0 ? Math.round((viewedAnalyses / sharedAnalyses) * 100) : 0,
          analysesByType,
          totalClips,
          avgClipsPerAnalysis
        }
      });
    } catch (error) {
      console.error('Error getting video analysis stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}