"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerProtection = exports.CircuitBreakerManager = exports.CircuitBreaker = void 0;
const pino_1 = __importDefault(require("pino"));
class CircuitBreaker {
    constructor(name, config, logger) {
        this.name = name;
        this.config = config;
        this.logger = logger;
        this.successCount = 0;
        this.state = {
            state: 'CLOSED',
            failureCount: 0
        };
    }
    // Execute a function with circuit breaker protection
    async execute(fn, fallback) {
        // Store initial state to understand flow
        const currentState = this.state.state;
        if (currentState === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.state.state = 'HALF_OPEN';
                this.logger.info({ circuitBreaker: this.name }, 'Circuit breaker transitioning to HALF_OPEN');
            }
            else {
                this.logger.warn({
                    circuitBreaker: this.name,
                    state: this.state
                }, 'Circuit breaker OPEN - using fallback');
                if (fallback) {
                    return fallback();
                }
                throw new Error(`Circuit breaker ${this.name} is OPEN`);
            }
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            if (fallback) {
                this.logger.info({
                    circuitBreaker: this.name,
                    error: error.message
                }, 'Circuit breaker failed - using fallback');
                return fallback();
            }
            throw error;
        }
    }
    // Handle successful execution
    onSuccess() {
        this.successCount++;
        if (this.state.state === 'HALF_OPEN') {
            // Reset circuit breaker on success in HALF_OPEN state
            this.state = {
                state: 'CLOSED',
                failureCount: 0
            };
            this.successCount = 0;
            this.logger.info({ circuitBreaker: this.name }, 'Circuit breaker reset to CLOSED');
        }
        else if (this.state.state === 'CLOSED') {
            // Reset failure count on success
            this.state.failureCount = 0;
        }
    }
    // Handle failed execution
    onFailure() {
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();
        this.logger.warn({
            circuitBreaker: this.name,
            failureCount: this.state.failureCount,
            threshold: this.config.failureThreshold
        }, 'Circuit breaker failure recorded');
        if (this.state.failureCount >= this.config.failureThreshold) {
            this.state.state = 'OPEN';
            this.state.nextAttempt = Date.now() + this.config.resetTimeout;
            this.logger.error({
                circuitBreaker: this.name,
                failureCount: this.state.failureCount,
                nextAttempt: new Date(this.state.nextAttempt).toISOString()
            }, 'Circuit breaker OPENED due to failure threshold');
        }
    }
    // Check if we should attempt to reset the circuit breaker
    shouldAttemptReset() {
        return this.state.nextAttempt !== undefined && Date.now() >= this.state.nextAttempt;
    }
    // Get current state
    getState() {
        return { ...this.state };
    }
    // Get circuit breaker metrics
    getMetrics() {
        return {
            name: this.name,
            state: this.state.state,
            failureCount: this.state.failureCount,
            successCount: this.successCount,
            config: this.config,
            lastFailureTime: this.state.lastFailureTime ? new Date(this.state.lastFailureTime).toISOString() : null,
            nextAttempt: this.state.nextAttempt ? new Date(this.state.nextAttempt).toISOString() : null
        };
    }
    // Force circuit breaker to open (for testing or manual intervention)
    forceOpen() {
        this.state.state = 'OPEN';
        this.state.nextAttempt = Date.now() + this.config.resetTimeout;
        this.logger.warn({ circuitBreaker: this.name }, 'Circuit breaker manually opened');
    }
    // Force circuit breaker to close (for testing or manual intervention)
    forceClose() {
        this.state = {
            state: 'CLOSED',
            failureCount: 0
        };
        this.successCount = 0;
        this.logger.info({ circuitBreaker: this.name }, 'Circuit breaker manually closed');
    }
}
exports.CircuitBreaker = CircuitBreaker;
// Circuit breaker manager for handling multiple circuit breakers
class CircuitBreakerManager {
    constructor(logger) {
        this.logger = logger;
        this.circuitBreakers = new Map();
    }
    // Create or get a circuit breaker
    getCircuitBreaker(name, config) {
        if (!this.circuitBreakers.has(name)) {
            const defaultConfig = {
                failureThreshold: 5,
                resetTimeout: 60000, // 1 minute
                monitoringPeriod: 30000 // 30 seconds
            };
            const circuitBreaker = new CircuitBreaker(name, { ...defaultConfig, ...config }, this.logger.child({ component: 'circuit-breaker', name }));
            this.circuitBreakers.set(name, circuitBreaker);
        }
        return this.circuitBreakers.get(name);
    }
    // Execute with circuit breaker protection
    async executeWithBreaker(breakerName, fn, fallback, config) {
        const circuitBreaker = this.getCircuitBreaker(breakerName, config);
        return circuitBreaker.execute(fn, fallback);
    }
    // Get all circuit breaker metrics
    getAllMetrics() {
        const metrics = {};
        for (const [name, breaker] of this.circuitBreakers.entries()) {
            metrics[name] = breaker.getMetrics();
        }
        return metrics;
    }
    // Health check for circuit breakers
    getHealthStatus() {
        const openBreakers = [];
        const halfOpenBreakers = [];
        let totalBreakers = 0;
        for (const [name, breaker] of this.circuitBreakers.entries()) {
            totalBreakers++;
            const state = breaker.getState();
            if (state.state === 'OPEN') {
                openBreakers.push(name);
            }
            else if (state.state === 'HALF_OPEN') {
                halfOpenBreakers.push(name);
            }
        }
        return {
            healthy: openBreakers.length === 0,
            totalBreakers,
            openBreakers,
            halfOpenBreakers,
            closedBreakers: totalBreakers - openBreakers.length - halfOpenBreakers.length
        };
    }
    // Create a decorator for circuit breaker protection
    createCircuitBreakerDecorator(breakerName, config, fallback) {
        return (_target, _propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                const manager = this.circuitBreakerManager || new CircuitBreakerManager(this.logger || (0, pino_1.default)());
                return manager.executeWithBreaker(breakerName, () => originalMethod.apply(this, args), fallback ? () => fallback.apply(this) : undefined, config);
            };
            return descriptor;
        };
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
// Decorator for circuit breaker protection
function CircuitBreakerProtection(breakerName, config) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            if (this.circuitBreakerManager) {
                return this.circuitBreakerManager.executeWithBreaker(breakerName, () => originalMethod.apply(this, args), undefined, config);
            }
            else {
                // Fallback if no circuit breaker manager available
                console.warn(`CircuitBreakerManager not found on 'this' for ${breakerName}. Executing original method without protection.`);
                return originalMethod.apply(this, args);
            }
        };
        return descriptor;
    };
}
exports.CircuitBreakerProtection = CircuitBreakerProtection;
