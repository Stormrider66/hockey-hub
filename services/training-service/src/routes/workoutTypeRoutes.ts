import { Router } from 'express';
import { WorkoutTypeService } from '../services/WorkoutTypeService';
import { authMiddleware, validateRequest } from '@hockey-hub/shared-lib';
import { 
  CreateWorkoutTypeConfigDto, 
  UpdateWorkoutTypeConfigDto, 
  ValidateMetricsDto 
} from '../dto/workout-type.dto';
import { WorkoutType } from '../entities/WorkoutType';
import { PaginationDto } from '@hockey-hub/shared-lib';

const router = Router();
let workoutTypeService: WorkoutTypeService;

// Initialize service when module loads
export const initializeWorkoutTypeRoutes = (service: WorkoutTypeService) => {
  workoutTypeService = service;
};

/**
 * @swagger
 * tags:
 *   name: WorkoutTypes
 *   description: Workout type configuration management
 */

/**
 * @swagger
 * /workout-types/initialize:
 *   post:
 *     summary: Initialize default workout type configurations
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default configurations initialized
 *       401:
 *         description: Unauthorized
 */
router.post('/initialize', authMiddleware(['admin', 'trainer']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const userId = req.user!.id;

    const configs = await workoutTypeService.initializeDefaultConfigs(organizationId, userId);

    res.status(201).json({
      success: true,
      data: configs,
      message: 'Default workout type configurations initialized',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /workout-types:
 *   get:
 *     summary: Get all workout type configurations
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: workoutType
 *         schema:
 *           type: string
 *           enum: [STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL]
 *         description: Filter by workout type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of workout type configurations
 */
router.get('/', authMiddleware(['admin', 'trainer', 'coach']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const pagination: PaginationDto = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const filters = {
      workoutType: req.query.workoutType as WorkoutType,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };

    const result = await workoutTypeService.findAll(organizationId, pagination, filters);

    res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /workout-types/statistics:
 *   get:
 *     summary: Get workout type statistics
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workout type statistics
 */
router.get('/statistics', authMiddleware(['admin', 'trainer']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const statistics = await workoutTypeService.getStatistics(organizationId);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /workout-types/{workoutType}:
 *   get:
 *     summary: Get a specific workout type configuration
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL]
 *         description: Workout type
 *     responses:
 *       200:
 *         description: Workout type configuration
 *       404:
 *         description: Configuration not found
 */
router.get('/:workoutType', authMiddleware(['admin', 'trainer', 'coach', 'player']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const workoutType = req.params.workoutType as WorkoutType;

    const config = await workoutTypeService.findOne(organizationId, workoutType);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /workout-types:
 *   post:
 *     summary: Create a custom workout type configuration
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkoutTypeConfigDto'
 *     responses:
 *       201:
 *         description: Configuration created
 *       409:
 *         description: Configuration already exists
 */
router.post(
  '/',
  authMiddleware(['admin', 'trainer']),
  validateRequest(CreateWorkoutTypeConfigDto),
  async (req, res, next) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.id;

      const config = await workoutTypeService.create(organizationId, req.body, userId);

      res.status(201).json({
        success: true,
        data: config,
        message: 'Workout type configuration created',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /workout-types/{workoutType}:
 *   put:
 *     summary: Update a workout type configuration
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL]
 *         description: Workout type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkoutTypeConfigDto'
 *     responses:
 *       200:
 *         description: Configuration updated
 *       404:
 *         description: Configuration not found
 */
router.put(
  '/:workoutType',
  authMiddleware(['admin', 'trainer']),
  validateRequest(UpdateWorkoutTypeConfigDto),
  async (req, res, next) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.id;
      const workoutType = req.params.workoutType as WorkoutType;

      const config = await workoutTypeService.update(organizationId, workoutType, req.body, userId);

      res.json({
        success: true,
        data: config,
        message: 'Workout type configuration updated',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /workout-types/{workoutType}:
 *   delete:
 *     summary: Deactivate a workout type configuration
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL]
 *         description: Workout type
 *     responses:
 *       204:
 *         description: Configuration deactivated
 *       404:
 *         description: Configuration not found
 */
router.delete('/:workoutType', authMiddleware(['admin']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const workoutType = req.params.workoutType as WorkoutType;

    await workoutTypeService.delete(organizationId, workoutType);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /workout-types/{workoutType}/validate-metrics:
 *   post:
 *     summary: Validate metrics against workout type configuration
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL]
 *         description: Workout type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateMetricsDto'
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post(
  '/:workoutType/validate-metrics',
  authMiddleware(['admin', 'trainer', 'coach']),
  validateRequest(ValidateMetricsDto),
  async (req, res, next) => {
    try {
      const organizationId = req.user!.organizationId;
      const workoutType = req.params.workoutType as WorkoutType;

      const result = await workoutTypeService.validateMetrics(organizationId, workoutType, req.body.metrics);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /workout-types/{workoutType}/progression/{level}:
 *   get:
 *     summary: Get progression recommendations
 *     tags: [WorkoutTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workoutType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL]
 *         description: Workout type
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced, elite]
 *         description: Current level
 *     responses:
 *       200:
 *         description: Progression recommendations
 */
router.get('/:workoutType/progression/:level', authMiddleware(['admin', 'trainer', 'coach', 'player']), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const workoutType = req.params.workoutType as WorkoutType;
    const level = req.params.level as 'beginner' | 'intermediate' | 'advanced' | 'elite';

    const recommendations = await workoutTypeService.getProgressionRecommendations(organizationId, workoutType, level);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
});

export default router;