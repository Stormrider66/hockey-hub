import { CircuitBreakerConfig, CircuitBreakerState } from './types';
import pino from 'pino';
export declare class CircuitBreaker {
    private name;
    private config;
    private logger;
    private state;
    private successCount;
    constructor(name: string, config: CircuitBreakerConfig, logger: pino.Logger);
    execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldAttemptReset;
    getState(): CircuitBreakerState;
    getMetrics(): {
        name: string;
        state: "CLOSED" | "OPEN" | "HALF_OPEN";
        failureCount: number;
        successCount: number;
        config: CircuitBreakerConfig;
        lastFailureTime: string | null;
        nextAttempt: string | null;
    };
    forceOpen(): void;
    forceClose(): void;
}
export declare class CircuitBreakerManager {
    private logger;
    private circuitBreakers;
    constructor(logger: pino.Logger);
    getCircuitBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker;
    executeWithBreaker<T>(breakerName: string, fn: () => Promise<T>, fallback?: () => Promise<T>, config?: CircuitBreakerConfig): Promise<T>;
    getAllMetrics(): Record<string, any>;
    getHealthStatus(): {
        healthy: boolean;
        totalBreakers: number;
        openBreakers: string[];
        halfOpenBreakers: string[];
        closedBreakers: number;
    };
    createCircuitBreakerDecorator(breakerName: string, config?: CircuitBreakerConfig, fallback?: () => any): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
}
export declare function CircuitBreakerProtection(breakerName: string, config?: CircuitBreakerConfig): (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
