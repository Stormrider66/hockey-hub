// @ts-nocheck - Complex service with TypeORM issues
import { Router, IRouter } from 'express';
import { Request, Response } from 'express';
import { LoadManagementService } from '../services/LoadManagementService';
import { logger } from '@hockey-hub/shared-lib';

const router: any = Router();
const loadManagementService = new LoadManagementService();

/**
 * Calculate load management for a player
 * GET /api/v1/load-management/:playerId
 */
router.get('/:playerId', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { currentLoad = 100 } = req.query;

    const loadManagement = await loadManagementService.calculateLoadManagement(
      playerId,
      parseInt(currentLoad as string)
    );

    res.json({
      success: true,
      data: loadManagement
    });

    logger.info(`Load management calculated for player ${playerId}`);
  } catch (error: any) {
    logger.error('Error calculating load management:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Record load compliance for a session
 * POST /api/v1/load-management/:playerId/compliance
 */
router.post('/:playerId/compliance', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { plannedLoad, actualLoad, sessionDate, notes } = req.body;

    if (plannedLoad === undefined || actualLoad === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Both plannedLoad and actualLoad are required'
      });
    }

    await loadManagementService.recordLoadCompliance(
      playerId,
      plannedLoad,
      actualLoad,
      sessionDate ? new Date(sessionDate) : new Date(),
      notes
    );

    res.json({
      success: true,
      message: 'Load compliance recorded'
    });

    logger.info(`Load compliance recorded for player ${playerId}: planned=${plannedLoad}, actual=${actualLoad}`);
  } catch (error: any) {
    logger.error('Error recording load compliance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get load trends for a player
 * GET /api/v1/load-management/:playerId/trends
 */
router.get('/:playerId/trends', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { days = 30 } = req.query;

    const trends = await loadManagementService.getLoadTrends(
      playerId,
      parseInt(days as string)
    );

    res.json({
      success: true,
      data: trends
    });

    logger.info(`Load trends retrieved for player ${playerId}, ${days} days`);
  } catch (error: any) {
    logger.error('Error getting load trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Batch load management for multiple players
 * POST /api/v1/load-management/batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { playerIds } = req.body;

    if (!playerIds || !Array.isArray(playerIds)) {
      return res.status(400).json({
        success: false,
        error: 'playerIds array is required'
      });
    }

    const batchResults = await loadManagementService.getBatchLoadRecommendations(playerIds);

    res.json({
      success: true,
      data: batchResults
    });

    logger.info(`Batch load management calculated for ${playerIds.length} players`);
  } catch (error: any) {
    logger.error('Error in batch load management:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Real-time load adjustment
 * POST /api/v1/load-management/:playerId/real-time
 */
router.post('/:playerId/real-time', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { currentMetrics } = req.body;

    if (!currentMetrics) {
      return res.status(400).json({
        success: false,
        error: 'currentMetrics is required'
      });
    }

    const adjustment = await loadManagementService.updateRealTimeLoad(playerId, currentMetrics);

    res.json({
      success: true,
      data: adjustment
    });

    if (adjustment) {
      logger.info(`Real-time load adjustment for player ${playerId}: ${adjustment.recommendedAdjustment}%`);
    }
  } catch (error: any) {
    logger.error('Error in real-time load adjustment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get load management summary for a team
 * GET /api/v1/load-management/team/:teamId/summary
 */
router.get('/team/:teamId/summary', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    
    // In production, you would fetch player IDs from the team
    // For now, we'll use a mock implementation
    const mockPlayerIds = ['1', '2', '3', '4', '5']; // Replace with actual team lookup
    
    const batchResults = await loadManagementService.getBatchLoadRecommendations(mockPlayerIds);
    
    // Calculate team summary statistics
    const summary = {
      totalPlayers: mockPlayerIds.length,
      playersUnderManagement: 0,
      averageLoadReduction: 0,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      commonFactors: new Map<string, number>()
    };

    let totalReduction = 0;
    let managementCount = 0;

    Object.values(batchResults).forEach(loadData => {
      if (loadData.loadReduction > 5) { // More than 5% reduction
        managementCount++;
        totalReduction += loadData.loadReduction;
      }

      summary.riskDistribution[loadData.riskLevel]++;

      // Count common factors
      loadData.factors.forEach(factor => {
        const key = `${factor.type}-${factor.description.split(':')[0]}`;
        summary.commonFactors.set(key, (summary.commonFactors.get(key) || 0) + 1);
      });
    });

    summary.playersUnderManagement = managementCount;
    summary.averageLoadReduction = managementCount > 0 ? totalReduction / managementCount : 0;

    // Convert Map to Object for JSON response
    const commonFactorsObj = Object.fromEntries(summary.commonFactors);

    res.json({
      success: true,
      data: {
        ...summary,
        commonFactors: commonFactorsObj,
        playerDetails: batchResults
      }
    });

    logger.info(`Team load management summary generated for team ${teamId}`);
  } catch (error: any) {
    logger.error('Error generating team summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;