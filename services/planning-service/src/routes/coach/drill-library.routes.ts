import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';
import { validateBody, validateQuery } from '@hockey-hub/shared-lib/middleware';
import { DrillLibraryController, CreateDrillDto, UpdateDrillDto, DrillSearchQueryDto, RateDrillDto } from '../../controllers/coach/drill-library.controller';

const router = Router();

// Auth middleware - require coach role
const auth = createAuthMiddleware();
router.use(auth.extractUser());
router.use(auth.requireAuth());
router.use(auth.requireRole('coach')); // Restrict to coaches only

// Rate limiting
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 search requests per minute (more lenient for drill searching)
  standardHeaders: true,
  legacyHeaders: false
});

const moderateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/planning/drill-library:
 *   post:
 *     tags: [Drill Library]
 *     summary: Create a new drill
 *     description: Create a custom drill for the organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDrillDto'
 *     responses:
 *       201:
 *         description: Drill created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drill'
 *       400:
 *         description: Invalid input data or category ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  heavyLimiter,
  validateBody(CreateDrillDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  DrillLibraryController.create
);

/**
 * @swagger
 * /api/planning/drill-library:
 *   get:
 *     tags: [Drill Library]
 *     summary: List drills with basic filtering
 *     description: Get drills for the organization with basic filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [warm_up, skill, tactical, conditioning, game, cool_down]
 *         description: Filter by drill type
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced, elite]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Drills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedDrills'
 */
router.get(
  '/',
  DrillLibraryController.list
);

/**
 * @swagger
 * /api/planning/drill-library/search:
 *   get:
 *     tags: [Drill Library]
 *     summary: Advanced drill search
 *     description: Search drills with comprehensive filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [warm_up, skill, tactical, conditioning, game, cool_down]
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced, elite]
 *       - in: query
 *         name: ageGroup
 *         schema:
 *           type: string
 *         description: Filter by age group (U8, U10, U12, etc.)
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum drill duration in minutes
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum drill duration in minutes
 *       - in: query
 *         name: playerCount
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of players available
 *       - in: query
 *         name: rinkArea
 *         schema:
 *           type: string
 *           enum: [full, half, zone, corner, neutral]
 *         description: Required rink area
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in drill names, descriptions, and objectives
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, name, duration, usageCount, createdAt]
 *           default: rating
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedDrills'
 */
router.get(
  '/search',
  searchLimiter,
  validateQuery(DrillSearchQueryDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  DrillLibraryController.search
);

/**
 * @swagger
 * /api/planning/drill-library/popular:
 *   get:
 *     tags: [Drill Library]
 *     summary: Get popular drills
 *     description: Get the most popular drills based on usage and rating
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of drills to return
 *     responses:
 *       200:
 *         description: Popular drills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Drill'
 */
router.get('/popular', moderateLimiter, DrillLibraryController.getPopular);

/**
 * @swagger
 * /api/planning/drill-library/stats:
 *   get:
 *     tags: [Drill Library]
 *     summary: Get drill statistics
 *     description: Get statistical overview of organization's drill library
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDrills:
 *                   type: integer
 *                 byType:
 *                   type: object
 *                 byDifficulty:
 *                   type: object
 *                 averageRating:
 *                   type: number
 *                 totalUsage:
 *                   type: integer
 *                 mostPopularTags:
 *                   type: object
 */
router.get('/stats', moderateLimiter, DrillLibraryController.getStats);

/**
 * @swagger
 * /api/planning/drill-library/bulk:
 *   post:
 *     tags: [Drill Library]
 *     summary: Bulk operations on drills
 *     description: Perform bulk operations like delete, make public, or make private
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
 *                 enum: [delete, make_public, make_private]
 *               drillIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *             required: [action, drillIds]
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
router.post('/bulk', heavyLimiter, DrillLibraryController.bulk);

/**
 * @swagger
 * /api/planning/drill-library/category/{categoryId}:
 *   get:
 *     tags: [Drill Library]
 *     summary: Get drills by category
 *     description: Get all drills in a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Category drills retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedDrills'
 */
router.get('/category/:categoryId', DrillLibraryController.getByCategory);

/**
 * @swagger
 * /api/planning/drill-library/{id}:
 *   get:
 *     tags: [Drill Library]
 *     summary: Get drill by ID
 *     description: Retrieve a specific drill with full details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Drill ID
 *     responses:
 *       200:
 *         description: Drill retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drill'
 *       404:
 *         description: Drill not found
 */
router.get('/:id', DrillLibraryController.getById);

/**
 * @swagger
 * /api/planning/drill-library/{id}:
 *   put:
 *     tags: [Drill Library]
 *     summary: Update drill
 *     description: Update an existing drill (organization's drills only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Drill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDrillDto'
 *     responses:
 *       200:
 *         description: Drill updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drill'
 *       400:
 *         description: Invalid input data or category ID
 *       404:
 *         description: Drill not found or no permission
 */
router.put(
  '/:id',
  heavyLimiter,
  validateBody(UpdateDrillDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true,
    skipMissingProperties: true 
  }),
  DrillLibraryController.update
);

/**
 * @swagger
 * /api/planning/drill-library/{id}:
 *   delete:
 *     tags: [Drill Library]
 *     summary: Delete drill
 *     description: Permanently delete a drill (organization's drills only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Drill ID
 *     responses:
 *       204:
 *         description: Drill deleted successfully
 *       404:
 *         description: Drill not found or no permission
 */
router.delete('/:id', heavyLimiter, DrillLibraryController.delete);

/**
 * @swagger
 * /api/planning/drill-library/{id}/rate:
 *   post:
 *     tags: [Drill Library]
 *     summary: Rate a drill
 *     description: Submit a rating for a drill (1-5 stars)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Drill ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RateDrillDto'
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 averageRating:
 *                   type: number
 *                 ratingCount:
 *                   type: integer
 *       404:
 *         description: Drill not found
 */
router.post(
  '/:id/rate',
  moderateLimiter,
  validateBody(RateDrillDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  DrillLibraryController.rateDrill
);

/**
 * @swagger
 * /api/planning/drill-library/{id}/duplicate:
 *   post:
 *     tags: [Drill Library]
 *     summary: Duplicate drill
 *     description: Create a copy of an existing drill
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Drill ID to duplicate
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Drill duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drill'
 *       404:
 *         description: Original drill not found
 */
router.post('/:id/duplicate', heavyLimiter, DrillLibraryController.duplicate);

export default router;