import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { PlayerEvaluation, EvaluationType } from '../../entities/PlayerEvaluation';
import {
  CreatePlayerEvaluationDto,
  UpdatePlayerEvaluationDto,
  PlayerEvaluationResponseDto
} from '../../dto/coach';
import { validationResult } from 'express-validator';
import { validateUUID } from '@hockey-hub/shared-lib';

export class PlayerEvaluationController {
  private repository: Repository<PlayerEvaluation>;

  constructor() {
    this.repository = AppDataSource.getRepository(PlayerEvaluation);
  }

  /**
   * Create a new player evaluation
   * POST /api/training/evaluations
   */
  public createEvaluation = async (req: Request, res: Response): Promise<void> => {
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

      const evaluationData: CreatePlayerEvaluationDto = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      // Create evaluation with coach ID from authenticated user
      const evaluation = this.repository.create({
        ...evaluationData,
        coachId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedEvaluation = await this.repository.save(evaluation);

      const response: PlayerEvaluationResponseDto = {
        id: savedEvaluation.id,
        playerId: savedEvaluation.playerId,
        coachId: savedEvaluation.coachId,
        teamId: savedEvaluation.teamId,
        evaluationDate: savedEvaluation.evaluationDate,
        type: savedEvaluation.type,
        technicalSkills: savedEvaluation.technicalSkills,
        tacticalSkills: savedEvaluation.tacticalSkills,
        physicalAttributes: savedEvaluation.physicalAttributes,
        mentalAttributes: savedEvaluation.mentalAttributes,
        strengths: savedEvaluation.strengths,
        areasForImprovement: savedEvaluation.areasForImprovement,
        coachComments: savedEvaluation.coachComments,
        gameSpecificNotes: savedEvaluation.gameSpecificNotes,
        developmentPriorities: savedEvaluation.developmentPriorities,
        overallRating: savedEvaluation.overallRating,
        potential: savedEvaluation.potential,
        createdAt: savedEvaluation.createdAt,
        updatedAt: savedEvaluation.updatedAt
      };

      res.status(201).json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error creating player evaluation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get evaluations for a specific player
   * GET /api/training/evaluations/player/:playerId
   */
  public getPlayerEvaluations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId } = req.params;
      const { type, limit = 10, offset = 0 } = req.query;

      if (!validateUUID(playerId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid player ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('evaluation')
        .where('evaluation.playerId = :playerId', { playerId })
        .orderBy('evaluation.evaluationDate', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (type && Object.values(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']).includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('evaluation.type = :type', { type });
      }

      const [evaluations, total] = await queryBuilder.getManyAndCount();

      const response = evaluations.map(evaluation => ({
        id: evaluation.id,
        playerId: evaluation.playerId,
        coachId: evaluation.coachId,
        teamId: evaluation.teamId,
        evaluationDate: evaluation.evaluationDate,
        type: evaluation.type,
        technicalSkills: evaluation.technicalSkills,
        tacticalSkills: evaluation.tacticalSkills,
        physicalAttributes: evaluation.physicalAttributes,
        mentalAttributes: evaluation.mentalAttributes,
        strengths: evaluation.strengths,
        areasForImprovement: evaluation.areasForImprovement,
        coachComments: evaluation.coachComments,
        gameSpecificNotes: evaluation.gameSpecificNotes,
        developmentPriorities: evaluation.developmentPriorities,
        overallRating: evaluation.overallRating,
        potential: evaluation.potential,
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt
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
      console.error('Error fetching player evaluations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get latest evaluations for all players in a team
   * GET /api/training/evaluations/team/:teamId/latest
   */
  public getTeamLatestEvaluations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId } = req.params;
      const { type } = req.query;

      if (!validateUUID(teamId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid team ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('evaluation')
        .where('evaluation.teamId = :teamId', { teamId });

      if (type && Object.values(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']).includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('evaluation.type = :type', { type });
      }

      // Get the most recent evaluation for each player
      const subQuery = this.repository.createQueryBuilder('sub')
        .select('MAX(sub.evaluationDate)', 'maxDate')
        .addSelect('sub.playerId', 'playerId')
        .where('sub.teamId = :teamId', { teamId });

      if (type) {
        subQuery.andWhere('sub.type = :type', { type });
      }

      subQuery.groupBy('sub.playerId');

      const evaluations = await queryBuilder
        .innerJoin(
          '(' + subQuery.getQuery() + ')',
          'latest',
          'evaluation.playerId = latest.playerId AND evaluation.evaluationDate = latest.maxDate'
        )
        .setParameters(subQuery.getParameters())
        .orderBy('evaluation.overallRating', 'DESC')
        .getMany();

      const response = evaluations.map(evaluation => ({
        id: evaluation.id,
        playerId: evaluation.playerId,
        coachId: evaluation.coachId,
        teamId: evaluation.teamId,
        evaluationDate: evaluation.evaluationDate,
        type: evaluation.type,
        technicalSkills: evaluation.technicalSkills,
        tacticalSkills: evaluation.tacticalSkills,
        physicalAttributes: evaluation.physicalAttributes,
        mentalAttributes: evaluation.mentalAttributes,
        strengths: evaluation.strengths,
        areasForImprovement: evaluation.areasForImprovement,
        coachComments: evaluation.coachComments,
        gameSpecificNotes: evaluation.gameSpecificNotes,
        developmentPriorities: evaluation.developmentPriorities,
        overallRating: evaluation.overallRating,
        potential: evaluation.potential,
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt
      }));

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error fetching team latest evaluations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Bulk create evaluations (for team evaluation sessions)
   * POST /api/training/evaluations/bulk-create
   */
  public bulkCreateEvaluations = async (req: Request, res: Response): Promise<void> => {
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

      const { evaluations }: { evaluations: CreatePlayerEvaluationDto[] } = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      if (!Array.isArray(evaluations) || evaluations.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Evaluations array is required and cannot be empty'
        });
        return;
      }

      // Create all evaluations with the authenticated coach ID
      const evaluationEntities = evaluations.map(evaluationData => 
        this.repository.create({
          ...evaluationData,
          coachId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );

      const savedEvaluations = await this.repository.save(evaluationEntities);

      res.status(201).json({
        success: true,
        data: {
          created: savedEvaluations.length,
          evaluations: savedEvaluations.map(evaluation => ({
            id: evaluation.id,
            playerId: evaluation.playerId,
            evaluationDate: evaluation.evaluationDate,
            type: evaluation.type,
            overallRating: evaluation.overallRating
          }))
        }
      });
    } catch (error) {
      console.error('Error bulk creating evaluations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Compare evaluations between players or time periods
   * GET /api/training/evaluations/compare
   */
  public compareEvaluations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerIds, fromDate, toDate, type } = req.query;

      if (!playerIds) {
        res.status(400).json({
          success: false,
          error: 'Player IDs are required for comparison'
        });
        return;
      }

      const playerIdArray = (playerIds as string).split(',');
      
      // Validate all player IDs
      for (const playerId of playerIdArray) {
        if (!validateUUID(playerId.trim())) {
          res.status(400).json({
            success: false,
            error: `Invalid player ID format: ${playerId}`
          });
          return;
        }
      }

      let queryBuilder = this.repository.createQueryBuilder('evaluation')
        .where('evaluation.playerId IN (:...playerIds)', { playerIds: playerIdArray });

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('evaluation.evaluationDate >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('evaluation.evaluationDate <= :toDate', { toDate });
      }

      if (type && Object.values(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']).includes(type as string)) {
        queryBuilder = queryBuilder.andWhere('evaluation.type = :type', { type });
      }

      const evaluations = await queryBuilder
        .orderBy('evaluation.playerId')
        .addOrderBy('evaluation.evaluationDate', 'DESC')
        .getMany();

      // Group evaluations by player for easy comparison
      const groupedEvaluations = evaluations.reduce((acc, evaluation) => {
        if (!acc[evaluation.playerId]) {
          acc[evaluation.playerId] = [];
        }
        acc[evaluation.playerId].push({
          id: evaluation.id,
          evaluationDate: evaluation.evaluationDate,
          type: evaluation.type,
          technicalSkills: evaluation.technicalSkills,
          tacticalSkills: evaluation.tacticalSkills,
          physicalAttributes: evaluation.physicalAttributes,
          mentalAttributes: evaluation.mentalAttributes,
          overallRating: evaluation.overallRating,
          potential: evaluation.potential
        });
        return acc;
      }, {} as Record<string, any[]>);

      res.json({
        success: true,
        data: {
          playerComparison: groupedEvaluations,
          totalEvaluations: evaluations.length,
          playersCompared: Object.keys(groupedEvaluations).length
        }
      });
    } catch (error) {
      console.error('Error comparing evaluations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update an existing evaluation
   * PUT /api/training/evaluations/:id
   */
  public updateEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdatePlayerEvaluationDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid evaluation ID format'
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

      const evaluation = await this.repository.findOne({ where: { id } });

      if (!evaluation) {
        res.status(404).json({
          success: false,
          error: 'Evaluation not found'
        });
        return;
      }

      // Check if the coach owns this evaluation (authorization)
      const coachId = req.user?.id;
      if (coachId && evaluation.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this evaluation'
        });
        return;
      }

      // Update the evaluation
      Object.assign(evaluation, {
        ...updateData,
        updatedAt: new Date()
      });

      const savedEvaluation = await this.repository.save(evaluation);

      const response: PlayerEvaluationResponseDto = {
        id: savedEvaluation.id,
        playerId: savedEvaluation.playerId,
        coachId: savedEvaluation.coachId,
        teamId: savedEvaluation.teamId,
        evaluationDate: savedEvaluation.evaluationDate,
        type: savedEvaluation.type,
        technicalSkills: savedEvaluation.technicalSkills,
        tacticalSkills: savedEvaluation.tacticalSkills,
        physicalAttributes: savedEvaluation.physicalAttributes,
        mentalAttributes: savedEvaluation.mentalAttributes,
        strengths: savedEvaluation.strengths,
        areasForImprovement: savedEvaluation.areasForImprovement,
        coachComments: savedEvaluation.coachComments,
        gameSpecificNotes: savedEvaluation.gameSpecificNotes,
        developmentPriorities: savedEvaluation.developmentPriorities,
        overallRating: savedEvaluation.overallRating,
        potential: savedEvaluation.potential,
        createdAt: savedEvaluation.createdAt,
        updatedAt: savedEvaluation.updatedAt
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error updating evaluation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Delete an evaluation
   * DELETE /api/training/evaluations/:id
   */
  public deleteEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid evaluation ID format'
        });
        return;
      }

      const evaluation = await this.repository.findOne({ where: { id } });

      if (!evaluation) {
        res.status(404).json({
          success: false,
          error: 'Evaluation not found'
        });
        return;
      }

      // Check if the coach owns this evaluation (authorization)
      const coachId = req.user?.id;
      if (coachId && evaluation.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this evaluation'
        });
        return;
      }

      await this.repository.remove(evaluation);

      res.json({
        success: true,
        message: 'Evaluation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get evaluation statistics for analytics
   * GET /api/training/evaluations/stats
   */
  public getEvaluationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId, playerId, fromDate, toDate } = req.query;

      let queryBuilder = this.repository.createQueryBuilder('evaluation');

      if (teamId && validateUUID(teamId as string)) {
        queryBuilder = queryBuilder.where('evaluation.teamId = :teamId', { teamId });
      }

      if (playerId && validateUUID(playerId as string)) {
        queryBuilder = queryBuilder.andWhere('evaluation.playerId = :playerId', { playerId });
      }

      if (fromDate) {
        queryBuilder = queryBuilder.andWhere('evaluation.evaluationDate >= :fromDate', { fromDate });
      }

      if (toDate) {
        queryBuilder = queryBuilder.andWhere('evaluation.evaluationDate <= :toDate', { toDate });
      }

      const evaluations = await queryBuilder.getMany();

      // Calculate statistics
      const totalEvaluations = evaluations.length;
      const avgOverallRating = evaluations.reduce((sum, eval) => sum + (eval.overallRating || 0), 0) / totalEvaluations;
      
      const evaluationsByType = evaluations.reduce((acc, eval) => {
        acc[eval.type] = (acc[eval.type] || 0) + 1;
        return acc;
      }, {} as Record<EvaluationType, number>);

      const potentialDistribution = evaluations.reduce((acc, eval) => {
        if (eval.potential) {
          acc[eval.potential] = (acc[eval.potential] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: {
          totalEvaluations,
          averageOverallRating: Math.round(avgOverallRating * 100) / 100,
          evaluationsByType,
          potentialDistribution,
          dateRange: {
            from: fromDate || null,
            to: toDate || null
          }
        }
      });
    } catch (error) {
      console.error('Error getting evaluation stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}