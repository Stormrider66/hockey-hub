"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const MessageService_1 = require("../services/MessageService");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class MessageController {
    constructor() {
        this.sendMessage = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const message = await this.messageService.sendMessage(conversationId, userId, req.body);
            res.status(201).json({
                success: true,
                data: message,
            });
        });
        this.getMessages = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const params = {
                conversation_id: conversationId,
                before_id: req.query.before_id,
                after_id: req.query.after_id,
                limit: parseInt(req.query.limit) || 50,
                search: req.query.search,
            };
            const result = await this.messageService.getMessages(userId, params);
            res.json({
                success: true,
                data: result.messages,
                hasMore: result.hasMore,
            });
        });
        this.editMessage = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { messageId } = req.params;
            const message = await this.messageService.editMessage(messageId, userId, req.body);
            res.json({
                success: true,
                data: message,
            });
        });
        this.deleteMessage = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { messageId } = req.params;
            await this.messageService.deleteMessage(messageId, userId);
            res.json({
                success: true,
                message: 'Message deleted successfully',
            });
        });
        this.addReaction = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { messageId } = req.params;
            await this.messageService.addReaction(messageId, userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Reaction added successfully',
            });
        });
        this.removeReaction = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { messageId } = req.params;
            const { emoji } = req.query;
            await this.messageService.removeReaction(messageId, userId, emoji);
            res.json({
                success: true,
                message: 'Reaction removed successfully',
            });
        });
        this.searchMessages = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { query, conversation_ids } = req.query;
            const conversationIds = conversation_ids
                ? conversation_ids.split(',')
                : undefined;
            const messages = await this.messageService.searchMessages(userId, query, conversationIds);
            res.json({
                success: true,
                data: messages,
            });
        });
        this.markAsRead = (0, shared_lib_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const { message_ids } = req.body;
            await this.messageService.markAsRead(message_ids, userId);
            res.json({
                success: true,
                message: 'Messages marked as read',
            });
        });
        this.messageService = new MessageService_1.MessageService();
    }
}
exports.MessageController = MessageController;
//# sourceMappingURL=messageController.js.map