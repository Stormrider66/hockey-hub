import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';
import { validateBody, validateQuery } from '@hockey-hub/shared-lib/middleware';
import { TacticalPlanController, CreateTacticalPlanDto, UpdateTacticalPlanDto, TacticalPlanQueryDto } from '../../controllers/coach/tactical-plan.controller';

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
 * /api/planning/tactical-plans:
 *   post:
 *     tags: [Tactical Plans]
 *     summary: Create a new tactical plan
 *     description: Create a new tactical plan for a team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTacticalPlanDto'
 *     responses:
 *       201:
 *         description: Tactical plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TacticalPlan'
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
  validateBody(CreateTacticalPlanDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  TacticalPlanController.create
);

/**
 * @swagger
 * /api/planning/tactical-plans:
 *   get:
 *     tags: [Tactical Plans]
 *     summary: List tactical plans with filtering and pagination
 *     description: Get tactical plans for the organization with optional filtering
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [offensive, defensive, transition, special_teams]
 *         description: Filter by tactical category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in plan names and descriptions
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
 *     responses:
 *       200:
 *         description: Tactical plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedTacticalPlans'
 */
router.get(
  '/',
  validateQuery(TacticalPlanQueryDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  TacticalPlanController.list
);

/**
 * @swagger
 * /api/planning/tactical-plans/search:
 *   get:
 *     tags: [Tactical Plans]
 *     summary: Search tactical plans
 *     description: Search tactical plans by name and description
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TacticalPlan'
 */
router.get(
  '/search',
  searchLimiter,
  TacticalPlanController.search
);

/**
 * @swagger
 * /api/planning/tactical-plans/bulk:
 *   post:
 *     tags: [Tactical Plans]
 *     summary: Bulk operations on tactical plans
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
 *               planIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *             required: [action, planIds]
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
  TacticalPlanController.bulk
);

/**
 * @swagger
 * /api/planning/tactical-plans/{id}:
 *   get:
 *     tags: [Tactical Plans]
 *     summary: Get tactical plan by ID
 *     description: Retrieve a specific tactical plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tactical plan ID
 *     responses:
 *       200:
 *         description: Tactical plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TacticalPlan'
 *       404:
 *         description: Tactical plan not found
 */
router.get('/:id', TacticalPlanController.getById);

/**
 * @swagger
 * /api/planning/tactical-plans/{id}:
 *   put:
 *     tags: [Tactical Plans]
 *     summary: Update tactical plan
 *     description: Update an existing tactical plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tactical plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTacticalPlanDto'
 *     responses:
 *       200:
 *         description: Tactical plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TacticalPlan'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Tactical plan not found or no permission
 */
router.put(
  '/:id',
  heavyLimiter,
  validateBody(UpdateTacticalPlanDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true,
    skipMissingProperties: true 
  }),
  TacticalPlanController.update
);

/**
 * @swagger
 * /api/planning/tactical-plans/{id}:
 *   delete:
 *     tags: [Tactical Plans]
 *     summary: Delete tactical plan
 *     description: Soft delete a tactical plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tactical plan ID
 *     responses:
 *       204:
 *         description: Tactical plan deleted successfully
 *       404:
 *         description: Tactical plan not found or no permission
 */
router.delete('/:id', heavyLimiter, TacticalPlanController.delete);

export default router;