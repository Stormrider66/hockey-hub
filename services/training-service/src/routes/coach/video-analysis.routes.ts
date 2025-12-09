import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { VideoAnalysisController } from '../../controllers/coach/video-analysis.controller';
import { authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new VideoAnalysisController();

// Validation middleware
const createVideoAnalysisValidation = [
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('teamId').isUUID().withMessage('Valid team ID is required'),
  body('title').isString().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('analysisDate').isISO8601().withMessage('Valid analysis date is required'),
  body('gameDate').optional().isISO8601(),
  body('opponent').optional().isString().isLength({ max: 100 }),
  body('type').isIn(['game', 'practice', 'skill_development', 'tactical']).withMessage('Valid analysis type is required'),
  body('videoClips').optional().isArray(),
  body('analysisPoints').optional().isArray(),
  body('playerPerformance').optional().isObject(),
  body('teamAnalysis').optional().isObject(),
  body('tags').optional().isArray()
];

const updateVideoAnalysisValidation = [
  body('title').optional().isString().isLength({ min: 3, max: 200 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('analysisDate').optional().isISO8601(),
  body('gameDate').optional().isISO8601(),
  body('opponent').optional().isString().isLength({ max: 100 }),
  body('type').optional().isIn(['game', 'practice', 'skill_development', 'tactical']),
  body('videoClips').optional().isArray(),
  body('analysisPoints').optional().isArray(),
  body('playerPerformance').optional().isObject(),
  body('teamAnalysis').optional().isObject(),
  body('tags').optional().isArray()
];

const addVideoClipValidation = [
  body('title').isString().isLength({ min: 3, max: 100 }).withMessage('Clip title must be 3-100 characters'),
  body('videoUrl').isURL().withMessage('Valid video URL is required'),
  body('startTime').isNumeric().withMessage('Start time must be numeric'),
  body('endTime').isNumeric().withMessage('End time must be numeric'),
  body('category').isIn(['positive', 'improvement', 'technique', 'tactical', 'mistake']).withMessage('Valid category is required'),
  body('importance').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid importance level is required'),
  body('description').optional().isString().isLength({ max: 500 }),
  body('notes').optional().isString().isLength({ max: 1000 })
];

const updateVideoClipValidation = [
  body('title').optional().isString().isLength({ min: 3, max: 100 }),
  body('videoUrl').optional().isURL(),
  body('startTime').optional().isNumeric(),
  body('endTime').optional().isNumeric(),
  body('category').optional().isIn(['positive', 'improvement', 'technique', 'tactical', 'mistake']),
  body('importance').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('description').optional().isString().isLength({ max: 500 }),
  body('notes').optional().isString().isLength({ max: 1000 })
];

const shareVideoAnalysisValidation = [
  body('sharedWith').optional().isArray(),
  body('sharedWith.*').optional().isUUID()
];

const bulkShareValidation = [
  body('analysisIds').isArray({ min: 1 }).withMessage('Analysis IDs array is required'),
  body('analysisIds.*').isUUID().withMessage('Each analysis ID must be valid UUID'),
  body('sharedWith').isArray({ min: 1 }).withMessage('Shared with array is required'),
  body('sharedWith.*').isUUID().withMessage('Each shared user ID must be valid UUID')
];

// Routes

/**
 * @route   POST /api/training/video-analysis
 * @desc    Create a new video analysis
 * @access  Private (Coach)
 */
router.post(
  '/',
  authenticateToken,
  createVideoAnalysisValidation,
  controller.createVideoAnalysis
);

/**
 * @route   GET /api/training/video-analysis/player/:playerId
 * @desc    Get video analyses for a specific player
 * @access  Private (Coach, Player - own analyses)
 */
router.get(
  '/player/:playerId',
  authenticateToken,
  param('playerId').isUUID(),
  query('type').optional().isIn(['game', 'practice', 'skill_development', 'tactical']),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getPlayerVideoAnalyses
);

/**
 * @route   GET /api/training/video-analysis/team/:teamId
 * @desc    Get team video analyses
 * @access  Private (Coach)
 */
router.get(
  '/team/:teamId',
  authenticateToken,
  param('teamId').isUUID(),
  query('type').optional().isIn(['game', 'practice', 'skill_development', 'tactical']),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getTeamVideoAnalyses
);

/**
 * @route   PUT /api/training/video-analysis/:id
 * @desc    Update a video analysis
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  updateVideoAnalysisValidation,
  controller.updateVideoAnalysis
);

/**
 * @route   POST /api/training/video-analysis/:id/clips
 * @desc    Add video clip to analysis
 * @access  Private (Coach - owner only)
 */
router.post(
  '/:id/clips',
  authenticateToken,
  param('id').isUUID(),
  addVideoClipValidation,
  controller.addVideoClip
);

/**
 * @route   PUT /api/training/video-analysis/:id/clips/:clipId
 * @desc    Update video clip
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id/clips/:clipId',
  authenticateToken,
  param('id').isUUID(),
  param('clipId').notEmpty(),
  updateVideoClipValidation,
  controller.updateVideoClip
);

/**
 * @route   POST /api/training/video-analysis/:id/share
 * @desc    Share video analysis with player
 * @access  Private (Coach - owner only)
 */
router.post(
  '/:id/share',
  authenticateToken,
  param('id').isUUID(),
  shareVideoAnalysisValidation,
  controller.shareVideoAnalysis
);

/**
 * @route   POST /api/training/video-analysis/:id/viewed
 * @desc    Mark video analysis as viewed by player
 * @access  Private (Player - authorized only)
 */
router.post(
  '/:id/viewed',
  authenticateToken,
  param('id').isUUID(),
  controller.markAsViewed
);

/**
 * @route   POST /api/training/video-analysis/bulk-share
 * @desc    Bulk share video analyses
 * @access  Private (Coach)
 */
router.post(
  '/bulk-share',
  authenticateToken,
  bulkShareValidation,
  controller.bulkShareAnalyses
);

/**
 * @route   DELETE /api/training/video-analysis/:id
 * @desc    Delete a video analysis
 * @access  Private (Coach - owner only)
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  controller.deleteVideoAnalysis
);

/**
 * @route   GET /api/training/video-analysis/stats
 * @desc    Get video analysis statistics
 * @access  Private (Coach)
 */
router.get(
  '/stats',
  authenticateToken,
  query('teamId').optional().isUUID(),
  query('playerId').optional().isUUID(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  controller.getVideoAnalysisStats
);

export { router as videoAnalysisRoutes };