import { Router } from 'express';
import { PresenceController } from '../controllers/presenceController';
import { authMiddleware } from '@hockey-hub/shared-lib';

const router = Router();
const presenceController = new PresenceController();

// All routes require authentication
router.use(authMiddleware);

// Presence operations
router.put('/', presenceController.updatePresence);
router.get('/users', presenceController.getMultipleUserPresence);
router.get('/online', presenceController.getOnlineUsers);
router.get('/conversations/:conversationId', presenceController.getConversationPresence);
router.get('/:userId', presenceController.getUserPresence);
router.post('/heartbeat', presenceController.heartbeat);

export default router;