import { Router, type Router as ExpressRouter } from 'express';
import {
  getTeamPlayerStatus,
  getPlayerWellnessDetail,
  getPlayerTrainingMetrics,
  createWellnessEntry,
  updateTrainingMetrics,
  getBatchWellnessSummary
} from '../controllers/playerWellnessController';
import {
  extractUser,
  requireAuth,
  requirePhysicalTrainer,
  requireAnyPermission
} from '../middleware/auth';

const router: ExpressRouter = Router();

/**
 * Player Wellness API Routes
 * 
 * All routes require authentication and appropriate permissions
 * Physical trainers have full access, coaches have read access,
 * players can only access their own data
 */

/**
 * GET /api/training/player-status?teamId={teamId}
 * Get player readiness status for a team
 * 
 * Query Parameters:
 * - teamId: string (required) - Team ID to get player status for
 * 
 * Access: Physical Trainer, Coach (for their teams)
 */
router.get('/player-status', 
  extractUser,
  requireAuth,
  requireAnyPermission(['training.read', 'team.read', 'player.read']),
  (req, res, next) => {
    if (!req.query.teamId) {
      return res.status(400).json({ error: 'Bad Request' });
    }
    return getTeamPlayerStatus(req, res);
  }
);

/**
 * GET /api/training/player-wellness/:playerId
 * Get detailed wellness metrics for a specific player
 * 
 * Path Parameters:
 * - playerId: string (required) - Player ID to get wellness data for
 * 
 * Access: Physical Trainer, Coach, Player (own data only)
 */
router.get('/player-wellness/:playerId', 
  extractUser,
  requireAuth,
  requireAnyPermission(['training.read', 'player.read']),
  getPlayerWellnessDetail
);

/**
 * GET /api/training/player-metrics/:playerId
 * Get training metrics for a specific player
 * 
 * Path Parameters:
 * - playerId: string (required) - Player ID to get training metrics for
 * 
 * Access: Physical Trainer, Coach, Player (own data only)
 */
router.get('/player-metrics/:playerId', 
  extractUser,
  requireAuth,
  requireAnyPermission(['training.read', 'player.read']),
  getPlayerTrainingMetrics
);

/**
 * POST /api/training/player-wellness
 * Create a wellness entry for a player
 * 
 * Body: CreateWellnessEntryDto
 * {
 *   playerId: string,
 *   sleep: number (1-10),
 *   stress: number (1-10),
 *   energy: number (1-10),
 *   soreness: number (1-10),
 *   mood: number (1-10),
 *   notes?: string
 * }
 * 
 * Access: Physical Trainer, Player (own data only)
 */
router.post('/player-wellness', 
  extractUser,
  requireAuth,
  requireAnyPermission(['training.create', 'wellness.create']),
  createWellnessEntry
);

/**
 * PUT /api/training/player-metrics
 * Update training metrics for a player
 * 
 * Body: UpdateTrainingMetricsDto
 * {
 *   playerId: string,
 *   hrVariability?: number,
 *   restingHR?: number,
 *   sleepHours?: number,
 *   trainingLoad?: number,
 *   notes?: string
 * }
 * 
 * Access: Physical Trainer only
 */
router.put('/player-metrics', 
  extractUser,
  requireAuth,
  requirePhysicalTrainer,
  updateTrainingMetrics
);

/**
 * POST /api/training/player-wellness/batch
 * Get wellness summary for multiple players
 * 
 * Body:
 * {
 *   playerIds: string[]
 * }
 * 
 * Access: Physical Trainer, Coach
 */
router.post('/player-wellness/batch', 
  extractUser,
  requireAuth,
  requireAnyPermission(['training.read', 'team.read']),
  getBatchWellnessSummary
);

export default router;