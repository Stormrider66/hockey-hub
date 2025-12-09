import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { PlayerFeedbackController } from '../../controllers/coach/player-feedback.controller';
import { authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new PlayerFeedbackController();

// Validation middleware
const createPlayerFeedbackValidation = [
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('teamId').isUUID().withMessage('Valid team ID is required'),
  body('type').isIn(['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting'])
    .withMessage('Valid feedback type is required'),
  body('title').isString().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('content').isString().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
  body('tone').isIn(['encouraging', 'neutral', 'direct', 'supportive', 'challenging'])
    .withMessage('Valid tone is required'),
  body('isPrivate').optional().isBoolean(),
  body('followUpRequired').optional().isBoolean(),
  body('followUpDate').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('relatedSessionId').optional().isUUID(),
  body('relatedGameId').optional().isUUID()
];

const updatePlayerFeedbackValidation = [
  body('type').optional().isIn(['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting']),
  body('title').optional().isString().isLength({ min: 3, max: 200 }),
  body('content').optional().isString().isLength({ min: 10, max: 5000 }),
  body('tone').optional().isIn(['encouraging', 'neutral', 'direct', 'supportive', 'challenging']),
  body('isPrivate').optional().isBoolean(),
  body('status').optional().isIn(['pending', 'read', 'acknowledged', 'discussed', 'follow_up_completed']),
  body('followUpRequired').optional().isBoolean(),
  body('followUpDate').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('relatedSessionId').optional().isUUID(),
  body('relatedGameId').optional().isUUID()
];

const playerResponseValidation = [
  body('response').isString().isLength({ min: 1, max: 2000 }).withMessage('Response must be 1-2000 characters'),
  body('playerId').optional().isUUID()
];

const markDiscussedValidation = [
  body('discussionDate').optional().isISO8601(),
  body('notes').optional().isString().isLength({ max: 1000 })
];

const bulkStatusUpdateValidation = [
  body('feedbackIds').isArray({ min: 1 }).withMessage('Feedback IDs array is required'),
  body('feedbackIds.*').isUUID().withMessage('Each feedback ID must be valid UUID'),
  body('status').isIn(['pending', 'read', 'acknowledged', 'discussed', 'follow_up_completed'])
    .withMessage('Valid status is required')
];

const createFromTemplateValidation = [
  body('playerIds').isArray({ min: 1 }).withMessage('Player IDs array is required'),
  body('playerIds.*').isUUID().withMessage('Each player ID must be valid UUID'),
  body('teamId').isUUID().withMessage('Valid team ID is required'),
  body('template').isObject().withMessage('Template object is required'),
  body('template.type').isIn(['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting']),
  body('template.title').isString().isLength({ min: 3, max: 200 }),
  body('template.content').isString().isLength({ min: 10, max: 5000 }),
  body('template.tone').isIn(['encouraging', 'neutral', 'direct', 'supportive', 'challenging']),
  body('template.isPrivate').optional().isBoolean(),
  body('template.followUpRequired').optional().isBoolean(),
  body('template.tags').optional().isArray(),
  body('playerNames').optional().isObject()
];

// Routes

/**
 * @route   POST /api/training/player-feedback
 * @desc    Create new player feedback
 * @access  Private (Coach)
 */
router.post(
  '/',
  authenticateToken,
  createPlayerFeedbackValidation,
  controller.createPlayerFeedback
);

/**
 * @route   GET /api/training/player-feedback/player/:playerId
 * @desc    Get feedback for a specific player
 * @access  Private (Coach, Player - own feedback)
 */
router.get(
  '/player/:playerId',
  authenticateToken,
  param('playerId').isUUID(),
  query('type').optional().isIn(['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting']),
  query('status').optional().isIn(['pending', 'read', 'acknowledged', 'discussed', 'follow_up_completed']),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getPlayerFeedback
);

/**
 * @route   GET /api/training/player-feedback/team/:teamId
 * @desc    Get team feedback overview
 * @access  Private (Coach)
 */
router.get(
  '/team/:teamId',
  authenticateToken,
  param('teamId').isUUID(),
  query('status').optional().isIn(['pending', 'read', 'acknowledged', 'discussed', 'follow_up_completed']),
  query('type').optional().isIn(['positive', 'constructive', 'corrective', 'motivational', 'performance_review', 'goal_setting']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getTeamFeedbackOverview
);

/**
 * @route   PUT /api/training/player-feedback/:id
 * @desc    Update feedback
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  updatePlayerFeedbackValidation,
  controller.updatePlayerFeedback
);

/**
 * @route   POST /api/training/player-feedback/:id/response
 * @desc    Add player response to feedback
 * @access  Private (Player - authorized only)
 */
router.post(
  '/:id/response',
  authenticateToken,
  param('id').isUUID(),
  playerResponseValidation,
  controller.addPlayerResponse
);

/**
 * @route   POST /api/training/player-feedback/:id/discussed
 * @desc    Mark feedback as discussed
 * @access  Private (Coach, Player - authorized only)
 */
router.post(
  '/:id/discussed',
  authenticateToken,
  param('id').isUUID(),
  markDiscussedValidation,
  controller.markAsDiscussed
);

/**
 * @route   POST /api/training/player-feedback/bulk-status-update
 * @desc    Bulk update feedback status
 * @access  Private (Coach)
 */
router.post(
  '/bulk-status-update',
  authenticateToken,
  bulkStatusUpdateValidation,
  controller.bulkUpdateStatus
);

/**
 * @route   POST /api/training/player-feedback/from-template
 * @desc    Create feedback from template
 * @access  Private (Coach)
 */
router.post(
  '/from-template',
  authenticateToken,
  createFromTemplateValidation,
  controller.createFromTemplate
);

/**
 * @route   GET /api/training/player-feedback/coach-stats
 * @desc    Get feedback statistics for coach
 * @access  Private (Coach)
 */
router.get(
  '/coach-stats',
  authenticateToken,
  query('teamId').optional().isUUID(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  controller.getCoachFeedbackStats
);

/**
 * @route   DELETE /api/training/player-feedback/:id
 * @desc    Delete feedback
 * @access  Private (Coach - owner only)
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  controller.deleteFeedback
);

export { router as playerFeedbackRoutes };