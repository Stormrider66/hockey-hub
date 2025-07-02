"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const router = (0, express_1.Router)();
const messageController = new messageController_1.MessageController();
// All routes require authentication
router.use(shared_lib_1.authMiddleware);
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
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map