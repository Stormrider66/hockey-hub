/// <reference types="node" />
export declare const setupMonitoring: () => {
    logger: Console;
    healthCheckManager: {};
    performanceMonitor: {};
    circuitBreakerManager: {};
    metricsCollector: null;
    tracingManager: null;
    businessMetrics: null;
    shutdown: () => Promise<void>;
};
export declare const setupSimpleMonitoring: () => {
    logger: Console;
    healthCheckManager: {};
    performanceMonitor: {};
    circuitBreakerManager: {};
    metricsCollector: null;
    tracingManager: null;
    businessMetrics: null;
    shutdown: () => Promise<void>;
};
export declare const asyncHandler: (fn: Function) => Function;
export declare const createErrorContext: () => {};
export declare const Performance: () => () => void;
export declare const TraceMethod: () => () => void;
export declare const CircuitBreakerProtection: () => () => void;
export declare class HealthCheckManager {
    static createDatabaseCheck: () => {};
    static createExternalServiceCheck: () => {};
    static createCustomCheck: () => {};
}
export declare class AppError extends Error {
}
export declare class ValidationError extends AppError {
}
export declare class NotFoundError extends AppError {
}
export declare class UnauthorizedError extends AppError {
}
export declare class ForbiddenError extends AppError {
}
export declare class ConflictError extends AppError {
}
export declare class ExternalServiceError extends AppError {
}
export declare class DatabaseError extends AppError {
}
export * from './types';
