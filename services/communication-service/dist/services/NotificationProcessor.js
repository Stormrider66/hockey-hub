"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const typeorm_1 = require("typeorm");
const entities_1 = require("../entities");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class NotificationProcessor {
    constructor(dataSource, emailService, socketIO, config = {}) {
        this.isProcessing = false;
        this.queueRepository = dataSource.getRepository(entities_1.NotificationQueue);
        this.notificationRepository = dataSource.getRepository(entities_1.Notification);
        this.templateRepository = dataSource.getRepository(entities_1.NotificationTemplate);
        this.emailService = emailService;
        this.socketIO = socketIO;
        this.logger = new shared_lib_1.Logger('NotificationProcessor');
        this.config = {
            batchSize: 10,
            processingInterval: 5000, // 5 seconds
            maxRetries: 3,
            retryDelay: 60000, // 1 minute
            ...config,
        };
    }
    /**
     * Start the notification processor
     */
    start() {
        if (this.isProcessing) {
            this.logger.warn('Notification processor already running');
            return;
        }
        this.isProcessing = true;
        this.processingInterval = setInterval(() => this.processQueue(), this.config.processingInterval);
        this.logger.info('Notification processor started', {
            batchSize: this.config.batchSize,
            interval: this.config.processingInterval
        });
    }
    /**
     * Stop the notification processor
     */
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = undefined;
        }
        this.isProcessing = false;
        this.logger.info('Notification processor stopped');
    }
    /**
     * Process the notification queue
     */
    async processQueue() {
        try {
            // Get pending notifications that are ready to be sent
            const pendingNotifications = await this.queueRepository.find({
                where: [
                    {
                        status: entities_1.QueueStatus.PENDING,
                        scheduled_for: (0, typeorm_1.LessThanOrEqual)(new Date()),
                    },
                    {
                        status: entities_1.QueueStatus.FAILED,
                        next_attempt_at: (0, typeorm_1.LessThanOrEqual)(new Date()),
                    },
                ],
                order: {
                    priority: 'DESC',
                    scheduled_for: 'ASC',
                },
                take: this.config.batchSize,
            });
            if (pendingNotifications.length === 0) {
                return;
            }
            this.logger.debug('Processing notification queue', {
                count: pendingNotifications.length
            });
            // Process each notification
            await Promise.all(pendingNotifications.map(queueItem => this.processNotification(queueItem)));
        }
        catch (error) {
            this.logger.error('Error processing notification queue', error);
        }
    }
    /**
     * Process a single notification queue item
     */
    async processNotification(queueItem) {
        try {
            // Mark as processing
            await this.queueRepository.update(queueItem.id, {
                status: entities_1.QueueStatus.PROCESSING,
                started_at: new Date(),
                attempt_count: queueItem.attempt_count + 1,
            });
            // Get the full notification
            const notification = await this.notificationRepository.findOne({
                where: { id: queueItem.notification_id },
            });
            if (!notification) {
                await this.markQueueItemFailed(queueItem, 'Notification not found');
                return;
            }
            // Process based on channel
            switch (queueItem.channel) {
                case entities_1.NotificationChannel.EMAIL:
                    await this.processEmailNotification(queueItem, notification);
                    break;
                case entities_1.NotificationChannel.IN_APP:
                    await this.processInAppNotification(queueItem, notification);
                    break;
                case entities_1.NotificationChannel.SMS:
                    await this.processSMSNotification(queueItem, notification);
                    break;
                case entities_1.NotificationChannel.PUSH:
                    await this.processPushNotification(queueItem, notification);
                    break;
                default:
                    throw new Error(`Unsupported notification channel: ${queueItem.channel}`);
            }
            // Mark as completed
            await this.queueRepository.update(queueItem.id, {
                status: entities_1.QueueStatus.COMPLETED,
                completed_at: new Date(),
            });
            // Update notification status
            await this.updateNotificationStatus(notification.id, entities_1.NotificationStatus.SENT);
            this.logger.info('Notification processed successfully', {
                notificationId: notification.id,
                channel: queueItem.channel,
                attemptCount: queueItem.attempt_count + 1
            });
        }
        catch (error) {
            await this.handleProcessingError(queueItem, error);
        }
    }
    /**
     * Process email notification
     */
    async processEmailNotification(queueItem, notification) {
        // Get email template if exists
        const template = await this.templateRepository.findOne({
            where: {
                type: notification.type,
                channel: entities_1.NotificationChannel.EMAIL,
                organization_id: notification.organization_id || undefined,
                is_active: true,
            },
        });
        // Prepare email data
        const templateData = {
            title: notification.title,
            message: notification.message,
            actionUrl: notification.action_url,
            actionText: notification.action_text,
            recipientId: notification.recipient_id,
            organizationId: notification.organization_id,
            ...notification.metadata,
        };
        // Get recipient email (would normally fetch from user service)
        const recipientEmail = await this.getRecipientEmail(notification.recipient_id);
        await this.emailService.sendEmail({
            to: recipientEmail,
            subject: template ? template.subject_template : notification.title,
            text: notification.message,
            template,
            templateData,
            priority: notification.priority === 'urgent' ? 'high' : 'normal',
        });
    }
    /**
     * Process in-app notification
     */
    async processInAppNotification(queueItem, notification) {
        if (!this.socketIO) {
            throw new Error('Socket.IO not configured for in-app notifications');
        }
        // Send real-time notification via WebSocket
        this.socketIO.to(`user:${notification.recipient_id}`).emit('notification', {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            actionUrl: notification.action_url,
            actionText: notification.action_text,
            createdAt: notification.created_at,
            metadata: notification.metadata,
        });
        this.logger.debug('In-app notification sent', {
            notificationId: notification.id,
            recipientId: notification.recipient_id
        });
    }
    /**
     * Process SMS notification (placeholder)
     */
    async processSMSNotification(queueItem, notification) {
        // TODO: Implement SMS service (Twilio, AWS SNS, etc.)
        this.logger.warn('SMS notifications not implemented yet', {
            notificationId: notification.id
        });
        throw new Error('SMS notifications not implemented');
    }
    /**
     * Process push notification (placeholder)
     */
    async processPushNotification(queueItem, notification) {
        // TODO: Implement push notification service (FCM, APNs, etc.)
        this.logger.warn('Push notifications not implemented yet', {
            notificationId: notification.id
        });
        throw new Error('Push notifications not implemented');
    }
    /**
     * Handle processing errors and retry logic
     */
    async handleProcessingError(queueItem, error) {
        const attemptCount = queueItem.attempt_count + 1;
        const maxRetries = queueItem.max_attempts || this.config.maxRetries;
        this.logger.error('Notification processing failed', {
            queueItemId: queueItem.id,
            notificationId: queueItem.notification_id,
            channel: queueItem.channel,
            attemptCount,
            maxRetries,
            error: error.message
        });
        if (attemptCount >= maxRetries) {
            await this.markQueueItemFailed(queueItem, error.message);
            await this.updateNotificationStatus(queueItem.notification_id, entities_1.NotificationStatus.FAILED);
        }
        else {
            // Schedule retry
            const nextAttempt = new Date();
            nextAttempt.setMilliseconds(nextAttempt.getMilliseconds() + (this.config.retryDelay * attemptCount));
            await this.queueRepository.update(queueItem.id, {
                status: entities_1.QueueStatus.FAILED,
                next_attempt_at: nextAttempt,
                error_message: error.message,
            });
        }
    }
    /**
     * Mark queue item as permanently failed
     */
    async markQueueItemFailed(queueItem, errorMessage) {
        await this.queueRepository.update(queueItem.id, {
            status: entities_1.QueueStatus.FAILED,
            completed_at: new Date(),
            error_message: errorMessage,
        });
    }
    /**
     * Update notification status
     */
    async updateNotificationStatus(notificationId, status) {
        const updateData = { status };
        if (status === entities_1.NotificationStatus.SENT) {
            updateData.sent_at = new Date();
        }
        await this.notificationRepository.update(notificationId, updateData);
    }
    /**
     * Get recipient email address (mock implementation)
     */
    async getRecipientEmail(userId) {
        // TODO: Integrate with user service to get actual email
        // For now, return a mock email
        return `user-${userId}@example.com`;
    }
    /**
     * Clean up old queue items
     */
    async cleanupOldQueueItems(daysToKeep = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const result = await this.queueRepository.delete({
                status: (0, typeorm_1.In)([entities_1.QueueStatus.COMPLETED, entities_1.QueueStatus.FAILED]),
                completed_at: (0, typeorm_1.LessThanOrEqual)(cutoffDate),
            });
            this.logger.info('Old queue items cleaned up', {
                deleted: result.affected,
                daysToKeep
            });
        }
        catch (error) {
            this.logger.error('Failed to cleanup old queue items', error);
            throw error;
        }
    }
}
exports.NotificationProcessor = NotificationProcessor;
//# sourceMappingURL=NotificationProcessor.js.map