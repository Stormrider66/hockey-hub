import { EventBus, BaseEvent, EventMetadata } from './EventBus';
import { EventFactory } from './EventFactory';
import { Logger } from '../utils/Logger';
export interface EventPublisherOptions {
    eventBus: EventBus;
    eventFactory: EventFactory;
    enableRetry?: boolean;
    retryAttempts?: number;
    retryDelay?: number;
}
export declare class EventPublisher {
    protected eventBus: EventBus;
    protected eventFactory: EventFactory;
    protected logger: Logger;
    private options;
    constructor(options: EventPublisherOptions);
    /**
     * Publish an event with retry logic
     */
    protected publish<T>(eventType: string, data: T, metadata?: Partial<EventMetadata>): Promise<void>;
    /**
     * Publish an event with correlation ID
     */
    protected publishCorrelated<T>(eventType: string, data: T, correlationId: string, metadata?: Partial<EventMetadata>): Promise<void>;
    /**
     * Publish multiple events in order
     */
    protected publishBatch(events: BaseEvent[]): Promise<void>;
    /**
     * Publish event once without retry
     */
    private publishOnce;
    /**
     * Publish event with retry logic
     */
    private publishWithRetry;
    /**
     * Delay helper
     */
    private delay;
}
//# sourceMappingURL=EventPublisher.d.ts.map