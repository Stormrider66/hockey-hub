import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { WorkoutSession } from '../entities/WorkoutSession';
import { WorkoutAssignment } from '../entities/WorkoutAssignment';
import { PlayerWellnessService } from '../services/PlayerWellnessService';
import { CreateWellnessEntryDto, UpdateTrainingMetricsDto } from '../dto/player-wellness.dto';
import { logger } from '@hockey-hub/shared-lib';

let playerWellnessService: PlayerWellnessService | null = null;

// Initialize service when database is available
const getPlayerWellnessService = (): PlayerWellnessService => {
  if (!playerWellnessService && AppDataSource.isInitialized) {
    const workoutSessionRepository = AppDataSource.getRepository(WorkoutSession);
    const workoutAssignmentRepository = AppDataSource.getRepository(WorkoutAssignment);
    playerWellnessService = new PlayerWellnessService(
      workoutSessionRepository,
      workoutAssignmentRepository
    );
  }
  
  if (!playerWellnessService) {
    // Create a temporary service for mock functionality
    playerWellnessService = new PlayerWellnessService({} as any, {} as any);
  }
  
  return playerWellnessService;
};

/**
 * Get player readiness status for a team
 * GET /api/training/player-status?teamId={teamId}
 */
export const getTeamPlayerStatus = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required' 
      });
    }

    if (!teamId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'teamId parameter is required' 
      });
    }

    const service = getPlayerWellnessService();
    const teamStatus = await service.getTeamPlayerStatus(teamId as string);

    logger.info(`Team player status retrieved for team ${teamId} by user ${userId}`);

    res.json({
      success: true,
      data: teamStatus,
      timestamp: new Date().toISOString(),
      mock: !AppDataSource.isInitialized
    });
  } catch (error) {
    logger.error('Error getting team player status:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve team player status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get detailed wellness metrics for a specific player
 * GET /api/training/player-wellness/{playerId}
 */
export const getPlayerWellnessDetail = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required' 
      });
    }

    if (!playerId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'playerId parameter is required' 
      });
    }

    const service = getPlayerWellnessService();
    const wellnessDetail = await service.getPlayerWellnessDetail(playerId);

    logger.info(`Player wellness detail retrieved for player ${playerId} by user ${userId}`);

    res.json({
      success: true,
      data: wellnessDetail,
      timestamp: new Date().toISOString(),
      mock: !AppDataSource.isInitialized
    });
  } catch (error) {
    logger.error('Error getting player wellness detail:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve player wellness detail',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get training metrics for a specific player
 * GET /api/training/player-metrics/{playerId}
 */
export const getPlayerTrainingMetrics = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required' 
      });
    }

    if (!playerId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'playerId parameter is required' 
      });
    }

    const service = getPlayerWellnessService();
    const trainingMetrics = await service.getPlayerTrainingMetrics(playerId);

    logger.info(`Player training metrics retrieved for player ${playerId} by user ${userId}`);

    res.json({
      success: true,
      data: trainingMetrics,
      timestamp: new Date().toISOString(),
      mock: !AppDataSource.isInitialized
    });
  } catch (error) {
    logger.error('Error getting player training metrics:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve player training metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create a wellness entry for a player
 * POST /api/training/player-wellness
 */
export const createWellnessEntry = async (req: Request, res: Response) => {
  try {
    const wellnessData: CreateWellnessEntryDto = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required' 
      });
    }

    // Validate required fields
    const { playerId, sleep, stress, energy, soreness, mood } = wellnessData;
    if (!playerId || sleep === undefined || stress === undefined || 
        energy === undefined || soreness === undefined || mood === undefined) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'All wellness metrics (sleep, stress, energy, soreness, mood) are required' 
      });
    }

    const service = getPlayerWellnessService();
    const result = await service.createWellnessEntry(wellnessData);

    logger.info(`Wellness entry created for player ${playerId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      mock: !AppDataSource.isInitialized
    });
  } catch (error) {
    logger.error('Error creating wellness entry:', error);
    
    if (error instanceof Error && error.message.includes('must be between')) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to create wellness entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update training metrics for a player
 * PUT /api/training/player-metrics
 */
export const updateTrainingMetrics = async (req: Request, res: Response) => {
  try {
    const metricsData: UpdateTrainingMetricsDto = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required' 
      });
    }

    // Validate required fields
    const { playerId } = metricsData;
    if (!playerId) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'playerId is required' 
      });
    }

    const service = getPlayerWellnessService();
    const result = await service.updateTrainingMetrics(metricsData);

    logger.info(`Training metrics updated for player ${playerId} by user ${userId}`);

    res.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      mock: !AppDataSource.isInitialized
    });
  } catch (error) {
    logger.error('Error updating training metrics:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update training metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get wellness summary for multiple players
 * POST /api/training/player-wellness/batch
 */
export const getBatchWellnessSummary = async (req: Request, res: Response) => {
  try {
    const { playerIds } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User authentication required' 
      });
    }

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'playerIds array is required and must not be empty' 
      });
    }

    const service = getPlayerWellnessService();
    const summaries = await Promise.all(
      playerIds.map(async (playerId: string) => {
        const wellness = await service.getPlayerWellnessDetail(playerId);
        return {
          playerId,
          playerName: wellness.playerName,
          currentWellness: wellness.currentWellness,
          overallTrend: wellness.trends.overall,
          alertLevel: wellness.currentWellness.sleep < 6 || 
                     wellness.currentWellness.stress > 7 || 
                     wellness.currentWellness.energy < 6 ? 'high' : 'normal'
        };
      })
    );

    logger.info(`Batch wellness summary retrieved for ${playerIds.length} players by user ${userId}`);

    res.json({
      success: true,
      data: summaries,
      timestamp: new Date().toISOString(),
      mock: !AppDataSource.isInitialized
    });
  } catch (error) {
    logger.error('Error getting batch wellness summary:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve batch wellness summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};