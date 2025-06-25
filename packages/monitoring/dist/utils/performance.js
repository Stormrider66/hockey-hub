"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timed = exports.PerformanceMonitor = void 0;
class PerformanceMonitor {
    constructor(logger, slowThreshold = 1000) {
        this.timings = new Map();
        this.logger = logger;
        this.slowThreshold = slowThreshold;
    }
    /**
     * Start timing an operation
     */
    startTimer(operation, metadata) {
        this.timings.set(operation, {
            startTime: Date.now(),
            operation,
            metadata,
        });
    }
    /**
     * End timing and log if slow
     */
    endTimer(operation) {
        const timing = this.timings.get(operation);
        if (!timing) {
            this.logger.warn({ operation }, 'No timing found for operation');
            return null;
        }
        timing.endTime = Date.now();
        timing.duration = timing.endTime - timing.startTime;
        if (timing.duration > this.slowThreshold) {
            this.logger.warn({
                operation,
                duration: timing.duration,
                threshold: this.slowThreshold,
                ...timing.metadata,
            }, 'Slow operation detected');
        }
        else {
            this.logger.debug({
                operation,
                duration: timing.duration,
                ...timing.metadata,
            }, 'Operation completed');
        }
        this.timings.delete(operation);
        return timing.duration;
    }
    /**
     * Time an async operation
     */
    async timeOperation(operation, fn, metadata) {
        this.startTimer(operation, metadata);
        try {
            const result = await fn();
            this.endTimer(operation);
            return result;
        }
        catch (error) {
            const duration = this.endTimer(operation);
            this.logger.error({
                operation,
                duration,
                error: error instanceof Error ? error.message : 'Unknown error',
                ...metadata,
            }, 'Operation failed');
            throw error;
        }
    }
    /**
     * Get all active timings
     */
    getActiveTimings() {
        return Array.from(this.timings.values());
    }
    /**
     * Clear all timings
     */
    clear() {
        this.timings.clear();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Create a performance timing decorator for class methods
 */
function Timed(operation, slowThreshold) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const operationName = operation || `${target.constructor.name}.${propertyKey}`;
        descriptor.value = async function (...args) {
            const monitor = this.performanceMonitor;
            if (!monitor) {
                // If no monitor available, just run the original method
                return originalMethod.apply(this, args);
            }
            return monitor.timeOperation(operationName, () => originalMethod.apply(this, args), { args: args.length } // Only log arg count, not the args themselves
            );
        };
        return descriptor;
    };
}
exports.Timed = Timed;
