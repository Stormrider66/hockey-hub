import { Router, Request, Response, NextFunction } from 'express';
import { validationMiddleware, authMiddleware, RequestWithUser } from '@hockey-hub/shared-lib';
import { ExerciseService } from '../services/ExerciseService';
import { CreateExerciseTemplateDto, UpdateExerciseTemplateDto, ExerciseFilterDto } from '../dto/exercise.dto';
import { ExerciseCategory } from '../entities';

const router = Router();
const exerciseService = new ExerciseService();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/training/exercises
 * Get all exercises with optional filtering
 */
router.get(
  '/',
  validationMiddleware(ExerciseFilterDto, 'query'),
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const filter: ExerciseFilterDto & { organizationId?: string } = {
        category: req.query.category as ExerciseCategory,
        search: req.query.search as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
        take: req.query.take ? parseInt(req.query.take as string) : 50,
        organizationId: req.user?.organizationId
      };

      const result = await exerciseService.findAll(filter);
      
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        skip: filter.skip || 0,
        take: filter.take || 50
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/training/exercises/search
 * Search exercises by name
 */
router.get(
  '/search',
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const exercises = await exerciseService.searchByName(query, req.user?.organizationId);
      
      res.json({
        success: true,
        data: exercises
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/training/exercises/category/:category
 * Get exercises by category
 */
router.get(
  '/category/:category',
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const category = req.params.category as ExerciseCategory;
      const validCategories: ExerciseCategory[] = ['strength', 'cardio', 'skill', 'mobility', 'recovery'];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      const exercises = await exerciseService.findByCategory(category, req.user?.organizationId);
      
      res.json({
        success: true,
        data: exercises
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/training/exercises/:id
 * Get a specific exercise by ID
 */
router.get(
  '/:id',
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const exercise = await exerciseService.findById(req.params.id);
      
      res.json({
        success: true,
        data: exercise
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/v1/training/exercises
 * Create a new exercise
 */
router.post(
  '/',
  validationMiddleware(CreateExerciseTemplateDto),
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Check if user has permission to create exercises (coach or admin)
      const allowedRoles = ['coach', 'admin', 'superadmin'];
      if (!req.user.roles?.some(role => allowedRoles.includes(role))) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to create exercises'
        });
      }

      const exercise = await exerciseService.create(req.body, req.user.id, req.user.organizationId);
      
      res.status(201).json({
        success: true,
        data: exercise
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/training/exercises/:id
 * Update an exercise
 */
router.put(
  '/:id',
  validationMiddleware(UpdateExerciseTemplateDto),
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Check if user has permission to update exercises (coach or admin)
      const allowedRoles = ['coach', 'admin', 'superadmin'];
      if (!req.user.roles?.some(role => allowedRoles.includes(role))) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to update exercises'
        });
      }

      const exercise = await exerciseService.update(req.params.id, req.body, req.user.id);
      
      res.json({
        success: true,
        data: exercise
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/training/exercises/:id
 * Delete an exercise (soft delete)
 */
router.delete(
  '/:id',
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Check if user has permission to delete exercises (coach or admin)
      const allowedRoles = ['coach', 'admin', 'superadmin'];
      if (!req.user.roles?.some(role => allowedRoles.includes(role))) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to delete exercises'
        });
      }

      await exerciseService.delete(req.params.id, req.user.id);
      
      res.json({
        success: true,
        message: 'Exercise deleted successfully'
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
);

export { router as exerciseRoutes };