import { EventEnvelope } from '../dto';
export type EventHandler<T = any> = (event: EventEnvelope<T>) => Promise<void>;
export interface EventBusConfig {
    serviceName: string;
    serviceVersion: string;
}
export interface EventSubscription {
    eventType: string;
    handler: EventHandler;
    filter?: (event: EventEnvelope) => boolean;
}
export declare abstract class EventBus {
    protected serviceName: string;
    protected serviceVersion: string;
    protected subscriptions: Map<string, EventSubscription[]>;
    constructor(config: EventBusConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract publish<T>(eventType: string, data: T, metadata?: Record<string, any>): Promise<void>;
    abstract subscribe(subscription: EventSubscription): Promise<void>;
    abstract unsubscribe(eventType: string, handler: EventHandler): Promise<void>;
    protected createEventEnvelope<T>(eventType: string, data: T, metadata?: Record<string, any>): EventEnvelope<T>;
    private generateEventId;
    protected handleEvent(event: EventEnvelope): Promise<void>;
    publishBatch(events: Array<{
        type: string;
        data: any;
        metadata?: Record<string, any>;
    }>): Promise<void>;
    subscribeMultiple(eventTypes: string[], handler: EventHandler, filter?: (event: EventEnvelope) => boolean): Promise<void>;
}
export declare const UserEvents: {
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
    readonly USER_ROLE_CHANGED: "user.role.changed";
    readonly USER_ACTIVATED: "user.activated";
    readonly USER_DEACTIVATED: "user.deactivated";
};
export declare const OrganizationEvents: {
    readonly ORGANIZATION_CREATED: "organization.created";
    readonly ORGANIZATION_UPDATED: "organization.updated";
    readonly ORGANIZATION_DELETED: "organization.deleted";
    readonly SUBSCRIPTION_CHANGED: "organization.subscription.changed";
};
export declare const TeamEvents: {
    readonly TEAM_CREATED: "team.created";
    readonly TEAM_UPDATED: "team.updated";
    readonly TEAM_DELETED: "team.deleted";
    readonly TEAM_MEMBER_ADDED: "team.member.added";
    readonly TEAM_MEMBER_REMOVED: "team.member.removed";
    readonly TEAM_MEMBER_ROLE_CHANGED: "team.member.role.changed";
};
export declare const TrainingEvents: {
    readonly WORKOUT_CREATED: "training.workout.created";
    readonly WORKOUT_STARTED: "training.workout.started";
    readonly WORKOUT_COMPLETED: "training.workout.completed";
    readonly WORKOUT_CANCELLED: "training.workout.cancelled";
    readonly EXERCISE_COMPLETED: "training.exercise.completed";
};
export declare const MedicalEvents: {
    readonly INJURY_REPORTED: "medical.injury.reported";
    readonly INJURY_UPDATED: "medical.injury.updated";
    readonly TREATMENT_SCHEDULED: "medical.treatment.scheduled";
    readonly PLAYER_STATUS_CHANGED: "medical.player.status.changed";
};
//# sourceMappingURL=EventBus.d.ts.map