import { Request, Response, NextFunction } from 'express';
export interface MonitoringConfig {
    service: {
        name: string;
        version?: string;
        environment?: string;
    };
    logging: {
        level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
        redactionPaths?: string[];
    };
    tracing: {
        enabled: boolean;
        jaegerEndpoint?: string;
        serviceName?: string;
    };
    metrics: {
        enabled: boolean;
        prefix?: string;
        collectDefaultMetrics?: boolean;
    };
    healthCheck: {
        enabled: boolean;
        path?: string;
        checks?: HealthCheck[];
    };
}
export interface HealthCheck {
    name: string;
    check: () => Promise<HealthCheckResult>;
    timeout?: number;
    critical?: boolean;
}
export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    details?: Record<string, any>;
    error?: string;
}
export interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: Record<string, HealthCheckResult>;
}
export interface ErrorContext {
    correlationId?: string;
    userId?: string;
    organizationId?: string;
    path?: string;
    method?: string;
    service?: string;
    operation?: string;
    metadata?: Record<string, any>;
}
export interface PerformanceContext {
    operation: string;
    startTime: number;
    metadata?: Record<string, any>;
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
}
export interface CircuitBreakerState {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime?: number;
    nextAttempt?: number;
}
export type ErrorHandler = (req: Request, res: Response, next: NextFunction) => void;
export type AsyncHandler<T = any> = (req: Request, res: Response, next: NextFunction) => Promise<T>;
