"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalEvents = exports.TrainingEvents = exports.TeamEvents = exports.OrganizationEvents = exports.UserEvents = exports.EventBus = void 0;
class EventBus {
    constructor(config) {
        this.subscriptions = new Map();
        this.serviceName = config.serviceName;
        this.serviceVersion = config.serviceVersion;
    }
    // Helper method to create event envelope
    createEventEnvelope(eventType, data, metadata) {
        return {
            id: this.generateEventId(),
            type: eventType,
            source: `${this.serviceName}:${this.serviceVersion}`,
            timestamp: new Date().toISOString(),
            metadata,
            data,
        };
    }
    generateEventId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // Helper method to handle incoming events
    async handleEvent(event) {
        const handlers = this.subscriptions.get(event.type) || [];
        for (const subscription of handlers) {
            if (!subscription.filter || subscription.filter(event)) {
                try {
                    await subscription.handler(event);
                }
                catch (error) {
                    console.error(`Error handling event ${event.type}:`, error);
                    // Could implement dead letter queue here
                }
            }
        }
    }
    // Batch publish multiple events
    async publishBatch(events) {
        for (const event of events) {
            await this.publish(event.type, event.data, event.metadata);
        }
    }
    // Subscribe to multiple event types with the same handler
    async subscribeMultiple(eventTypes, handler, filter) {
        for (const eventType of eventTypes) {
            await this.subscribe({ eventType, handler, filter });
        }
    }
}
exports.EventBus = EventBus;
// Event type constants
exports.UserEvents = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_ROLE_CHANGED: 'user.role.changed',
    USER_ACTIVATED: 'user.activated',
    USER_DEACTIVATED: 'user.deactivated',
};
exports.OrganizationEvents = {
    ORGANIZATION_CREATED: 'organization.created',
    ORGANIZATION_UPDATED: 'organization.updated',
    ORGANIZATION_DELETED: 'organization.deleted',
    SUBSCRIPTION_CHANGED: 'organization.subscription.changed',
};
exports.TeamEvents = {
    TEAM_CREATED: 'team.created',
    TEAM_UPDATED: 'team.updated',
    TEAM_DELETED: 'team.deleted',
    TEAM_MEMBER_ADDED: 'team.member.added',
    TEAM_MEMBER_REMOVED: 'team.member.removed',
    TEAM_MEMBER_ROLE_CHANGED: 'team.member.role.changed',
};
exports.TrainingEvents = {
    WORKOUT_CREATED: 'training.workout.created',
    WORKOUT_STARTED: 'training.workout.started',
    WORKOUT_COMPLETED: 'training.workout.completed',
    WORKOUT_CANCELLED: 'training.workout.cancelled',
    EXERCISE_COMPLETED: 'training.exercise.completed',
};
exports.MedicalEvents = {
    INJURY_REPORTED: 'medical.injury.reported',
    INJURY_UPDATED: 'medical.injury.updated',
    TREATMENT_SCHEDULED: 'medical.treatment.scheduled',
    PLAYER_STATUS_CHANGED: 'medical.player.status.changed',
};
//# sourceMappingURL=EventBus.js.map