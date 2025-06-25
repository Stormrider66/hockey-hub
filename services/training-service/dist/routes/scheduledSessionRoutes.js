"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const scheduledSessionController_1 = require("../controllers/scheduledSessionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Apply authentication to all scheduled‑session routes
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// Routes for /api/v1/scheduled-sessions
router.get('/', scheduledSessionController_1.getScheduledSessions);
router.post('/', scheduledSessionController_1.createScheduledSessionHandler);
router.get('/:id', scheduledSessionController_1.getScheduledSessionById);
router.put('/:id', scheduledSessionController_1.updateScheduledSessionHandler); // Could also use PATCH for partial updates like status/completion
router.delete('/:id', scheduledSessionController_1.deleteScheduledSessionHandler);
// Routes for live session actions (might be handled differently, e.g., via WebSockets)
router.post('/:id/start', scheduledSessionController_1.startSessionHandler); // Start a session
router.post('/:id/complete', scheduledSessionController_1.completeSessionHandler); // Mark session as complete, submit results
// TODO: Add route for attendance (GET /:id/attendance)
exports.default = router;
