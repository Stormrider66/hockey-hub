import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';
/**
 * Extended Express Request with monitoring properties
 */
export interface MonitoredRequest extends Request {
    correlationId?: string;
    startTime?: number;
    user?: {
        id: string;
        organizationId: string;
        role?: string;
    };
    log?: Logger;
}
/**
 * Async route handler type
 */
export type AsyncRouteHandler = (req: MonitoredRequest, res: Response, next: NextFunction) => Promise<any>;
/**
 * Monitoring configuration for services
 */
export interface MonitoringConfig {
    service: {
        name: string;
        version?: string;
        environment?: string;
    };
    logging: {
        level?: string;
        pretty?: boolean;
        redactPaths?: string[];
    };
    tracing?: {
        enabled?: boolean;
        endpoint?: string;
        sampleRate?: number;
    };
    metrics?: {
        enabled?: boolean;
        port?: number;
        path?: string;
        defaultLabels?: Record<string, string>;
    };
    healthCheck?: {
        enabled?: boolean;
        path?: string;
        timeout?: number;
    };
}
/**
 * Performance timing information
 */
export interface PerformanceTiming {
    startTime: number;
    endTime?: number;
    duration?: number;
    operation: string;
    metadata?: Record<string, any>;
}
/**
 * Circuit breaker state
 */
export declare enum CircuitBreakerState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open"
}
/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    fallback?: (...args: any[]) => any;
}
/**
 * Database query info for logging
 */
export interface DatabaseQueryInfo {
    query: string;
    parameters?: any[];
    duration: number;
    rowCount?: number;
    error?: Error;
}
/**
 * External service call info
 */
export interface ExternalServiceCallInfo {
    service: string;
    method: string;
    url: string;
    duration: number;
    statusCode?: number;
    error?: Error;
}
