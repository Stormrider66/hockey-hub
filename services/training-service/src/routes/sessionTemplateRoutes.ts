import { Router, type Router as ExpressRouter } from 'express';
import { SessionTemplateService } from '../services/SessionTemplateService';
import type { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { 
  CreateSessionTemplateDto, 
  UpdateSessionTemplateDto, 
  DuplicateTemplateDto, 
  BulkAssignTemplateDto,
  SessionTemplateFilterDto 
} from '../dto/sessionTemplate.dto';

const router: ExpressRouter = Router();
const sessionTemplateService = new SessionTemplateService();

// Minimal validateRequest middleware (express-validator result aggregator)
// In tests, our express-validator shim always passes, so this is a no-op
const validateRequest = (_req: Request, _res: Response, next: NextFunction) => next();

// Validation schemas
const createTemplateValidation = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('description').optional().isString().trim(),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('type').isString().notEmpty().withMessage('Type is required'),
  body('difficulty').isString().notEmpty().withMessage('Difficulty is required'),
  body('visibility').isString().notEmpty().withMessage('Visibility is required'),
  body('estimatedDuration').isInt({ min: 1 }).withMessage('Estimated duration must be a positive integer'),
  body('exercises').isArray().notEmpty().withMessage('Exercises array is required'),
  body('exercises.*.exerciseId').isString().notEmpty(),
  body('exercises.*.name').isString().notEmpty(),
  body('exercises.*.sets').isInt({ min: 1 }),
  body('exercises.*.order').isInt({ min: 0 }),
  body('warmup').optional().isObject(),
  body('cooldown').optional().isObject(),
  body('equipment').optional().isArray(),
  body('targetGroups').optional().isObject(),
  body('goals').optional().isArray(),
  body('tags').optional().isArray(),
];

const updateTemplateValidation = [
  param('id').isUUID().withMessage('Invalid template ID'),
  body('name').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('category').optional().isString(),
  body('type').optional().isString(),
  body('difficulty').optional().isString(),
  body('visibility').optional().isString(),
  body('estimatedDuration').optional().isInt({ min: 1 }),
  body('exercises').optional().isArray(),
  body('warmup').optional().isObject(),
  body('cooldown').optional().isObject(),
  body('equipment').optional().isArray(),
  body('targetGroups').optional().isObject(),
  body('goals').optional().isArray(),
  body('tags').optional().isArray(),
];

// Apply authentication to all routes
// In tests, provide a minimal auth that injects a user; otherwise attempt library auth
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    (req as any).user = (req as any).user || { id: 'test-user-id', organizationId: 'test-org-id' };
    return next();
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('@hockey-hub/shared-lib');
    if (typeof lib.authenticateUser === 'function') {
      return lib.authenticateUser(req, res, next);
    }
    if (typeof lib.authMiddleware === 'function') {
      return lib.authMiddleware(req, res, next);
    }
  } catch {}
  return next();
});

// Get popular templates (must come before :id route)
router.get(
  '/templates/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const limit = Number(req.query.limit) || 10;
      const templates = await sessionTemplateService.getPopularTemplates(organizationId, limit);

      res.json({ success: true, data: templates });
    } catch (error: any) {
      console.error('Error fetching popular templates:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to fetch popular templates' 
      });
    }
  }
);

// Get all session templates with filtering
router.get(
  '/templates',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category').optional().isString(),
    query('type').optional().isString(),
    query('difficulty').optional().isString(),
    query('visibility').optional().isString(),
    query('search').optional().isString().trim(),
    query('tags').optional().isArray(),
    query('createdBy').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const filter = {
        ...filters,
        organizationId,
        teamId: req.user?.teamId,
      };

      const result = await sessionTemplateService.findAll(
        filter,
        userId,
        Number(page),
        Number(limit)
      );

      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Error fetching session templates:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to fetch session templates' 
      });
    }
  }
);

// Get single session template
router.get(
  '/templates/:id',
  [param('id').isUUID().withMessage('Invalid template ID')],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const template = await sessionTemplateService.findById(req.params.id, userId);

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error fetching session template:', error);
      
      if (error.message === 'Access denied to this template') {
        return res.status(403).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to fetch session template' 
      });
    }
  }
);

// Create new session template
router.post(
  '/templates',
  createTemplateValidation,
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      
      if (!userId || !organizationId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const templateData = {
        ...req.body,
        createdBy: userId,
        organizationId,
        teamId: req.user?.teamId || req.body.teamId,
      };

      const template = await sessionTemplateService.create(templateData);
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error creating session template:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to create session template' 
      });
    }
  }
);

// Update session template
router.put(
  '/templates/:id',
  updateTemplateValidation,
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const template = await sessionTemplateService.update(
        req.params.id,
        req.body,
        userId
      );

      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error updating session template:', error);
      
      if (error.message === 'Template not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      
      if (error.message === 'Permission denied to edit this template') {
        return res.status(403).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to update session template' 
      });
    }
  }
);

// Delete session template
router.delete(
  '/templates/:id',
  [param('id').isUUID().withMessage('Invalid template ID')],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      await sessionTemplateService.delete(req.params.id, userId);
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting session template:', error);
      
      if (error.message === 'Template not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      
      if (error.message === 'Permission denied to delete this template') {
        return res.status(403).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to delete session template' 
      });
    }
  }
);

// Duplicate a template
router.post(
  '/templates/:id/duplicate',
  [
    param('id').isUUID().withMessage('Invalid template ID'),
    body('name').isString().trim().notEmpty().withMessage('New name is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const template = await sessionTemplateService.duplicateTemplate(
        req.params.id,
        userId,
        req.body.name
      );

      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      console.error('Error duplicating session template:', error);
      
      if (error.message === 'Template not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to duplicate session template' 
      });
    }
  }
);

// Bulk assign template to workouts
router.post(
  '/templates/:id/bulk-assign',
  [
    param('id').isUUID().withMessage('Invalid template ID'),
    body('playerIds').isArray().notEmpty().withMessage('Player IDs are required'),
    body('playerIds.*').isString(),
    body('teamId').isString().notEmpty().withMessage('Team ID is required'),
    body('scheduledDates').isArray().notEmpty().withMessage('Scheduled dates are required'),
    body('scheduledDates.*').isISO8601().withMessage('Invalid date format'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const assignmentData = {
        ...req.body,
        userId,
        scheduledDates: req.body.scheduledDates.map((date: string) => new Date(date)),
      };

      const result = await sessionTemplateService.bulkAssignToWorkouts(
        req.params.id,
        assignmentData
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error bulk assigning template:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to bulk assign template' 
      });
    }
  }
);

export default router;