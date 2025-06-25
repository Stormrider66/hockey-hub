import { SpanKind } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';
export interface TracingConfig {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    jaegerEndpoint?: string;
    enabled?: boolean;
}
export declare class TracingManager {
    private config;
    private sdk;
    private tracer;
    private isInitialized;
    constructor(config: TracingConfig);
    private initialize;
    createSpan(name: string, options?: {
        kind?: SpanKind;
        attributes?: Record<string, any>;
    }): any;
    traceFunction<T>(name: string, fn: () => T | Promise<T>, attributes?: Record<string, any>): T | Promise<T>;
    traceMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    traceDatabaseOperation<T>(operation: string, table: string, query: string, fn: () => T | Promise<T>): T | Promise<T>;
    traceExternalCall<T>(serviceName: string, operation: string, fn: () => T | Promise<T>): T | Promise<T>;
    shutdown(): Promise<void>;
}
export declare function TraceMethod(operationName?: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare global {
    namespace Express {
        interface Request {
            span?: any;
        }
    }
}
