"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversationController_1 = require("../controllers/conversationController");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const router = (0, express_1.Router)();
const conversationController = new conversationController_1.ConversationController();
// All routes require authentication
router.use(shared_lib_1.authMiddleware);
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
exports.default = router;
//# sourceMappingURL=conversationRoutes.js.map