"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventFactory = void 0;
const uuid_1 = require("uuid");
class EventFactory {
    constructor(options) {
        this.options = {
            version: '1.0.0',
            ...options
        };
    }
    /**
     * Create an event with metadata
     */
    createEvent(type, data, overrides) {
        const metadata = {
            eventId: (0, uuid_1.v4)(),
            timestamp: new Date(),
            source: this.options.source,
            version: this.options.version,
            userId: this.options.defaultUserId,
            organizationId: this.options.defaultOrganizationId,
            ...overrides
        };
        return {
            type,
            data,
            metadata
        };
    }
    /**
     * Create an event with correlation ID for tracing
     */
    createCorrelatedEvent(type, data, correlationId, overrides) {
        return this.createEvent(type, data, {
            correlationId,
            ...overrides
        });
    }
    /**
     * Update default user context
     */
    setUserContext(userId, organizationId) {
        if (userId !== undefined) {
            this.options.defaultUserId = userId;
        }
        if (organizationId !== undefined) {
            this.options.defaultOrganizationId = organizationId;
        }
    }
    /**
     * Clear user context
     */
    clearUserContext() {
        delete this.options.defaultUserId;
        delete this.options.defaultOrganizationId;
    }
}
exports.EventFactory = EventFactory;
//# sourceMappingURL=EventFactory.js.map