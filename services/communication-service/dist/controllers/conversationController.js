"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationController = void 0;
const ConversationService_1 = require("../services/ConversationService");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class ConversationController {
    constructor() {
        this.createConversation = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const conversation = await this.conversationService.createConversation(userId, req.body);
            res.status(201).json({
                success: true,
                data: conversation,
            });
        });
        this.getConversations = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const params = {
                user_id: userId,
                include_archived: req.query.include_archived === 'true',
                type: req.query.type,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            };
            const result = await this.conversationService.getUserConversations(params);
            res.json({
                success: true,
                data: result.conversations,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                },
            });
        });
        this.getConversation = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const conversation = await this.conversationService.getConversationById(conversationId, userId);
            res.json({
                success: true,
                data: conversation,
            });
        });
        this.updateConversation = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const conversation = await this.conversationService.updateConversation(conversationId, userId, req.body);
            res.json({
                success: true,
                data: conversation,
            });
        });
        this.archiveConversation = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            await this.conversationService.archiveConversation(conversationId, userId);
            res.json({
                success: true,
                message: 'Conversation archived successfully',
            });
        });
        this.addParticipants = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const { participant_ids } = req.body;
            await this.conversationService.addParticipants(conversationId, userId, participant_ids);
            res.json({
                success: true,
                message: 'Participants added successfully',
            });
        });
        this.removeParticipant = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId, participantId } = req.params;
            await this.conversationService.removeParticipant(conversationId, userId, participantId);
            res.json({
                success: true,
                message: 'Participant removed successfully',
            });
        });
        this.markAsRead = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            await this.conversationService.markAsRead(conversationId, userId);
            res.json({
                success: true,
                message: 'Conversation marked as read',
            });
        });
        this.muteConversation = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const { until } = req.body;
            await this.conversationService.muteConversation(conversationId, userId, until ? new Date(until) : undefined);
            res.json({
                success: true,
                message: 'Conversation muted successfully',
            });
        });
        this.unmuteConversation = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            await this.conversationService.unmuteConversation(conversationId, userId);
            res.json({
                success: true,
                message: 'Conversation unmuted successfully',
            });
        });
        this.conversationService = new ConversationService_1.ConversationService();
    }
}
exports.ConversationController = ConversationController;
//# sourceMappingURL=conversationController.js.map