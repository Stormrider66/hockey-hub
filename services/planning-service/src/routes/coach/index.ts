import { Router } from 'express';
import tacticalPlanRoutes from './tactical-plan.routes';
import formationRoutes from './formation.routes';
import practicePlanRoutes from './practice-plan.routes';
import gameStrategyRoutes from './game-strategy.routes';
import drillLibraryRoutes from './drill-library.routes';

const router = Router();

/**
 * Coach-specific routes for the Planning Service
 * 
 * All routes under /api/planning/coach/ are automatically protected
 * by coach role authentication middleware.
 */

// Mount tactical plan routes
// GET    /api/planning/coach/tactical-plans
// POST   /api/planning/coach/tactical-plans
// GET    /api/planning/coach/tactical-plans/:id
// PUT    /api/planning/coach/tactical-plans/:id
// DELETE /api/planning/coach/tactical-plans/:id
// GET    /api/planning/coach/tactical-plans/search
// POST   /api/planning/coach/tactical-plans/bulk
router.use('/tactical-plans', tacticalPlanRoutes);

// Mount formation routes
// GET    /api/planning/coach/formations
// POST   /api/planning/coach/formations
// GET    /api/planning/coach/formations/:id
// PUT    /api/planning/coach/formations/:id
// DELETE /api/planning/coach/formations/:id
// GET    /api/planning/coach/formations/templates
// POST   /api/planning/coach/formations/bulk
// POST   /api/planning/coach/formations/:id/clone
// POST   /api/planning/coach/formations/:id/usage
// GET    /api/planning/coach/formations/:id/analytics
router.use('/formations', formationRoutes);

// Mount practice plan routes
// GET    /api/planning/coach/practice-plans
// POST   /api/planning/coach/practice-plans
// GET    /api/planning/coach/practice-plans/:id
// PUT    /api/planning/coach/practice-plans/:id
// DELETE /api/planning/coach/practice-plans/:id
// GET    /api/planning/coach/practice-plans/stats
// POST   /api/planning/coach/practice-plans/:id/duplicate
// PUT    /api/planning/coach/practice-plans/:id/attendance
// PUT    /api/planning/coach/practice-plans/:id/evaluations
router.use('/practice-plans', practicePlanRoutes);

// Mount game strategy routes
// GET    /api/planning/coach/game-strategies
// POST   /api/planning/coach/game-strategies
// GET    /api/planning/coach/game-strategies/:id
// PUT    /api/planning/coach/game-strategies/:id
// DELETE /api/planning/coach/game-strategies/:id
// GET    /api/planning/coach/game-strategies/stats
// GET    /api/planning/coach/game-strategies/by-game/:gameId
// POST   /api/planning/coach/game-strategies/bulk
// POST   /api/planning/coach/game-strategies/:id/period-adjustments
// PUT    /api/planning/coach/game-strategies/:id/post-game-analysis
// GET    /api/planning/coach/game-strategies/:id/lineup-analysis
// POST   /api/planning/coach/game-strategies/:id/clone
router.use('/game-strategies', gameStrategyRoutes);

// Mount drill library routes
// GET    /api/planning/coach/drill-library
// POST   /api/planning/coach/drill-library
// GET    /api/planning/coach/drill-library/:id
// PUT    /api/planning/coach/drill-library/:id
// DELETE /api/planning/coach/drill-library/:id
// GET    /api/planning/coach/drill-library/search
// GET    /api/planning/coach/drill-library/popular
// GET    /api/planning/coach/drill-library/stats
// GET    /api/planning/coach/drill-library/category/:categoryId
// POST   /api/planning/coach/drill-library/bulk
// POST   /api/planning/coach/drill-library/:id/rate
// POST   /api/planning/coach/drill-library/:id/duplicate
router.use('/drill-library', drillLibraryRoutes);

export default router;