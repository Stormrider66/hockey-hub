import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authMiddleware } from '@hockey-hub/shared-lib';

const router = Router();
const messageController = new MessageController();

// All routes require authentication
router.use(authMiddleware);

// Message operations in conversations
router.post('/conversations/:conversationId/messages', messageController.sendMessage);
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Individual message operations
router.put('/:messageId', messageController.editMessage);
router.delete('/:messageId', messageController.deleteMessage);

// Reactions
router.post('/:messageId/reactions', messageController.addReaction);
router.delete('/:messageId/reactions', messageController.removeReaction);

// Search and bulk operations
router.get('/search', messageController.searchMessages);
router.put('/read', messageController.markAsRead);

export default router;