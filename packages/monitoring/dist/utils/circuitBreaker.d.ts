import { Logger } from 'pino';
import { CircuitBreakerOptions, CircuitBreakerState } from '../types';
export { CircuitBreakerState };
interface CircuitBreakerStats {
    failures: number;
    successes: number;
    rejections: number;
    lastFailureTime?: number;
    state: CircuitBreakerState;
}
export declare class CircuitBreaker<T extends (...args: any[]) => Promise<any>> {
    private readonly fn;
    private readonly options;
    private stats;
    private readonly logger?;
    private halfOpenTimer?;
    constructor(fn: T, options?: CircuitBreakerOptions, logger?: Logger);
    fire(...args: Parameters<T>): Promise<ReturnType<T>>;
    private onSuccess;
    private onFailure;
    private open;
    private halfOpen;
    private close;
    getState(): CircuitBreakerState;
    getStats(): Readonly<CircuitBreakerStats>;
    reset(): void;
}
/**
 * Create a circuit breaker wrapped function
 */
export declare function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CircuitBreakerOptions, logger?: Logger): T;
