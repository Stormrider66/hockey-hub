"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircuitBreaker = exports.CircuitBreaker = void 0;
class CircuitBreaker {
    constructor(fn, options = {}, logger) {
        this.fn = fn;
        this.logger = logger;
        this.options = {
            timeout: options.timeout || 10000,
            errorThresholdPercentage: options.errorThresholdPercentage || 50,
            resetTimeout: options.resetTimeout || 30000,
            rollingCountTimeout: options.rollingCountTimeout || 10000,
            rollingCountBuckets: options.rollingCountBuckets || 10,
            name: options.name || 'CircuitBreaker',
            fallback: options.fallback,
        };
        this.stats = {
            failures: 0,
            successes: 0,
            rejections: 0,
            state: types_1.CircuitBreakerState.CLOSED,
        };
    }
    async fire(...args) {
        if (this.stats.state === types_1.CircuitBreakerState.OPEN) {
            this.stats.rejections++;
            if (this.options.fallback) {
                this.logger?.debug({ name: this.options.name }, 'Circuit breaker open, using fallback');
                return this.options.fallback(...args);
            }
            const error = new Error(`Circuit breaker is OPEN for ${this.options.name}`);
            error.code = 'CIRCUIT_BREAKER_OPEN';
            throw error;
        }
        try {
            const result = await Promise.race([
                this.fn(...args),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Circuit breaker timeout')), this.options.timeout)),
            ]);
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.stats.successes++;
        if (this.stats.state === types_1.CircuitBreakerState.HALF_OPEN) {
            this.logger?.info({ name: this.options.name }, 'Circuit breaker closing after successful test');
            this.close();
        }
    }
    onFailure() {
        this.stats.failures++;
        this.stats.lastFailureTime = Date.now();
        const total = this.stats.failures + this.stats.successes;
        const failureRate = (this.stats.failures / total) * 100;
        if (this.stats.state === types_1.CircuitBreakerState.CLOSED &&
            total >= 5 && // Minimum number of requests before opening
            failureRate >= this.options.errorThresholdPercentage) {
            this.open();
        }
        else if (this.stats.state === types_1.CircuitBreakerState.HALF_OPEN) {
            this.open();
        }
    }
    open() {
        this.stats.state = types_1.CircuitBreakerState.OPEN;
        this.logger?.warn({
            name: this.options.name,
            failures: this.stats.failures,
            successes: this.stats.successes,
        }, 'Circuit breaker opened');
        // Schedule transition to half-open
        if (this.halfOpenTimer) {
            clearTimeout(this.halfOpenTimer);
        }
        this.halfOpenTimer = setTimeout(() => {
            this.halfOpen();
        }, this.options.resetTimeout);
    }
    halfOpen() {
        this.stats.state = types_1.CircuitBreakerState.HALF_OPEN;
        this.logger?.info({ name: this.options.name }, 'Circuit breaker half-open, testing');
        // Reset stats for testing
        this.stats.failures = 0;
        this.stats.successes = 0;
    }
    close() {
        this.stats.state = types_1.CircuitBreakerState.CLOSED;
        this.stats.failures = 0;
        this.stats.successes = 0;
        this.stats.rejections = 0;
        if (this.halfOpenTimer) {
            clearTimeout(this.halfOpenTimer);
            this.halfOpenTimer = undefined;
        }
    }
    getState() {
        return this.stats.state;
    }
    getStats() {
        return { ...this.stats };
    }
    reset() {
        this.close();
        this.logger?.info({ name: this.options.name }, 'Circuit breaker manually reset');
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Create a circuit breaker wrapped function
 */
function createCircuitBreaker(fn, options, logger) {
    const breaker = new CircuitBreaker(fn, options, logger);
    return ((...args) => breaker.fire(...args));
}
exports.createCircuitBreaker = createCircuitBreaker;
