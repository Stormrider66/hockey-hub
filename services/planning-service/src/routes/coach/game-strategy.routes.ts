import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';
import { validateBody, validateQuery } from '@hockey-hub/shared-lib/middleware';
import { GameStrategyController, CreateGameStrategyDto, UpdateGameStrategyDto, GameStrategyQueryDto } from '../../controllers/coach/game-strategy.controller';

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
 * /api/planning/game-strategies:
 *   post:
 *     tags: [Game Strategies]
 *     summary: Create a new game strategy
 *     description: Create a comprehensive game strategy with lineups and scouting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGameStrategyDto'
 *     responses:
 *       201:
 *         description: Game strategy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Strategy already exists for this game
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  heavyLimiter,
  validateBody(CreateGameStrategyDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  GameStrategyController.create
);

/**
 * @swagger
 * /api/planning/game-strategies:
 *   get:
 *     tags: [Game Strategies]
 *     summary: List game strategies with filtering and pagination
 *     description: Get game strategies for the organization with optional filtering
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
 *         name: gameId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific game ID
 *       - in: query
 *         name: opponentTeamId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by opponent team ID
 *       - in: query
 *         name: gameCompleted
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter strategies from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter strategies until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in opponent names and pre-game speeches
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
 *         description: Game strategies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedGameStrategies'
 */
router.get(
  '/',
  validateQuery(GameStrategyQueryDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true 
  }),
  GameStrategyController.list
);

/**
 * @swagger
 * /api/planning/game-strategies/stats:
 *   get:
 *     tags: [Game Strategies]
 *     summary: Get game strategy statistics
 *     description: Get statistical overview of game strategies
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
 *                 totalStrategies:
 *                   type: integer
 *                 completedGames:
 *                   type: integer
 *                 upcomingGames:
 *                   type: integer
 *                 averageChemistry:
 *                   type: number
 *                 commonOpponents:
 *                   type: object
 *                 averageTeamRating:
 *                   type: number
 */
router.get('/stats', moderateLimiter, GameStrategyController.getStats);

/**
 * @swagger
 * /api/planning/game-strategies/bulk:
 *   post:
 *     tags: [Game Strategies]
 *     summary: Bulk operations on game strategies
 *     description: Perform bulk operations like delete or mark as completed
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
 *                 enum: [delete, mark_completed]
 *               strategyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *             required: [action, strategyIds]
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
router.post('/bulk', heavyLimiter, GameStrategyController.bulk);

/**
 * @swagger
 * /api/planning/game-strategies/by-game/{gameId}:
 *   get:
 *     tags: [Game Strategies]
 *     summary: Get game strategy by game ID
 *     description: Retrieve strategy for a specific game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game strategy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       404:
 *         description: Game strategy not found
 */
router.get('/by-game/:gameId', GameStrategyController.getByGameId);

/**
 * @swagger
 * /api/planning/game-strategies/{id}:
 *   get:
 *     tags: [Game Strategies]
 *     summary: Get game strategy by ID
 *     description: Retrieve a specific game strategy
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID
 *     responses:
 *       200:
 *         description: Game strategy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       404:
 *         description: Game strategy not found
 */
router.get('/:id', GameStrategyController.getById);

/**
 * @swagger
 * /api/planning/game-strategies/{id}:
 *   put:
 *     tags: [Game Strategies]
 *     summary: Update game strategy
 *     description: Update an existing game strategy
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGameStrategyDto'
 *     responses:
 *       200:
 *         description: Game strategy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Game strategy not found or no permission
 */
router.put(
  '/:id',
  heavyLimiter,
  validateBody(UpdateGameStrategyDto, { 
    whitelist: true, 
    forbidNonWhitelisted: true,
    skipMissingProperties: true 
  }),
  GameStrategyController.update
);

/**
 * @swagger
 * /api/planning/game-strategies/{id}:
 *   delete:
 *     tags: [Game Strategies]
 *     summary: Delete game strategy
 *     description: Permanently delete a game strategy
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID
 *     responses:
 *       204:
 *         description: Game strategy deleted successfully
 *       404:
 *         description: Game strategy not found or no permission
 */
router.delete('/:id', heavyLimiter, GameStrategyController.delete);

/**
 * @swagger
 * /api/planning/game-strategies/{id}/period-adjustments:
 *   post:
 *     tags: [Game Strategies]
 *     summary: Add period adjustment
 *     description: Add tactical adjustments for a specific period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 enum: [1, 2, 3, "OT"]
 *               adjustments:
 *                 type: array
 *                 items:
 *                   type: string
 *               lineChanges:
 *                 type: object
 *             required: [period, adjustments]
 *     responses:
 *       200:
 *         description: Period adjustment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       404:
 *         description: Game strategy not found or no permission
 */
router.post('/:id/period-adjustments', moderateLimiter, GameStrategyController.addPeriodAdjustment);

/**
 * @swagger
 * /api/planning/game-strategies/{id}/post-game-analysis:
 *   put:
 *     tags: [Game Strategies]
 *     summary: Update post-game analysis
 *     description: Add comprehensive post-game analysis and player ratings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostGameAnalysis'
 *     responses:
 *       200:
 *         description: Post-game analysis updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       404:
 *         description: Game strategy not found or no permission
 */
router.put('/:id/post-game-analysis', heavyLimiter, GameStrategyController.updatePostGameAnalysis);

/**
 * @swagger
 * /api/planning/game-strategies/{id}/lineup-analysis:
 *   get:
 *     tags: [Game Strategies]
 *     summary: Get lineup analysis
 *     description: Get detailed analysis of the game strategy lineups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID
 *     responses:
 *       200:
 *         description: Lineup analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLineups:
 *                   type: integer
 *                 playersInLineup:
 *                   type: array
 *                   items:
 *                     type: string
 *                 averageChemistry:
 *                   type: number
 *                 lineupBreakdown:
 *                   type: object
 *                   properties:
 *                     evenStrength:
 *                       type: integer
 *                     powerplay:
 *                       type: integer
 *                     penaltyKill:
 *                       type: integer
 *                     overtime:
 *                       type: integer
 *                     extraAttacker:
 *                       type: integer
 *       404:
 *         description: Game strategy not found
 */
router.get('/:id/lineup-analysis', GameStrategyController.getLineupAnalysis);

/**
 * @swagger
 * /api/planning/game-strategies/{id}/clone:
 *   post:
 *     tags: [Game Strategies]
 *     summary: Clone game strategy
 *     description: Clone an existing strategy for a new game
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game strategy ID to clone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newGameId:
 *                 type: string
 *                 format: uuid
 *               newOpponentTeamId:
 *                 type: string
 *                 format: uuid
 *               newOpponentTeamName:
 *                 type: string
 *             required: [newGameId, newOpponentTeamId, newOpponentTeamName]
 *     responses:
 *       201:
 *         description: Game strategy cloned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GameStrategy'
 *       404:
 *         description: Original game strategy not found
 *       409:
 *         description: Strategy already exists for the target game
 */
router.post('/:id/clone', heavyLimiter, GameStrategyController.clone);

export default router;