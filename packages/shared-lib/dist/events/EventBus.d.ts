export interface EventMetadata {
    eventId: string;
    timestamp: Date;
    correlationId?: string;
    userId?: string;
    organizationId?: string;
    source: string;
    version: string;
}
export interface BaseEvent<T = any> {
    type: string;
    data: T;
    metadata: EventMetadata;
}
export type EventHandler<T = any> = (event: BaseEvent<T>) => void | Promise<void>;
export interface EventBusOptions {
    enableLogging?: boolean;
    asyncMode?: boolean;
    maxListeners?: number;
}
export declare class EventBus {
    private emitter;
    private logger;
    private options;
    private handlers;
    constructor(options?: EventBusOptions);
    /**
     * Subscribe to an event
     */
    on<T = any>(eventType: string, handler: EventHandler<T>): () => void;
    /**
     * Subscribe to an event (one-time)
     */
    once<T = any>(eventType: string, handler: EventHandler<T>): void;
    /**
     * Emit an event
     */
    emit<T = any>(event: BaseEvent<T>): Promise<void>;
    /**
     * Remove all listeners for an event type
     */
    removeAllListeners(eventType?: string): void;
    /**
     * Get the number of listeners for an event type
     */
    listenerCount(eventType: string): number;
    /**
     * Get all registered event types
     */
    getEventTypes(): string[];
}
export declare function getGlobalEventBus(options?: EventBusOptions): EventBus;
//# sourceMappingURL=EventBus.d.ts.map