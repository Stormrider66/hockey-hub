import { Router } from 'express';
import { Request, Response } from 'express';
import { MedicalComplianceService } from '../services/MedicalComplianceService';
import { logger } from '@hockey-hub/shared-lib';

const router = Router();
const medicalComplianceService = new MedicalComplianceService();

/**
 * Real-time exercise compliance check
 * POST /api/v1/compliance/check
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { playerId, exercises, workoutIntensity = 100 } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({
        success: false,
        error: 'Exercises array is required'
      });
    }

    const complianceResult = await medicalComplianceService.checkWorkoutCompliance(
      playerId,
      exercises,
      workoutIntensity
    );

    res.json({
      success: true,
      data: complianceResult
    });

    logger.info(`Compliance check completed for player ${playerId}`);
  } catch (error: any) {
    logger.error('Error checking compliance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Real-time injury risk assessment
 * POST /api/v1/compliance/risk-assessment
 */
router.post('/risk-assessment', async (req: Request, res: Response) => {
  try {
    const { playerId, currentMetrics } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    if (!currentMetrics) {
      return res.status(400).json({
        success: false,
        error: 'Current metrics are required'
      });
    }

    const riskAlert = await medicalComplianceService.assessRealTimeInjuryRisk(
      playerId,
      currentMetrics
    );

    res.json({
      success: true,
      data: riskAlert
    });

    logger.info(`Risk assessment completed for player ${playerId}`);
  } catch (error: any) {
    logger.error('Error assessing injury risk:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get exercise restrictions for a player
 * GET /api/v1/compliance/restrictions/:playerId
 */
router.get('/restrictions/:playerId', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    // Get basic compliance check with no exercises to just get restrictions
    const complianceResult = await medicalComplianceService.checkWorkoutCompliance(
      playerId,
      [],
      100
    );

    res.json({
      success: true,
      data: {
        restrictions: complianceResult.restrictions,
        medicalNotes: complianceResult.medicalNotes,
        loadRecommendations: complianceResult.loadRecommendations
      }
    });

    logger.info(`Restrictions retrieved for player ${playerId}`);
  } catch (error: any) {
    logger.error('Error getting restrictions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get exercise substitutions for specific exercise
 * POST /api/v1/compliance/substitutions
 */
router.post('/substitutions', async (req: Request, res: Response) => {
  try {
    const { playerId, exercise } = req.body;

    if (!playerId || !exercise) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and exercise are required'
      });
    }

    // Check compliance for single exercise to get substitutions
    const complianceResult = await medicalComplianceService.checkWorkoutCompliance(
      playerId,
      [exercise],
      100
    );

    const substitutions = complianceResult.substitutions.filter(
      sub => sub.originalExercise === exercise.name
    );

    res.json({
      success: true,
      data: {
        originalExercise: exercise.name,
        substitutions,
        restrictions: complianceResult.restrictions
          .filter(restriction => 
            // Only return restrictions that affect this exercise
            exercise.name.toLowerCase().includes(restriction.bodyPart.toLowerCase()) ||
            exercise.name.toLowerCase().includes(restriction.movementPattern.toLowerCase())
          )
      }
    });

    logger.info(`Substitutions retrieved for player ${playerId}, exercise ${exercise.name}`);
  } catch (error: any) {
    logger.error('Error getting substitutions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Validate workout safety before start
 * POST /api/v1/compliance/validate-workout
 */
router.post('/validate-workout', async (req: Request, res: Response) => {
  try {
    const { playerId, workoutData, sessionId } = req.body;

    if (!playerId || !workoutData) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and workout data are required'
      });
    }

    const { exercises = [], intensity = 100, duration = 60 } = workoutData;

    // Comprehensive compliance check
    const complianceResult = await medicalComplianceService.checkWorkoutCompliance(
      playerId,
      exercises,
      intensity
    );

    // Additional validation based on workout duration and intensity
    const validationWarnings: string[] = [];

    if (intensity > 90 && complianceResult.restrictions.length > 0) {
      validationWarnings.push('High intensity workout with active medical restrictions');
    }

    if (duration > 90 && complianceResult.loadRecommendations.length > 0) {
      validationWarnings.push('Extended duration workout with load management recommendations');
    }

    const isWorkoutSafe = complianceResult.isCompliant && 
                         !complianceResult.riskAlerts.some(alert => alert.immediateAction);

    res.json({
      success: true,
      data: {
        isWorkoutSafe,
        sessionId,
        complianceResult,
        validationWarnings,
        recommendations: [
          ...complianceResult.medicalNotes,
          ...validationWarnings
        ]
      }
    });

    logger.info(`Workout validation completed for player ${playerId}, safe: ${isWorkoutSafe}`);
  } catch (error: any) {
    logger.error('Error validating workout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get load management recommendations
 * GET /api/v1/compliance/load-management/:playerId
 */
router.get('/load-management/:playerId', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { currentLoad = 100 } = req.query;

    const complianceResult = await medicalComplianceService.checkWorkoutCompliance(
      playerId,
      [], // No specific exercises, just get load recommendations
      parseInt(currentLoad as string)
    );

    res.json({
      success: true,
      data: {
        playerId,
        currentLoad: parseInt(currentLoad as string),
        recommendations: complianceResult.loadRecommendations,
        riskAlerts: complianceResult.riskAlerts,
        medicalNotes: complianceResult.medicalNotes
      }
    });

    logger.info(`Load management recommendations retrieved for player ${playerId}`);
  } catch (error: any) {
    logger.error('Error getting load management recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Batch compliance check for multiple players
 * POST /api/v1/compliance/batch-check
 */
router.post('/batch-check', async (req: Request, res: Response) => {
  try {
    const { playerIds, exercises, workoutIntensity = 100 } = req.body;

    if (!playerIds || !Array.isArray(playerIds)) {
      return res.status(400).json({
        success: false,
        error: 'Player IDs array is required'
      });
    }

    if (!exercises || !Array.isArray(exercises)) {
      return res.status(400).json({
        success: false,
        error: 'Exercises array is required'
      });
    }

    // Check compliance for all players in parallel
    const complianceChecks = await Promise.all(
      playerIds.map(async (playerId: string) => {
        try {
          const result = await medicalComplianceService.checkWorkoutCompliance(
            playerId,
            exercises,
            workoutIntensity
          );
          return { playerId, result, error: null };
        } catch (error: any) {
          return { playerId, result: null, error: error.message };
        }
      })
    );

    const results = complianceChecks.reduce((acc, check) => {
      acc[check.playerId] = check.result || { error: check.error };
      return acc;
    }, {} as Record<string, any>);

    // Summary statistics
    const compliantPlayers = complianceChecks.filter(c => c.result?.isCompliant).length;
    const totalPlayers = playerIds.length;
    const hasErrors = complianceChecks.some(c => c.error);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          totalPlayers,
          compliantPlayers,
          nonCompliantPlayers: totalPlayers - compliantPlayers,
          complianceRate: Math.round((compliantPlayers / totalPlayers) * 100),
          hasErrors
        }
      }
    });

    logger.info(`Batch compliance check completed for ${totalPlayers} players`);
  } catch (error: any) {
    logger.error('Error in batch compliance check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;