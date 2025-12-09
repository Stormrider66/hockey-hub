import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { PlayerEvaluationController } from '../../controllers/coach/player-evaluation.controller';
import { authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new PlayerEvaluationController();

// Validation middleware
const createEvaluationValidation = [
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('teamId').isUUID().withMessage('Valid team ID is required'),
  body('evaluationDate').isISO8601().withMessage('Valid evaluation date is required'),
  body('type').isIn(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'])
    .withMessage('Valid evaluation type is required'),
  body('technicalSkills').isObject().withMessage('Technical skills object is required'),
  body('tacticalSkills').isObject().withMessage('Tactical skills object is required'),
  body('physicalAttributes').isObject().withMessage('Physical attributes object is required'),
  body('mentalAttributes').isObject().withMessage('Mental attributes object is required'),
  body('developmentPriorities').isArray().withMessage('Development priorities array is required'),
  body('overallRating').optional().isInt({ min: 1, max: 100 }).withMessage('Overall rating must be between 1-100'),
  body('potential').optional().isIn(['Elite', 'High', 'Average', 'Depth']).withMessage('Invalid potential value')
];

const updateEvaluationValidation = [
  body('technicalSkills').optional().isObject(),
  body('tacticalSkills').optional().isObject(),
  body('physicalAttributes').optional().isObject(),
  body('mentalAttributes').optional().isObject(),
  body('developmentPriorities').optional().isArray(),
  body('overallRating').optional().isInt({ min: 1, max: 100 }),
  body('potential').optional().isIn(['Elite', 'High', 'Average', 'Depth'])
];

const bulkCreateValidation = [
  body('evaluations').isArray({ min: 1 }).withMessage('Evaluations array is required'),
  body('evaluations.*.playerId').isUUID().withMessage('Valid player ID is required for each evaluation'),
  body('evaluations.*.teamId').isUUID().withMessage('Valid team ID is required for each evaluation'),
  body('evaluations.*.type').isIn(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'])
];

// Routes

/**
 * @route   POST /api/training/evaluations
 * @desc    Create a new player evaluation
 * @access  Private (Coach)
 */
router.post(
  '/',
  authenticateToken,
  createEvaluationValidation,
  controller.createEvaluation
);

/**
 * @route   GET /api/training/evaluations/player/:playerId
 * @desc    Get evaluations for a specific player
 * @access  Private (Coach, Player - own evaluations)
 */
router.get(
  '/player/:playerId',
  authenticateToken,
  param('playerId').isUUID(),
  query('type').optional().isIn(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getPlayerEvaluations
);

/**
 * @route   GET /api/training/evaluations/team/:teamId/latest
 * @desc    Get latest evaluations for all players in a team
 * @access  Private (Coach)
 */
router.get(
  '/team/:teamId/latest',
  authenticateToken,
  param('teamId').isUUID(),
  query('type').optional().isIn(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']),
  controller.getTeamLatestEvaluations
);

/**
 * @route   POST /api/training/evaluations/bulk-create
 * @desc    Bulk create evaluations (for team evaluation sessions)
 * @access  Private (Coach)
 */
router.post(
  '/bulk-create',
  authenticateToken,
  bulkCreateValidation,
  controller.bulkCreateEvaluations
);

/**
 * @route   GET /api/training/evaluations/compare
 * @desc    Compare evaluations between players or time periods
 * @access  Private (Coach)
 */
router.get(
  '/compare',
  authenticateToken,
  query('playerIds').notEmpty().withMessage('Player IDs are required'),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('type').optional().isIn(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']),
  controller.compareEvaluations
);

/**
 * @route   PUT /api/training/evaluations/:id
 * @desc    Update an existing evaluation
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  updateEvaluationValidation,
  controller.updateEvaluation
);

/**
 * @route   DELETE /api/training/evaluations/:id
 * @desc    Delete an evaluation
 * @access  Private (Coach - owner only)
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  controller.deleteEvaluation
);

/**
 * @route   GET /api/training/evaluations/stats
 * @desc    Get evaluation statistics for analytics
 * @access  Private (Coach)
 */
router.get(
  '/stats',
  authenticateToken,
  query('teamId').optional().isUUID(),
  query('playerId').optional().isUUID(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  controller.getEvaluationStats
);

export { router as playerEvaluationRoutes };