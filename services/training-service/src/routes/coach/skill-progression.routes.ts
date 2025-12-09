import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { SkillProgressionController } from '../../controllers/coach/skill-progression.controller';
import { authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new SkillProgressionController();

// Validation middleware
const createSkillProgressionValidation = [
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('teamId').isUUID().withMessage('Valid team ID is required'),
  body('skillCategory').isIn(['skating', 'puck_handling', 'shooting', 'passing', 'checking', 'positioning', 'game_sense'])
    .withMessage('Valid skill category is required'),
  body('skillName').isString().isLength({ min: 2, max: 100 }).withMessage('Skill name must be 2-100 characters'),
  body('currentLevel').isNumeric().withMessage('Current level must be numeric'),
  body('targetLevel').isNumeric().withMessage('Target level must be numeric'),
  body('assessmentCriteria').isString().isLength({ min: 10, max: 1000 }).withMessage('Assessment criteria must be 10-1000 characters'),
  body('measurements').optional().isArray(),
  body('benchmarks').optional().isObject(),
  body('drillHistory').optional().isArray(),
  body('progressNotes').optional().isString().isLength({ max: 2000 }),
  body('lastAssessmentDate').optional().isISO8601(),
  body('nextAssessmentDate').optional().isISO8601()
];

const updateSkillProgressionValidation = [
  body('skillCategory').optional().isIn(['skating', 'puck_handling', 'shooting', 'passing', 'checking', 'positioning', 'game_sense']),
  body('skillName').optional().isString().isLength({ min: 2, max: 100 }),
  body('currentLevel').optional().isNumeric(),
  body('targetLevel').optional().isNumeric(),
  body('assessmentCriteria').optional().isString().isLength({ min: 10, max: 1000 }),
  body('measurements').optional().isArray(),
  body('benchmarks').optional().isObject(),
  body('drillHistory').optional().isArray(),
  body('progressNotes').optional().isString().isLength({ max: 2000 }),
  body('lastAssessmentDate').optional().isISO8601(),
  body('nextAssessmentDate').optional().isISO8601()
];

const addMeasurementValidation = [
  body('date').optional().isISO8601(),
  body('value').isNumeric().withMessage('Measurement value must be numeric'),
  body('unit').isString().isLength({ min: 1, max: 20 }).withMessage('Unit is required'),
  body('context').optional().isString().isLength({ max: 200 }),
  body('notes').optional().isString().isLength({ max: 500 })
];

const addDrillPerformanceValidation = [
  body('date').optional().isISO8601(),
  body('drillName').isString().isLength({ min: 2, max: 100 }).withMessage('Drill name is required'),
  body('performance').isNumeric().withMessage('Performance value must be numeric'),
  body('notes').optional().isString().isLength({ max: 500 }),
  body('duration').optional().isNumeric(),
  body('repetitions').optional().isInt({ min: 1 }),
  body('quality').optional().isInt({ min: 1, max: 10 })
];

const setTargetLevelValidation = [
  body('targetLevel').isNumeric().withMessage('Target level must be numeric'),
  body('nextAssessmentDate').optional().isISO8601(),
  body('notes').optional().isString().isLength({ max: 500 })
];

const updateBenchmarksValidation = [
  body('benchmarks').isObject().withMessage('Benchmarks object is required'),
  body('benchmarks.beginner').optional().isNumeric(),
  body('benchmarks.intermediate').optional().isNumeric(),
  body('benchmarks.advanced').optional().isNumeric(),
  body('benchmarks.expert').optional().isNumeric()
];

const bulkMeasurementValidation = [
  body('measurements').isArray({ min: 1 }).withMessage('Measurements array is required'),
  body('measurements.*.progressionId').isUUID().withMessage('Valid progression ID is required for each measurement'),
  body('measurements.*.value').isNumeric().withMessage('Value must be numeric for each measurement'),
  body('measurements.*.unit').isString().isLength({ min: 1, max: 20 }).withMessage('Unit is required for each measurement'),
  body('measurements.*.date').optional().isISO8601(),
  body('measurements.*.context').optional().isString().isLength({ max: 200 }),
  body('measurements.*.notes').optional().isString().isLength({ max: 500 })
];

// Routes

/**
 * @route   POST /api/training/skill-progression
 * @desc    Create a new skill progression tracking
 * @access  Private (Coach)
 */
router.post(
  '/',
  authenticateToken,
  createSkillProgressionValidation,
  controller.createSkillProgression
);

/**
 * @route   GET /api/training/skill-progression/player/:playerId
 * @desc    Get skill progressions for a specific player
 * @access  Private (Coach, Player - own progressions)
 */
router.get(
  '/player/:playerId',
  authenticateToken,
  param('playerId').isUUID(),
  query('skillCategory').optional().isIn(['skating', 'puck_handling', 'shooting', 'passing', 'checking', 'positioning', 'game_sense']),
  query('skillName').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getPlayerSkillProgressions
);

/**
 * @route   GET /api/training/skill-progression/team/:teamId/overview
 * @desc    Get team skill progressions overview
 * @access  Private (Coach)
 */
router.get(
  '/team/:teamId/overview',
  authenticateToken,
  param('teamId').isUUID(),
  query('skillCategory').optional().isIn(['skating', 'puck_handling', 'shooting', 'passing', 'checking', 'positioning', 'game_sense']),
  controller.getTeamSkillProgressionsOverview
);

/**
 * @route   PUT /api/training/skill-progression/:id
 * @desc    Update a skill progression
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  updateSkillProgressionValidation,
  controller.updateSkillProgression
);

/**
 * @route   POST /api/training/skill-progression/:id/measurements
 * @desc    Add measurement to skill progression
 * @access  Private (Coach - owner only)
 */
router.post(
  '/:id/measurements',
  authenticateToken,
  param('id').isUUID(),
  addMeasurementValidation,
  controller.addMeasurement
);

/**
 * @route   POST /api/training/skill-progression/:id/drill-performance
 * @desc    Add drill performance to skill progression
 * @access  Private (Coach - owner only)
 */
router.post(
  '/:id/drill-performance',
  authenticateToken,
  param('id').isUUID(),
  addDrillPerformanceValidation,
  controller.addDrillPerformance
);

/**
 * @route   PUT /api/training/skill-progression/:id/target-level
 * @desc    Set target level for skill progression
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id/target-level',
  authenticateToken,
  param('id').isUUID(),
  setTargetLevelValidation,
  controller.setTargetLevel
);

/**
 * @route   PUT /api/training/skill-progression/:id/benchmarks
 * @desc    Update benchmarks for skill progression
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id/benchmarks',
  authenticateToken,
  param('id').isUUID(),
  updateBenchmarksValidation,
  controller.updateBenchmarks
);

/**
 * @route   POST /api/training/skill-progression/bulk-measurements
 * @desc    Bulk add measurements
 * @access  Private (Coach)
 */
router.post(
  '/bulk-measurements',
  authenticateToken,
  bulkMeasurementValidation,
  controller.bulkAddMeasurements
);

/**
 * @route   GET /api/training/skill-progression/:id/analysis
 * @desc    Get progress analysis for a skill
 * @access  Private (Coach, Player - own analysis)
 */
router.get(
  '/:id/analysis',
  authenticateToken,
  param('id').isUUID(),
  query('period').optional().isIn(['1month', '3months', '6months', '1year']),
  controller.getProgressAnalysis
);

/**
 * @route   DELETE /api/training/skill-progression/:id
 * @desc    Delete a skill progression
 * @access  Private (Coach - owner only)
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  controller.deleteSkillProgression
);

export { router as skillProgressionRoutes };