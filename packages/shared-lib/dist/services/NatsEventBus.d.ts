import { EventBus, EventBusConfig, EventSubscription, EventHandler } from './EventBus';
export interface NatsEventBusConfig extends EventBusConfig {
    servers: string[];
    user?: string;
    pass?: string;
    token?: string;
}
export declare class NatsEventBus extends EventBus {
    private connection?;
    private codec;
    private natsSubscriptions;
    private config;
    constructor(config: NatsEventBusConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish<T>(eventType: string, data: T, metadata?: Record<string, any>): Promise<void>;
    subscribe(subscription: EventSubscription): Promise<void>;
    unsubscribe(eventType: string, handler: EventHandler): Promise<void>;
    private eventTypeToSubject;
    request<TRequest, TResponse>(subject: string, data: TRequest, timeout?: number): Promise<TResponse>;
    respondTo<TRequest, TResponse>(subject: string, handler: (request: TRequest) => Promise<TResponse>): Promise<void>;
}
//# sourceMappingURL=NatsEventBus.d.ts.map