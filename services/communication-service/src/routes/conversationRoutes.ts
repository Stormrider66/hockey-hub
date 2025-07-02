import { Router } from 'express';
import { ConversationController } from '../controllers/conversationController';
import { authMiddleware } from '@hockey-hub/shared-lib';

const router = Router();
const conversationController = new ConversationController();

// All routes require authentication
router.use(authMiddleware);

// Conversation CRUD
router.post('/', conversationController.createConversation);
router.get('/', conversationController.getConversations);
router.get('/:conversationId', conversationController.getConversation);
router.put('/:conversationId', conversationController.updateConversation);
router.delete('/:conversationId', conversationController.archiveConversation);

// Participants
router.post('/:conversationId/participants', conversationController.addParticipants);
router.delete('/:conversationId/participants/:participantId', conversationController.removeParticipant);

// Read status
router.put('/:conversationId/read', conversationController.markAsRead);

// Mute/unmute
router.put('/:conversationId/mute', conversationController.muteConversation);
router.delete('/:conversationId/mute', conversationController.unmuteConversation);

export default router;