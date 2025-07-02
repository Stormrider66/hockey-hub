"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const presenceController_1 = require("../controllers/presenceController");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const router = (0, express_1.Router)();
const presenceController = new presenceController_1.PresenceController();
// All routes require authentication
router.use(shared_lib_1.authMiddleware);
// Presence operations
router.put('/', presenceController.updatePresence);
router.get('/users', presenceController.getMultipleUserPresence);
router.get('/online', presenceController.getOnlineUsers);
router.get('/conversations/:conversationId', presenceController.getConversationPresence);
router.get('/:userId', presenceController.getUserPresence);
router.post('/heartbeat', presenceController.heartbeat);
exports.default = router;
//# sourceMappingURL=presenceRoutes.js.map