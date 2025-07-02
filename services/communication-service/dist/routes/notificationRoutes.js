"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRoutes = void 0;
const express_1 = require("express");
const services_1 = require("../services");
const entities_1 = require("../entities");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const express_validator_1 = require("express-validator");
function createNotificationRoutes(dataSource) {
    const router = (0, express_1.Router)();
    const notificationService = new services_1.NotificationService(dataSource);
    // Apply authentication middleware to all routes
    router.use(shared_lib_1.authMiddleware);
    /**
     * GET /notifications - Get user notifications
     */
    router.get('/', [
        (0, express_validator_1.query)('type').optional().isIn(Object.values(entities_1.NotificationType)),
        (0, express_validator_1.query)('status').optional().isIn(Object.values(entities_1.NotificationStatus)),
        (0, express_validator_1.query)('priority').optional().isIn(Object.values(entities_1.NotificationPriority)),
        (0, express_validator_1.query)('unreadOnly').optional().isBoolean(),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const filters = {
                recipientId: userId,
                organizationId: req.user?.organizationId,
                type: req.query.type,
                status: req.query.status,
                priority: req.query.priority,
                unreadOnly: req.query.unreadOnly === 'true',
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset) : undefined,
            };
            const result = await notificationService.getNotifications(filters);
            res.json(result);
        }
        catch (error) {
            console.error('Error getting notifications:', error);
            res.status(500).json({ error: 'Failed to get notifications' });
        }
    });
    /**
     * POST /notifications - Create a new notification
     */
    router.post('/', [
        (0, express_validator_1.body)('recipientId').isUUID().withMessage('Valid recipient ID required'),
        (0, express_validator_1.body)('type').isIn(Object.values(entities_1.NotificationType)).withMessage('Valid notification type required'),
        (0, express_validator_1.body)('title').isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
        (0, express_validator_1.body)('message').isLength({ min: 1 }).withMessage('Message is required'),
        (0, express_validator_1.body)('priority').optional().isIn(Object.values(entities_1.NotificationPriority)),
        (0, express_validator_1.body)('channels').optional().isArray().custom((channels) => {
            return channels.every((channel) => Object.values(entities_1.NotificationChannel).includes(channel));
        }),
        (0, express_validator_1.body)('scheduledFor').optional().isISO8601(),
        (0, express_validator_1.body)('expiresAt').optional().isISO8601(),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const notification = await notificationService.createNotification({
                recipientId: req.body.recipientId,
                organizationId: req.user?.organizationId,
                teamId: req.body.teamId,
                type: req.body.type,
                title: req.body.title,
                message: req.body.message,
                priority: req.body.priority,
                actionUrl: req.body.actionUrl,
                actionText: req.body.actionText,
                relatedEntityId: req.body.relatedEntityId,
                relatedEntityType: req.body.relatedEntityType,
                channels: req.body.channels,
                scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
                expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
                metadata: req.body.metadata,
            });
            res.status(201).json(notification);
        }
        catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({ error: 'Failed to create notification' });
        }
    });
    /**
     * POST /notifications/bulk - Create bulk notifications
     */
    router.post('/bulk', [
        (0, express_validator_1.body)('recipientIds').isArray({ min: 1 }).withMessage('At least one recipient required'),
        (0, express_validator_1.body)('recipientIds.*').isUUID().withMessage('All recipient IDs must be valid UUIDs'),
        (0, express_validator_1.body)('type').isIn(Object.values(entities_1.NotificationType)).withMessage('Valid notification type required'),
        (0, express_validator_1.body)('title').isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
        (0, express_validator_1.body)('message').isLength({ min: 1 }).withMessage('Message is required'),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const notifications = await notificationService.createBulkNotifications(req.body.recipientIds, {
                organizationId: req.user?.organizationId,
                teamId: req.body.teamId,
                type: req.body.type,
                title: req.body.title,
                message: req.body.message,
                priority: req.body.priority,
                actionUrl: req.body.actionUrl,
                actionText: req.body.actionText,
                relatedEntityId: req.body.relatedEntityId,
                relatedEntityType: req.body.relatedEntityType,
                channels: req.body.channels,
                scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
                expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
                metadata: req.body.metadata,
            });
            res.status(201).json({
                message: `${notifications.length} notifications created`,
                count: notifications.length,
            });
        }
        catch (error) {
            console.error('Error creating bulk notifications:', error);
            res.status(500).json({ error: 'Failed to create bulk notifications' });
        }
    });
    /**
     * PUT /notifications/:id/read - Mark notification as read
     */
    router.put('/:id/read', [
        (0, express_validator_1.param)('id').isUUID().withMessage('Valid notification ID required'),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            await notificationService.markAsRead(req.params.id, userId);
            res.json({ message: 'Notification marked as read' });
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ error: 'Failed to mark notification as read' });
        }
    });
    /**
     * PUT /notifications/read-multiple - Mark multiple notifications as read
     */
    router.put('/read-multiple', [
        (0, express_validator_1.body)('notificationIds').isArray({ min: 1 }).withMessage('At least one notification ID required'),
        (0, express_validator_1.body)('notificationIds.*').isUUID().withMessage('All notification IDs must be valid UUIDs'),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            await notificationService.markMultipleAsRead(req.body.notificationIds, userId);
            res.json({
                message: `${req.body.notificationIds.length} notifications marked as read`,
                count: req.body.notificationIds.length
            });
        }
        catch (error) {
            console.error('Error marking multiple notifications as read:', error);
            res.status(500).json({ error: 'Failed to mark notifications as read' });
        }
    });
    /**
     * DELETE /notifications/:id - Delete notification
     */
    router.delete('/:id', [
        (0, express_validator_1.param)('id').isUUID().withMessage('Valid notification ID required'),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            await notificationService.deleteNotification(req.params.id, userId);
            res.json({ message: 'Notification deleted' });
        }
        catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({ error: 'Failed to delete notification' });
        }
    });
    /**
     * GET /notifications/preferences - Get user notification preferences
     */
    router.get('/preferences', async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const preferences = await notificationService.getUserPreferences(userId, req.user?.organizationId);
            res.json(preferences);
        }
        catch (error) {
            console.error('Error getting notification preferences:', error);
            res.status(500).json({ error: 'Failed to get notification preferences' });
        }
    });
    /**
     * PUT /notifications/preferences - Update user notification preferences
     */
    router.put('/preferences', [
        (0, express_validator_1.body)('preferences').isArray().withMessage('Preferences array required'),
        (0, express_validator_1.body)('preferences.*.type').isIn(Object.values(entities_1.NotificationType)),
        (0, express_validator_1.body)('preferences.*.channel').isIn(Object.values(entities_1.NotificationChannel)),
        (0, express_validator_1.body)('preferences.*.isEnabled').isBoolean(),
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            await notificationService.updateUserPreferences(userId, req.body.preferences, req.user?.organizationId);
            res.json({ message: 'Notification preferences updated' });
        }
        catch (error) {
            console.error('Error updating notification preferences:', error);
            res.status(500).json({ error: 'Failed to update notification preferences' });
        }
    });
    /**
     * GET /notifications/stats - Get notification statistics
     */
    router.get('/stats', async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const result = await notificationService.getNotifications({
                recipientId: userId,
                organizationId: req.user?.organizationId,
                limit: 1, // We only need the counts
            });
            res.json({
                totalNotifications: result.total,
                unreadCount: result.unreadCount,
                readCount: result.total - result.unreadCount,
            });
        }
        catch (error) {
            console.error('Error getting notification stats:', error);
            res.status(500).json({ error: 'Failed to get notification stats' });
        }
    });
    return router;
}
exports.createNotificationRoutes = createNotificationRoutes;
//# sourceMappingURL=notificationRoutes.js.map