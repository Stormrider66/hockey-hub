// @ts-nocheck
import { Router } from 'express';
import {
    getScheduledSessions,
    getScheduledSessionById,
    createScheduledSessionHandler,
    updateScheduledSessionHandler,
    deleteScheduledSessionHandler,
    startSessionHandler,      // Placeholder
    completeSessionHandler    // Placeholder
} from '../controllers/scheduledSessionController';
import { requireAuth } from '../middlewares/authMiddleware';

// Apply authentication to all scheduled‑session routes
const router = Router();
router.use(requireAuth);

// Routes for /api/v1/scheduled-sessions
router.get('/', getScheduledSessions);
router.post('/', createScheduledSessionHandler);
router.get('/:id', getScheduledSessionById);
router.put('/:id', updateScheduledSessionHandler); // Could also use PATCH for partial updates like status/completion
router.delete('/:id', deleteScheduledSessionHandler);

// Routes for live session actions (might be handled differently, e.g., via WebSockets)
router.post('/:id/start', startSessionHandler);     // Start a session
router.post('/:id/complete', completeSessionHandler); // Mark session as complete, submit results

// TODO: Add route for attendance (GET /:id/attendance)

export default router; 