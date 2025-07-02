export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeout?: number;
    requestTimeout?: number;
    successThreshold?: number;
    volumeThreshold?: number;
    errorFilter?: (error: any) => boolean;
}
export interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    successes: number;
    consecutiveSuccesses: number;
    lastFailureTime?: Date;
    nextAttemptTime?: Date;
    totalRequests: number;
}
export declare class CircuitBreaker<T = any> {
    private readonly name;
    private readonly action;
    private state;
    private failures;
    private successes;
    private consecutiveSuccesses;
    private lastFailureTime?;
    private nextAttemptTime?;
    private totalRequests;
    private readonly options;
    constructor(name: string, action: (...args: any[]) => Promise<T>, options?: CircuitBreakerOptions);
    execute(...args: any[]): Promise<T>;
    private callWithTimeout;
    private onSuccess;
    private onFailure;
    private open;
    private close;
    private halfOpen;
    private canAttemptReset;
    getStats(): CircuitBreakerStats;
    reset(): void;
}
/**
 * Circuit breaker factory for easy creation
 */
export declare class CircuitBreakerFactory {
    private static breakers;
    static create<T>(name: string, action: (...args: any[]) => Promise<T>, options?: CircuitBreakerOptions): CircuitBreaker<T>;
    static get(name: string): CircuitBreaker | undefined;
    static getAll(): Map<string, CircuitBreaker>;
    static reset(name?: string): void;
    static remove(name: string): boolean;
}
//# sourceMappingURL=CircuitBreaker.d.ts.map