import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { PlayerDevelopmentPlanController } from '../../controllers/coach/player-development-plan.controller';
import { authenticateToken } from '@hockey-hub/shared-lib';

const router = Router();
const controller = new PlayerDevelopmentPlanController();

// Validation middleware
const createDevelopmentPlanValidation = [
  body('playerId').isUUID().withMessage('Valid player ID is required'),
  body('teamId').isUUID().withMessage('Valid team ID is required'),
  body('planTitle').isString().isLength({ min: 3, max: 200 }).withMessage('Plan title must be 3-200 characters'),
  body('seasonYear').isString().matches(/^\d{4}-\d{4}$/).withMessage('Season year must be in format YYYY-YYYY'),
  body('currentLevel').isObject().withMessage('Current level object is required'),
  body('targetLevel').isObject().withMessage('Target level object is required'),
  body('developmentGoals').isArray().withMessage('Development goals array is required'),
  body('weeklyPlans').optional().isArray(),
  body('milestones').optional().isArray(),
  body('parentCommunication').optional().isObject(),
  body('externalResources').optional().isArray(),
  body('nextReviewDate').optional().isISO8601()
];

const updateDevelopmentPlanValidation = [
  body('planTitle').optional().isString().isLength({ min: 3, max: 200 }),
  body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  body('currentLevel').optional().isObject(),
  body('targetLevel').optional().isObject(),
  body('developmentGoals').optional().isArray(),
  body('weeklyPlans').optional().isArray(),
  body('milestones').optional().isArray(),
  body('parentCommunication').optional().isObject(),
  body('externalResources').optional().isArray(),
  body('notes').optional().isString(),
  body('lastReviewDate').optional().isISO8601(),
  body('nextReviewDate').optional().isISO8601()
];

const addGoalValidation = [
  body('category').isIn(['technical', 'tactical', 'physical', 'mental', 'academic']).withMessage('Valid goal category is required'),
  body('description').isString().isLength({ min: 10, max: 500 }).withMessage('Goal description must be 10-500 characters'),
  body('targetValue').isNumeric().withMessage('Target value must be numeric'),
  body('currentValue').optional().isNumeric(),
  body('unit').isString().isLength({ min: 1, max: 20 }).withMessage('Unit is required'),
  body('targetDate').isISO8601().withMessage('Valid target date is required'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Valid priority is required')
];

const updateGoalProgressValidation = [
  body('currentValue').isNumeric().withMessage('Current value must be numeric'),
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0-100'),
  body('status').optional().isIn(['not_started', 'in_progress', 'completed', 'on_hold']),
  body('notes').optional().isString()
];

const addMilestoneValidation = [
  body('title').isString().isLength({ min: 3, max: 100 }).withMessage('Milestone title must be 3-100 characters'),
  body('description').optional().isString().isLength({ max: 500 }),
  body('targetDate').isISO8601().withMessage('Valid target date is required'),
  body('notes').optional().isString()
];

const completeMilestoneValidation = [
  body('completedDate').optional().isISO8601(),
  body('notes').optional().isString()
];

// Routes

/**
 * @route   POST /api/training/development-plans
 * @desc    Create a new development plan
 * @access  Private (Coach)
 */
router.post(
  '/',
  authenticateToken,
  createDevelopmentPlanValidation,
  controller.createDevelopmentPlan
);

/**
 * @route   GET /api/training/development-plans/player/:playerId
 * @desc    Get development plans for a specific player
 * @access  Private (Coach, Player - own plans)
 */
router.get(
  '/player/:playerId',
  authenticateToken,
  param('playerId').isUUID(),
  query('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  query('seasonYear').optional().matches(/^\d{4}-\d{4}$/),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  controller.getPlayerDevelopmentPlans
);

/**
 * @route   GET /api/training/development-plans/team/:teamId/active
 * @desc    Get active development plans for a team
 * @access  Private (Coach)
 */
router.get(
  '/team/:teamId/active',
  authenticateToken,
  param('teamId').isUUID(),
  controller.getTeamActiveDevelopmentPlans
);

/**
 * @route   PUT /api/training/development-plans/:id
 * @desc    Update a development plan
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  updateDevelopmentPlanValidation,
  controller.updateDevelopmentPlan
);

/**
 * @route   POST /api/training/development-plans/:id/goals
 * @desc    Add a goal to a development plan
 * @access  Private (Coach - owner only)
 */
router.post(
  '/:id/goals',
  authenticateToken,
  param('id').isUUID(),
  addGoalValidation,
  controller.addGoalToPlan
);

/**
 * @route   PUT /api/training/development-plans/:id/goals/:goalId/progress
 * @desc    Update goal progress
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id/goals/:goalId/progress',
  authenticateToken,
  param('id').isUUID(),
  param('goalId').notEmpty(),
  updateGoalProgressValidation,
  controller.updateGoalProgress
);

/**
 * @route   POST /api/training/development-plans/:id/milestones
 * @desc    Add milestone to a development plan
 * @access  Private (Coach - owner only)
 */
router.post(
  '/:id/milestones',
  authenticateToken,
  param('id').isUUID(),
  addMilestoneValidation,
  controller.addMilestone
);

/**
 * @route   PUT /api/training/development-plans/:id/milestones/:milestoneId/complete
 * @desc    Complete a milestone
 * @access  Private (Coach - owner only)
 */
router.put(
  '/:id/milestones/:milestoneId/complete',
  authenticateToken,
  param('id').isUUID(),
  param('milestoneId').notEmpty(),
  completeMilestoneValidation,
  controller.completeMilestone
);

/**
 * @route   DELETE /api/training/development-plans/:id
 * @desc    Delete a development plan
 * @access  Private (Coach - owner only)
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isUUID(),
  controller.deleteDevelopmentPlan
);

/**
 * @route   GET /api/training/development-plans/stats
 * @desc    Get development plan statistics
 * @access  Private (Coach)
 */
router.get(
  '/stats',
  authenticateToken,
  query('teamId').optional().isUUID(),
  query('coachId').optional().isUUID(),
  query('seasonYear').optional().matches(/^\d{4}-\d{4}$/),
  controller.getDevelopmentPlanStats
);

export { router as playerDevelopmentPlanRoutes };