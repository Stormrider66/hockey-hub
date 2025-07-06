"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerFactory = exports.CircuitBreaker = exports.CircuitState = void 0;
const ApplicationErrors_1 = require("../errors/ApplicationErrors");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    constructor(name, action, options) {
        this.name = name;
        this.action = action;
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.consecutiveSuccesses = 0;
        this.totalRequests = 0;
        this.options = {
            failureThreshold: 5,
            resetTimeout: 60000, // 1 minute
            requestTimeout: 3000, // 3 seconds
            successThreshold: 2,
            volumeThreshold: 10,
            errorFilter: () => true
        };
        this.options = { ...this.options, ...options };
    }
    async execute(...args) {
        if (this.state === CircuitState.OPEN) {
            if (this.canAttemptReset()) {
                this.halfOpen();
            }
            else {
                throw new ApplicationErrors_1.ExternalServiceError(this.name, 'Circuit breaker is open', undefined, {
                    state: this.state,
                    nextAttemptTime: this.nextAttemptTime
                });
            }
        }
        try {
            const result = await this.callWithTimeout(this.action(...args));
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure(error);
            throw error;
        }
    }
    async callWithTimeout(promise) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timeout after ${this.options.requestTimeout}ms`)), this.options.requestTimeout))
        ]);
    }
    onSuccess() {
        this.totalRequests++;
        this.failures = 0;
        this.successes++;
        if (this.state === CircuitState.HALF_OPEN) {
            this.consecutiveSuccesses++;
            if (this.consecutiveSuccesses >= this.options.successThreshold) {
                this.close();
            }
        }
    }
    onFailure(error) {
        this.totalRequests++;
        if (!this.options.errorFilter(error)) {
            return; // Don't count filtered errors
        }
        this.failures++;
        this.consecutiveSuccesses = 0;
        this.lastFailureTime = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            this.open();
        }
        else if (this.state === CircuitState.CLOSED &&
            this.totalRequests >= this.options.volumeThreshold &&
            this.failures >= this.options.failureThreshold) {
            this.open();
        }
    }
    open() {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
        console.warn(`Circuit breaker '${this.name}' opened. Next attempt at ${this.nextAttemptTime}`);
    }
    close() {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.consecutiveSuccesses = 0;
        this.nextAttemptTime = undefined;
        console.info(`Circuit breaker '${this.name}' closed`);
    }
    halfOpen() {
        this.state = CircuitState.HALF_OPEN;
        this.consecutiveSuccesses = 0;
        console.info(`Circuit breaker '${this.name}' half-open`);
    }
    canAttemptReset() {
        return (this.nextAttemptTime !== undefined &&
            new Date() >= this.nextAttemptTime);
    }
    getStats() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            consecutiveSuccesses: this.consecutiveSuccesses,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            totalRequests: this.totalRequests
        };
    }
    reset() {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.consecutiveSuccesses = 0;
        this.lastFailureTime = undefined;
        this.nextAttemptTime = undefined;
        this.totalRequests = 0;
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Circuit breaker factory for easy creation
 */
class CircuitBreakerFactory {
    static create(name, action, options) {
        const existing = this.breakers.get(name);
        if (existing) {
            return existing;
        }
        const breaker = new CircuitBreaker(name, action, options);
        this.breakers.set(name, breaker);
        return breaker;
    }
    static get(name) {
        return this.breakers.get(name);
    }
    static getAll() {
        return new Map(this.breakers);
    }
    static reset(name) {
        if (name) {
            this.breakers.get(name)?.reset();
        }
        else {
            this.breakers.forEach(breaker => breaker.reset());
        }
    }
    static remove(name) {
        return this.breakers.delete(name);
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
CircuitBreakerFactory.breakers = new Map();
//# sourceMappingURL=CircuitBreaker.js.map