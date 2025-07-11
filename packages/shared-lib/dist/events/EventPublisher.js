"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPublisher = void 0;
const logger_1 = require("../utils/logger");
class EventPublisher {
    constructor(options) {
        this.options = {
            enableRetry: true,
            retryAttempts: 3,
            retryDelay: 1000,
            ...options
        };
        this.eventBus = options.eventBus;
        this.eventFactory = options.eventFactory;
        this.logger = new logger_1.Logger(this.constructor.name);
    }
    /**
     * Publish an event with retry logic
     */
    async publish(eventType, data, metadata) {
        const event = this.eventFactory.createEvent(eventType, data, metadata);
        if (this.options.enableRetry) {
            await this.publishWithRetry(event);
        }
        else {
            await this.publishOnce(event);
        }
    }
    /**
     * Publish an event with correlation ID
     */
    async publishCorrelated(eventType, data, correlationId, metadata) {
        const event = this.eventFactory.createCorrelatedEvent(eventType, data, correlationId, metadata);
        if (this.options.enableRetry) {
            await this.publishWithRetry(event);
        }
        else {
            await this.publishOnce(event);
        }
    }
    /**
     * Publish multiple events in order
     */
    async publishBatch(events) {
        for (const event of events) {
            if (this.options.enableRetry) {
                await this.publishWithRetry(event);
            }
            else {
                await this.publishOnce(event);
            }
        }
    }
    /**
     * Publish event once without retry
     */
    async publishOnce(event) {
        try {
            await this.eventBus.emit(event);
            this.logger.info(`Event published: ${event.type}`, {
                eventId: event.metadata.eventId,
                correlationId: event.metadata.correlationId
            });
        }
        catch (error) {
            this.logger.error(`Failed to publish event: ${event.type}`, error, {
                eventId: event.metadata.eventId
            });
            throw error;
        }
    }
    /**
     * Publish event with retry logic
     */
    async publishWithRetry(event) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
            try {
                await this.eventBus.emit(event);
                this.logger.info(`Event published: ${event.type}`, {
                    eventId: event.metadata.eventId,
                    correlationId: event.metadata.correlationId,
                    attempt
                });
                return;
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Failed to publish event ${event.type}, attempt ${attempt}/${this.options.retryAttempts}`, {
                    eventId: event.metadata.eventId,
                    error: error instanceof Error ? error.message : String(error)
                });
                if (attempt < this.options.retryAttempts) {
                    await this.delay(this.options.retryDelay * attempt);
                }
            }
        }
        // All retries failed
        this.logger.error(`Failed to publish event after ${this.options.retryAttempts} attempts: ${event.type}`, lastError, {
            eventId: event.metadata.eventId
        });
        throw lastError;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.EventPublisher = EventPublisher;
//# sourceMappingURL=EventPublisher.js.map