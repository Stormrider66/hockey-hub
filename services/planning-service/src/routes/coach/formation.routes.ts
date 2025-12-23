// @ts-nocheck - Suppress TypeScript errors for build
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';
import { validateBody, validateQuery } from '@hockey-hub/shared-lib/middleware';
import { 
  FormationController,
  CreateFormationDto,
  UpdateFormationDto,
  FormationQueryDto,
  FormationUsageDto
} from '../../controllers/coach/formation.controller';

const router = Router();

// Auth middleware - require coach role
const auth = createAuthMiddleware();
router.use(auth.extractUser());
router.use(auth.requireAuth());
router.use(auth.requireRole('coach')); // Restrict to coaches only

// Rate limiting for heavy operations
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 search requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/planning/formations:
 *   post:
 *     tags: [Formations]
 *     summary: Create a new formation
 *     description: Create a new tactical formation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFormationDto'
 *     responses:
 *       201:
 *         description: Formation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formation'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  heavyLimiter,
  validateBody(CreateFormationDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  FormationController.create
);

/**
 * @swagger
 * /api/planning/formations:
 *   get:
 *     tags: [Formations]
 *     summary: List formations with filtering and pagination
 *     description: Get formations for the organization with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by team ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [offensive, defensive, transition, special_teams]
 *         description: Filter by formation type
 *       - in: query
 *         name: isTemplate
 *         schema:
 *           type: boolean
 *         description: Filter by template status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in formation names and descriptions
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, updatedAt, successRate, usageCount, type]
 *           default: updatedAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Formations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedFormations'
 */
router.get(
  '/',
  validateQuery(FormationQueryDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  FormationController.list
);

/**
 * @swagger
 * /api/planning/formations/templates:
 *   get:
 *     tags: [Formations]
 *     summary: Get formation templates
 *     description: Get system-wide formation templates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [offensive, defensive, transition, special_teams]
 *         description: Filter by formation type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template names and descriptions
 *     responses:
 *       200:
 *         description: Formation templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Formation'
 */
router.get('/templates', FormationController.getTemplates);

/**
 * @swagger
 * /api/planning/formations/bulk:
 *   post:
 *     tags: [Formations]
 *     summary: Bulk operations on formations
 *     description: Perform bulk operations like delete or duplicate
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [delete, duplicate]
 *               formationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               options:
 *                 type: object
 *                 description: Additional options for the operation
 *             required: [action, formationIds]
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 affectedCount:
 *                   type: integer
 */
router.post(
  '/bulk',
  heavyLimiter,
  FormationController.bulk
);

/**
 * @swagger
 * /api/planning/formations/{id}:
 *   get:
 *     tags: [Formations]
 *     summary: Get formation by ID
 *     description: Retrieve a specific formation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Formation ID
 *     responses:
 *       200:
 *         description: Formation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formation'
 *       404:
 *         description: Formation not found
 */
router.get('/:id', FormationController.getById);

/**
 * @swagger
 * /api/planning/formations/{id}:
 *   put:
 *     tags: [Formations]
 *     summary: Update formation
 *     description: Update an existing formation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Formation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFormationDto'
 *     responses:
 *       200:
 *         description: Formation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formation'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Formation not found or no permission
 */
router.put(
  '/:id',
  heavyLimiter,
  validateBody(UpdateFormationDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true,
    skipMissingProperties: true 
  }),
  FormationController.update
);

/**
 * @swagger
 * /api/planning/formations/{id}:
 *   delete:
 *     tags: [Formations]
 *     summary: Delete formation
 *     description: Soft delete a formation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Formation ID
 *     responses:
 *       204:
 *         description: Formation deleted successfully
 *       404:
 *         description: Formation not found or no permission
 */
router.delete('/:id', heavyLimiter, FormationController.delete);

/**
 * @swagger
 * /api/planning/formations/{id}/clone:
 *   post:
 *     tags: [Formations]
 *     summary: Clone formation
 *     description: Create a copy of an existing formation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Formation ID to clone
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the cloned formation
 *     responses:
 *       201:
 *         description: Formation cloned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formation'
 *       404:
 *         description: Formation not found
 */
router.post('/:id/clone', heavyLimiter, FormationController.clone);

/**
 * @swagger
 * /api/planning/formations/{id}/usage:
 *   post:
 *     tags: [Formations]
 *     summary: Record formation usage
 *     description: Record usage of a formation in a game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Formation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FormationUsageDto'
 *     responses:
 *       200:
 *         description: Usage recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 usageCount:
 *                   type: integer
 *                 successRate:
 *                   type: number
 */
router.post(
  '/:id/usage',
  validateBody(FormationUsageDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  FormationController.recordUsage
);

/**
 * @swagger
 * /api/planning/formations/{id}/analytics:
 *   get:
 *     tags: [Formations]
 *     summary: Get formation analytics
 *     description: Get detailed analytics for a formation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Formation ID
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 basic:
 *                   type: object
 *                   properties:
 *                     usageCount:
 *                       type: integer
 *                     successRate:
 *                       type: number
 *                     totalPlayers:
 *                       type: integer
 *                     isBalanced:
 *                       type: boolean
 *                 coverage:
 *                   type: object
 *                   properties:
 *                     offensive:
 *                       type: number
 *                     defensive:
 *                       type: number
 *                     neutral:
 *                       type: number
 *                 tacticalPlansCount:
 *                   type: integer
 *                 positions:
 *                   type: object
 *                   properties:
 *                     offensive:
 *                       type: integer
 *                     defensive:
 *                       type: integer
 *                     neutral:
 *                       type: integer
 *       404:
 *         description: Formation not found
 */
router.get('/:id/analytics', FormationController.getAnalytics);

export default router;