"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainingSessionController_1 = require("../controllers/trainingSessionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// GET /api/v1/training-sessions/teams/:teamId/metrics
router.get('/teams/:teamId/metrics', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), trainingSessionController_1.getTeamMetrics);
// GET /api/v1/training-sessions/scheduled-sessions/:id/intervals
router.get('/scheduled-sessions/:id/intervals', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach']), trainingSessionController_1.getSessionIntervals);
exports.default = router;
