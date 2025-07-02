"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceController = void 0;
const PresenceService_1 = require("../services/PresenceService");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class PresenceController {
    constructor() {
        this.updatePresence = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const presence = await this.presenceService.updatePresence(userId, req.body);
            res.json({
                success: true,
                data: presence,
            });
        });
        this.getUserPresence = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const { userId } = req.params;
            const presence = await this.presenceService.getUserPresence(userId);
            res.json({
                success: true,
                data: presence,
            });
        });
        this.getMultipleUserPresence = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const { user_ids } = req.query;
            const userIds = user_ids.split(',');
            const presences = await this.presenceService.getMultipleUserPresence(userIds);
            res.json({
                success: true,
                data: presences,
            });
        });
        this.getOnlineUsers = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const organizationId = req.user.organizationId;
            const userIds = await this.presenceService.getOnlineUsersInOrganization(organizationId);
            res.json({
                success: true,
                data: userIds,
            });
        });
        this.getConversationPresence = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const { conversationId } = req.params;
            const presences = await this.presenceService.getConversationPresence(conversationId);
            res.json({
                success: true,
                data: presences,
            });
        });
        this.heartbeat = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            await this.presenceService.heartbeat(userId);
            res.json({
                success: true,
                message: 'Heartbeat received',
            });
        });
        this.presenceService = new PresenceService_1.PresenceService();
    }
}
exports.PresenceController = PresenceController;
//# sourceMappingURL=presenceController.js.map