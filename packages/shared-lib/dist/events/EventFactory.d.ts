import { BaseEvent, EventMetadata } from './EventBus';
export interface EventFactoryOptions {
    source: string;
    version?: string;
    defaultUserId?: string;
    defaultOrganizationId?: string;
}
export declare class EventFactory {
    private options;
    constructor(options: EventFactoryOptions);
    /**
     * Create an event with metadata
     */
    createEvent<T>(type: string, data: T, overrides?: Partial<EventMetadata>): BaseEvent<T>;
    /**
     * Create an event with correlation ID for tracing
     */
    createCorrelatedEvent<T>(type: string, data: T, correlationId: string, overrides?: Partial<EventMetadata>): BaseEvent<T>;
    /**
     * Update default user context
     */
    setUserContext(userId?: string, organizationId?: string): void;
    /**
     * Clear user context
     */
    clearUserContext(): void;
}
//# sourceMappingURL=EventFactory.d.ts.map