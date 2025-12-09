import { Request, Response, NextFunction } from 'express';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { getRepository } from 'typeorm';
import { GameStrategy, Lineups, Matchup, SpecialInstruction, OpponentScouting, PeriodAdjustment, PostGameAnalysis } from '../../entities/GameStrategy';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import { IsString, IsUUID, IsOptional, IsArray, IsObject, IsBoolean, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const logger = new Logger('GameStrategyController');

// DTOs for validation
export class CreateGameStrategyDto {
  @IsUUID()
  teamId: string;

  @IsUUID()
  gameId: string;

  @IsUUID()
  opponentTeamId: string;

  @IsString()
  opponentTeamName: string;

  @IsObject()
  lineups: Lineups;

  @IsOptional()
  @IsArray()
  matchups?: Matchup[];

  @IsOptional()
  @IsArray()
  specialInstructions?: SpecialInstruction[];

  @IsOptional()
  @IsObject()
  opponentScouting?: OpponentScouting;

  @IsOptional()
  @IsString()
  preGameSpeech?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateGameStrategyDto {
  @IsOptional()
  @IsObject()
  lineups?: Lineups;

  @IsOptional()
  @IsArray()
  matchups?: Matchup[];

  @IsOptional()
  @IsArray()
  specialInstructions?: SpecialInstruction[];

  @IsOptional()
  @IsObject()
  opponentScouting?: OpponentScouting;

  @IsOptional()
  @IsString()
  preGameSpeech?: string;

  @IsOptional()
  @IsArray()
  periodAdjustments?: PeriodAdjustment[];

  @IsOptional()
  @IsObject()
  postGameAnalysis?: PostGameAnalysis;

  @IsOptional()
  @IsBoolean()
  gameCompleted?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class GameStrategyQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  gameId?: string;

  @IsOptional()
  @IsUUID()
  opponentTeamId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  gameCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class GameStrategyController {
  
  /**
   * Create a new game strategy
   * POST /api/planning/game-strategies
   */
  static async create(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const strategyData = req.body as CreateGameStrategyDto;
      const coachId = req.user!.userId;
      const organizationId = req.user!.organizationId;

      logger.info(`Creating game strategy for game ${strategyData.gameId} vs ${strategyData.opponentTeamName} by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      
      // Check if strategy already exists for this game
      const existingStrategy = await repository.findOne({
        where: {
          gameId: strategyData.gameId,
          organizationId
        }
      });

      if (existingStrategy) {
        return res.status(409).json({ error: 'Strategy already exists for this game' });
      }

      const gameStrategy = repository.create({
        ...strategyData,
        organizationId,
        coachId,
        gameCompleted: false
      });

      const savedStrategy = await repository.save(gameStrategy);
      
      logger.info(`Game strategy created with id: ${savedStrategy.id}`);
      res.status(201).json(savedStrategy);
    } catch (error) {
      logger.error('Error creating game strategy:', error);
      next(error);
    }
  }

  /**
   * Get game strategies with filtering and pagination
   * GET /api/planning/game-strategies?teamId=xxx&gameCompleted=xxx&startDate=xxx&endDate=xxx&search=xxx&page=1&pageSize=20
   */
  static async list(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { teamId, gameId, opponentTeamId, gameCompleted, startDate, endDate, search, page = 1, pageSize = 20 } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting game strategies for organization ${organizationId}`);

      const repository = getRepository(GameStrategy);
      const queryBuilder = repository.createQueryBuilder('strategy')
        .where('strategy.organizationId = :organizationId', { organizationId });

      // Apply filters
      if (teamId) {
        queryBuilder.andWhere('strategy.teamId = :teamId', { teamId });
      }

      if (gameId) {
        queryBuilder.andWhere('strategy.gameId = :gameId', { gameId });
      }

      if (opponentTeamId) {
        queryBuilder.andWhere('strategy.opponentTeamId = :opponentTeamId', { opponentTeamId });
      }

      if (gameCompleted !== undefined) {
        queryBuilder.andWhere('strategy.gameCompleted = :gameCompleted', { gameCompleted: gameCompleted === 'true' });
      }

      if (startDate) {
        queryBuilder.andWhere('strategy.createdAt >= :startDate', { startDate: new Date(startDate) });
      }

      if (endDate) {
        queryBuilder.andWhere('strategy.createdAt <= :endDate', { endDate: new Date(endDate) });
      }

      if (search) {
        queryBuilder.andWhere('(strategy.opponentTeamName ILIKE :search OR strategy.preGameSpeech ILIKE :search)', { 
          search: `%${search}%` 
        });
      }

      // Add ordering
      queryBuilder.orderBy('strategy.createdAt', 'DESC');

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [strategies, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(strategies, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error getting game strategies:', error);
      next(error);
    }
  }

  /**
   * Get a single game strategy by ID
   * GET /api/planning/game-strategies/:id
   */
  static async getById(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting game strategy ${id}`);

      const repository = getRepository(GameStrategy);
      const strategy = await repository.findOne({
        where: { 
          id, 
          organizationId
        }
      });

      if (!strategy) {
        return res.status(404).json({ error: 'Game strategy not found' });
      }

      res.json(strategy);
    } catch (error) {
      logger.error('Error getting game strategy by ID:', error);
      next(error);
    }
  }

  /**
   * Get game strategy by game ID
   * GET /api/planning/game-strategies/by-game/:gameId
   */
  static async getByGameId(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { gameId } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting game strategy for game ${gameId}`);

      const repository = getRepository(GameStrategy);
      const strategy = await repository.findOne({
        where: { 
          gameId, 
          organizationId
        }
      });

      if (!strategy) {
        return res.status(404).json({ error: 'Game strategy not found' });
      }

      res.json(strategy);
    } catch (error) {
      logger.error('Error getting game strategy by game ID:', error);
      next(error);
    }
  }

  /**
   * Update a game strategy
   * PUT /api/planning/game-strategies/:id
   */
  static async update(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateGameStrategyDto;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating game strategy ${id} by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      const strategy = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId // Only coach who created can update
        }
      });

      if (!strategy) {
        return res.status(404).json({ error: 'Game strategy not found or no permission to update' });
      }

      // Apply updates
      Object.assign(strategy, updates);
      const updatedStrategy = await repository.save(strategy);

      logger.info(`Game strategy ${id} updated successfully`);
      res.json(updatedStrategy);
    } catch (error) {
      logger.error('Error updating game strategy:', error);
      next(error);
    }
  }

  /**
   * Delete a game strategy
   * DELETE /api/planning/game-strategies/:id
   */
  static async delete(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Deleting game strategy ${id} by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      const result = await repository.delete({
        id,
        organizationId,
        coachId // Only coach who created can delete
      });

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Game strategy not found or no permission to delete' });
      }

      logger.info(`Game strategy ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting game strategy:', error);
      next(error);
    }
  }

  /**
   * Add period adjustment
   * POST /api/planning/game-strategies/:id/period-adjustments
   */
  static async addPeriodAdjustment(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adjustment = req.body as PeriodAdjustment;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Adding period adjustment for game strategy ${id} by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      const strategy = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId
        }
      });

      if (!strategy) {
        return res.status(404).json({ error: 'Game strategy not found or no permission to update' });
      }

      strategy.addPeriodAdjustment(adjustment);
      const updatedStrategy = await repository.save(strategy);

      logger.info(`Period adjustment added to game strategy ${id}`);
      res.json(updatedStrategy);
    } catch (error) {
      logger.error('Error adding period adjustment:', error);
      next(error);
    }
  }

  /**
   * Update post-game analysis
   * PUT /api/planning/game-strategies/:id/post-game-analysis
   */
  static async updatePostGameAnalysis(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const analysis = req.body as PostGameAnalysis;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating post-game analysis for game strategy ${id} by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      const strategy = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId
        }
      });

      if (!strategy) {
        return res.status(404).json({ error: 'Game strategy not found or no permission to update' });
      }

      strategy.postGameAnalysis = analysis;
      strategy.gameCompleted = true;
      const updatedStrategy = await repository.save(strategy);

      logger.info(`Post-game analysis updated for game strategy ${id}`);
      res.json(updatedStrategy);
    } catch (error) {
      logger.error('Error updating post-game analysis:', error);
      next(error);
    }
  }

  /**
   * Get lineup analysis
   * GET /api/planning/game-strategies/:id/lineup-analysis
   */
  static async getLineupAnalysis(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting lineup analysis for game strategy ${id}`);

      const repository = getRepository(GameStrategy);
      const strategy = await repository.findOne({
        where: { 
          id, 
          organizationId
        }
      });

      if (!strategy) {
        return res.status(404).json({ error: 'Game strategy not found' });
      }

      const analysis = {
        totalLineups: strategy.getTotalLineups(),
        playersInLineup: strategy.getPlayersInLineup(),
        averageChemistry: strategy.getAverageChemistry(),
        lineupBreakdown: {
          evenStrength: strategy.lineups.even_strength?.length || 0,
          powerplay: strategy.lineups.powerplay?.length || 0,
          penaltyKill: strategy.lineups.penalty_kill?.length || 0,
          overtime: strategy.lineups.overtime?.length || 0,
          extraAttacker: strategy.lineups.extra_attacker?.length || 0
        }
      };

      res.json(analysis);
    } catch (error) {
      logger.error('Error getting lineup analysis:', error);
      next(error);
    }
  }

  /**
   * Clone game strategy from previous game
   * POST /api/planning/game-strategies/:id/clone
   */
  static async clone(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newGameId, newOpponentTeamId, newOpponentTeamName } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Cloning game strategy ${id} for new game ${newGameId} by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      const originalStrategy = await repository.findOne({
        where: { 
          id, 
          organizationId
        }
      });

      if (!originalStrategy) {
        return res.status(404).json({ error: 'Game strategy not found' });
      }

      // Check if strategy already exists for the new game
      const existingStrategy = await repository.findOne({
        where: {
          gameId: newGameId,
          organizationId
        }
      });

      if (existingStrategy) {
        return res.status(409).json({ error: 'Strategy already exists for the target game' });
      }

      // Create clone
      const { id: _, createdAt, updatedAt, gameId, opponentTeamId, opponentTeamName, gameCompleted, periodAdjustments, postGameAnalysis, ...strategyData } = originalStrategy as any;
      const clonedStrategy = repository.create({
        ...strategyData,
        gameId: newGameId,
        opponentTeamId: newOpponentTeamId,
        opponentTeamName: newOpponentTeamName,
        coachId,
        gameCompleted: false,
        periodAdjustments: null,
        postGameAnalysis: null
      });

      const savedStrategy = await repository.save(clonedStrategy);

      logger.info(`Game strategy cloned with id: ${savedStrategy.id}`);
      res.status(201).json(savedStrategy);
    } catch (error) {
      logger.error('Error cloning game strategy:', error);
      next(error);
    }
  }

  /**
   * Get game strategy statistics
   * GET /api/planning/game-strategies/stats?teamId=xxx&startDate=xxx&endDate=xxx
   */
  static async getStats(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { teamId, startDate, endDate } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting game strategy statistics for organization ${organizationId}`);

      const repository = getRepository(GameStrategy);
      const queryBuilder = repository.createQueryBuilder('strategy')
        .where('strategy.organizationId = :organizationId', { organizationId });

      if (teamId) {
        queryBuilder.andWhere('strategy.teamId = :teamId', { teamId });
      }

      if (startDate) {
        queryBuilder.andWhere('strategy.createdAt >= :startDate', { startDate: new Date(startDate) });
      }

      if (endDate) {
        queryBuilder.andWhere('strategy.createdAt <= :endDate', { endDate: new Date(endDate) });
      }

      const strategies = await queryBuilder.getMany();

      // Calculate statistics
      const stats = {
        totalStrategies: strategies.length,
        completedGames: strategies.filter(s => s.gameCompleted).length,
        upcomingGames: strategies.filter(s => !s.gameCompleted).length,
        averageChemistry: 0,
        commonOpponents: {} as Record<string, number>,
        averageTeamRating: 0
      };

      let totalChemistry = 0;
      let totalRatings = 0;
      let ratingCount = 0;

      strategies.forEach(strategy => {
        // Count opponents
        stats.commonOpponents[strategy.opponentTeamName] = (stats.commonOpponents[strategy.opponentTeamName] || 0) + 1;
        
        // Sum chemistry
        totalChemistry += strategy.getAverageChemistry();
        
        // Sum team ratings from post-game analysis
        if (strategy.postGameAnalysis) {
          const teamRating = strategy.getTeamAverageRating();
          if (teamRating > 0) {
            totalRatings += teamRating;
            ratingCount++;
          }
        }
      });

      stats.averageChemistry = strategies.length > 0 ? totalChemistry / strategies.length : 0;
      stats.averageTeamRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

      res.json(stats);
    } catch (error) {
      logger.error('Error getting game strategy statistics:', error);
      next(error);
    }
  }

  /**
   * Bulk operations for game strategies
   * POST /api/planning/game-strategies/bulk
   */
  static async bulk(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { action, strategyIds } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Performing bulk ${action} on game strategies by coach ${coachId}`);

      const repository = getRepository(GameStrategy);
      
      if (action === 'delete') {
        const result = await repository.delete({
          id: { $in: strategyIds } as any,
          organizationId,
          coachId
        });
        res.json({ success: true, affectedCount: result.affected || 0 });
      } else if (action === 'mark_completed') {
        const result = await repository.update(
          { 
            id: { $in: strategyIds } as any,
            organizationId,
            coachId
          },
          { gameCompleted: true }
        );
        res.json({ success: true, affectedCount: result.affected || 0 });
      } else {
        res.status(400).json({ error: 'Invalid bulk action' });
      }
    } catch (error) {
      logger.error('Error performing bulk operation on game strategies:', error);
      next(error);
    }
  }
}