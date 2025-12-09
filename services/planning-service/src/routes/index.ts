import { Router } from 'express';
import dashboardRoutes from './dashboardRoutes';
import coachRoutes from './coach';

const router = Router();

/**
 * Main router for Planning Service
 * 
 * Routes:
 * - /api/planning/dashboard/* - Dashboard data for different user roles
 * - /api/planning/coach/* - Coach-specific functionality (requires coach role)
 * - /api/planning/drills/* - Legacy drill endpoints (from dashboard routes)
 * - /api/planning/templates/* - Template endpoints (from dashboard routes)
 * - /api/planning/practices/* - Basic practice endpoints (from dashboard routes)
 * - /api/planning/analytics/* - Analytics endpoints (from dashboard routes)
 */

// Dashboard routes (includes legacy endpoints for backwards compatibility)
// These handle:
// - GET /dashboard/coach
// - GET /dashboard/player  
// - GET /dashboard/admin
// - GET /drills/search
// - GET /drills/popular
// - GET /drills/:id
// - GET /templates
// - GET /templates/popular
// - GET /templates/:id
// - POST /templates/:id/use
// - GET /practices
// - GET /practices/:id
// - POST /practices
// - PUT /practices/:id
// - GET /analytics
router.use('/', dashboardRoutes);

// Coach-specific routes (requires coach role authentication)
// These handle comprehensive CRUD operations for:
// - Tactical Plans
// - Practice Plans  
// - Game Strategies
// - Drill Library Management
router.use('/coach', coachRoutes);

export default router;