"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalEventBus = exports.EventBus = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class EventBus {
    constructor(options = {}) {
        this.options = {
            enableLogging: true,
            asyncMode: true,
            maxListeners: 100,
            ...options
        };
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(this.options.maxListeners);
        this.logger = new logger_1.Logger('EventBus');
        this.handlers = new Map();
    }
    /**
     * Subscribe to an event
     */
    on(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
        const wrappedHandler = async (event) => {
            try {
                if (this.options.enableLogging) {
                    this.logger.debug(`Processing event: ${eventType}`, {
                        eventId: event.metadata.eventId,
                        correlationId: event.metadata.correlationId
                    });
                }
                if (this.options.asyncMode) {
                    await handler(event);
                }
                else {
                    handler(event);
                }
            }
            catch (error) {
                this.logger.error(`Error handling event ${eventType}:`, error, {
                    eventId: event.metadata.eventId
                });
                // Re-throw in sync mode
                if (!this.options.asyncMode) {
                    throw error;
                }
            }
        };
        this.emitter.on(eventType, wrappedHandler);
        // Return unsubscribe function
        return () => {
            this.handlers.get(eventType)?.delete(handler);
            this.emitter.removeListener(eventType, wrappedHandler);
        };
    }
    /**
     * Subscribe to an event (one-time)
     */
    once(eventType, handler) {
        const wrappedHandler = async (event) => {
            try {
                if (this.options.enableLogging) {
                    this.logger.debug(`Processing one-time event: ${eventType}`, {
                        eventId: event.metadata.eventId
                    });
                }
                if (this.options.asyncMode) {
                    await handler(event);
                }
                else {
                    handler(event);
                }
            }
            catch (error) {
                this.logger.error(`Error handling one-time event ${eventType}:`, error);
                if (!this.options.asyncMode) {
                    throw error;
                }
            }
        };
        this.emitter.once(eventType, wrappedHandler);
    }
    /**
     * Emit an event
     */
    async emit(event) {
        if (this.options.enableLogging) {
            this.logger.info(`Emitting event: ${event.type}`, {
                eventId: event.metadata.eventId,
                correlationId: event.metadata.correlationId,
                data: event.data
            });
        }
        if (this.options.asyncMode) {
            // In async mode, emit and wait for all handlers
            const listeners = this.emitter.listeners(event.type);
            await Promise.all(listeners.map(listener => Promise.resolve(listener(event)).catch(error => {
                this.logger.error(`Async handler error for ${event.type}:`, error);
            })));
        }
        else {
            // In sync mode, emit directly
            this.emitter.emit(event.type, event);
        }
    }
    /**
     * Remove all listeners for an event type
     */
    removeAllListeners(eventType) {
        if (eventType) {
            this.handlers.delete(eventType);
            this.emitter.removeAllListeners(eventType);
        }
        else {
            this.handlers.clear();
            this.emitter.removeAllListeners();
        }
    }
    /**
     * Get the number of listeners for an event type
     */
    listenerCount(eventType) {
        return this.emitter.listenerCount(eventType);
    }
    /**
     * Get all registered event types
     */
    getEventTypes() {
        return Array.from(this.handlers.keys());
    }
}
exports.EventBus = EventBus;
// Singleton instance for application-wide event bus
let globalEventBus = null;
function getGlobalEventBus(options) {
    if (!globalEventBus) {
        globalEventBus = new EventBus(options);
    }
    return globalEventBus;
}
exports.getGlobalEventBus = getGlobalEventBus;
//# sourceMappingURL=EventBus.js.map