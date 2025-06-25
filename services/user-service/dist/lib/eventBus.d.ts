import { NatsConnection } from 'nats';
export declare const getBus: () => Promise<NatsConnection>;
export declare const subscribe: (subject: string, handler: (data: any) => void) => Promise<void>;
export declare const busPublish: (topic: string, payload: any) => Promise<void>;
//# sourceMappingURL=eventBus.d.ts.map