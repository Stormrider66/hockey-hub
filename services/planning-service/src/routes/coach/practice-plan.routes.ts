import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';
import { validateBody, validateQuery } from '@hockey-hub/shared-lib/middleware';
import { PracticePlanController, CreatePracticePlanDto, UpdatePracticePlanDto, PracticePlanQueryDto } from '../../controllers/coach/practice-plan.controller';

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

const moderateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/planning/practice-plans:
 *   post:
 *     tags: [Practice Plans]
 *     summary: Create a new practice plan
 *     description: Create a comprehensive practice plan with sections and drills
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePracticePlanDto'
 *     responses:
 *       201:
 *         description: Practice plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticePlan'
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
  validateBody(CreatePracticePlanDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  PracticePlanController.create
);

/**
 * @swagger
 * /api/planning/practice-plans:
 *   get:
 *     tags: [Practice Plans]
 *     summary: List practice plans with filtering and pagination
 *     description: Get practice plans for the organization with optional filtering
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, in_progress, completed, cancelled]
 *         description: Filter by practice status
 *       - in: query
 *         name: primaryFocus
 *         schema:
 *           type: string
 *           enum: [skills, tactics, conditioning, game_prep, recovery, evaluation]
 *         description: Filter by practice focus
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter practices from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter practices until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in titles, descriptions, and notes
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
 *         description: Practice plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPracticePlans'
 */
router.get(
  '/',
  validateQuery(PracticePlanQueryDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  PracticePlanController.list
);

/**
 * @swagger
 * /api/planning/practice-plans/stats:
 *   get:
 *     tags: [Practice Plans]
 *     summary: Get practice plan statistics
 *     description: Get statistical overview of practice plans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPractices:
 *                   type: integer
 *                 byStatus:
 *                   type: object
 *                 byFocus:
 *                   type: object
 *                 totalDuration:
 *                   type: number
 *                 averageDuration:
 *                   type: number
 *                 averageAttendance:
 *                   type: number
 */
router.get('/stats', moderateLimiter, PracticePlanController.getStats);

/**
 * @swagger
 * /api/planning/practice-plans/{id}:
 *   get:
 *     tags: [Practice Plans]
 *     summary: Get practice plan by ID
 *     description: Retrieve a specific practice plan with drills and training plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Practice plan ID
 *     responses:
 *       200:
 *         description: Practice plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticePlan'
 *       404:
 *         description: Practice plan not found
 */
router.get('/:id', PracticePlanController.getById);

/**
 * @swagger
 * /api/planning/practice-plans/{id}:
 *   put:
 *     tags: [Practice Plans]
 *     summary: Update practice plan
 *     description: Update an existing practice plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Practice plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePracticePlanDto'
 *     responses:
 *       200:
 *         description: Practice plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticePlan'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Practice plan not found or no permission
 */
router.put(
  '/:id',
  heavyLimiter,
  validateBody(UpdatePracticePlanDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true,
    skipMissingProperties: true 
  }),
  PracticePlanController.update
);

/**
 * @swagger
 * /api/planning/practice-plans/{id}:
 *   delete:
 *     tags: [Practice Plans]
 *     summary: Delete practice plan
 *     description: Permanently delete a practice plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Practice plan ID
 *     responses:
 *       204:
 *         description: Practice plan deleted successfully
 *       404:
 *         description: Practice plan not found or no permission
 */
router.delete('/:id', heavyLimiter, PracticePlanController.delete);

/**
 * @swagger
 * /api/planning/practice-plans/{id}/duplicate:
 *   post:
 *     tags: [Practice Plans]
 *     summary: Duplicate practice plan
 *     description: Create a copy of an existing practice plan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Practice plan ID to duplicate
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newDate:
 *                 type: string
 *                 format: date-time
 *               newTitle:
 *                 type: string
 *     responses:
 *       201:
 *         description: Practice plan duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticePlan'
 *       404:
 *         description: Original practice plan not found
 */
router.post('/:id/duplicate', heavyLimiter, PracticePlanController.duplicate);

/**
 * @swagger
 * /api/planning/practice-plans/{id}/attendance:
 *   put:
 *     tags: [Practice Plans]
 *     summary: Update practice attendance
 *     description: Update attendance records for a practice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Practice plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendance:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: string
 *                       format: uuid
 *                     present:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *                   required: [playerId, present]
 *             required: [attendance]
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticePlan'
 *       404:
 *         description: Practice plan not found or no permission
 */
router.put('/:id/attendance', moderateLimiter, PracticePlanController.updateAttendance);

/**
 * @swagger
 * /api/planning/practice-plans/{id}/evaluations:
 *   put:
 *     tags: [Practice Plans]
 *     summary: Update player evaluations
 *     description: Update player performance evaluations for a practice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Practice plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerEvaluations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     playerId:
 *                       type: string
 *                       format: uuid
 *                     rating:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 10
 *                     notes:
 *                       type: string
 *                     areasOfImprovement:
 *                       type: array
 *                       items:
 *                         type: string
 *                   required: [playerId, rating]
 *             required: [playerEvaluations]
 *     responses:
 *       200:
 *         description: Evaluations updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PracticePlan'
 *       404:
 *         description: Practice plan not found or no permission
 */
router.put('/:id/evaluations', moderateLimiter, PracticePlanController.updateEvaluations);

export default router;