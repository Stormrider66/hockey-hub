import { SpanKind, Span } from '@opentelemetry/api';
import { Logger } from 'pino';
export interface TracingConfig {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    otlpEndpoint?: string;
    enabled?: boolean;
    logger: Logger;
}
/**
 * Initialize OpenTelemetry tracing
 */
export declare function initializeTracing(config: TracingConfig): void;
/**
 * Shutdown tracing gracefully
 */
export declare function shutdownTracing(): Promise<void>;
/**
 * Get the current tracer
 */
export declare function getTracer(name?: string): any;
/**
 * Create a new span
 */
export declare function createSpan(name: string, options?: {
    kind?: SpanKind;
    attributes?: Record<string, any>;
}): Span;
/**
 * Wrap a function with a span
 */
export declare function withSpan<T>(name: string, fn: (span: Span) => Promise<T>, options?: {
    kind?: SpanKind;
    attributes?: Record<string, any>;
}): Promise<T>;
/**
 * Add attributes to the current span
 */
export declare function addSpanAttributes(attributes: Record<string, any>): void;
/**
 * Add an event to the current span
 */
export declare function addSpanEvent(name: string, attributes?: Record<string, any>): void;
/**
 * Database operation tracing helper
 */
export declare function traceDatabaseOperation<T>(operation: string, query: string, fn: () => Promise<T>): Promise<T>;
/**
 * HTTP request tracing helper
 */
export declare function traceHttpRequest<T>(method: string, url: string, fn: () => Promise<T>): Promise<T>;
/**
 * Message queue operation tracing helper
 */
export declare function traceQueueOperation<T>(operation: 'publish' | 'consume', queueName: string, messageType: string, fn: () => Promise<T>): Promise<T>;
