"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Performance = exports.PerformanceMonitor = void 0;
const pino_1 = __importDefault(require("pino"));
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.operationThresholds = new Map();
        this.activeOperations = new Map();
    }
    // Set performance thresholds for operations
    setThreshold(operation, thresholdMs) {
        this.operationThresholds.set(operation, thresholdMs);
    }
    // Start timing an operation
    startOperation(operation, metadata) {
        const operationId = `${operation}_${Date.now()}_${Math.random()}`;
        this.activeOperations.set(operationId, {
            operation,
            startTime: Date.now(),
            metadata
        });
        return operationId;
    }
    // End timing an operation
    endOperation(operationId) {
        const context = this.activeOperations.get(operationId);
        if (!context) {
            this.logger.warn({ operationId }, 'Attempted to end unknown operation');
            return 0;
        }
        const duration = Date.now() - context.startTime;
        this.activeOperations.delete(operationId);
        // Check if operation exceeded threshold
        const threshold = this.operationThresholds.get(context.operation);
        const isSlowOperation = threshold && duration > threshold;
        // Log performance data
        const logLevel = isSlowOperation ? 'warn' : 'debug';
        this.logger[logLevel]({
            type: 'performance',
            operation: context.operation,
            duration,
            threshold,
            isSlowOperation,
            metadata: context.metadata
        }, `Operation ${context.operation} completed in ${duration}ms`);
        return duration;
    }
    // Time a function execution
    async timeFunction(operation, fn, metadata) {
        const operationId = this.startOperation(operation, metadata);
        try {
            const result = await fn();
            this.endOperation(operationId);
            return result;
        }
        catch (error) {
            this.endOperation(operationId);
            throw error;
        }
    }
    // Performance middleware for Express
    performanceMiddleware() {
        return (req, res, next) => {
            const operation = `${req.method} ${req.route?.path || req.path}`;
            const operationId = this.startOperation(operation, {
                method: req.method,
                path: req.path,
                userId: req.user?.id,
                correlationId: req.correlationId
            });
            // Store operation ID in request for potential use
            req.performanceId = operationId;
            res.on('finish', () => {
                this.endOperation(operationId);
            });
            next();
        };
    }
    // Database query performance tracking
    trackDatabaseQuery(operation, table, query, fn) {
        return this.timeFunction(`db.${operation}`, fn, {
            table,
            query: this.sanitizeQuery(query),
            database: 'postgresql'
        });
    }
    // External service call performance tracking
    trackExternalCall(serviceName, operation, fn) {
        return this.timeFunction(`external.${serviceName}`, fn, {
            service: serviceName,
            operation
        });
    }
    // Get performance statistics
    getPerformanceStats() {
        const recentOperations = Array.from(this.activeOperations.values())
            .slice(-10)
            .map(context => ({
            operation: context.operation,
            startTime: context.startTime,
            metadata: context.metadata
        }));
        return {
            activeOperations: this.activeOperations.size,
            thresholds: Object.fromEntries(this.operationThresholds),
            recentOperations
        };
    }
    // Clean up stale operations (operations that have been running for too long)
    cleanupStaleOperations(maxAgeMs = 300000) {
        const cutoff = Date.now() - maxAgeMs;
        const staleOperations = [];
        for (const [operationId, context] of this.activeOperations.entries()) {
            if (context.startTime < cutoff) {
                staleOperations.push(operationId);
                this.logger.warn({
                    type: 'performance',
                    operationId,
                    operation: context.operation,
                    staleTime: Date.now() - context.startTime,
                    metadata: context.metadata
                }, 'Cleaning up stale operation');
            }
        }
        staleOperations.forEach(operationId => {
            this.activeOperations.delete(operationId);
        });
        return staleOperations.length;
    }
    // Performance decorator for class methods
    createPerformanceDecorator(operation) {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            const operationName = operation || `${target.constructor.name}.${propertyKey}`;
            descriptor.value = async function (...args) {
                const monitor = this.performanceMonitor || new PerformanceMonitor(this.logger || (0, pino_1.default)());
                return monitor.timeFunction(operationName, () => originalMethod.apply(this, args));
            };
            return descriptor;
        };
    }
    // Sanitize SQL query for logging (remove sensitive data)
    sanitizeQuery(query) {
        // Remove potential sensitive data from query
        return query
            .replace(/('.*?')/g, "'[REDACTED]'")
            .replace(/(\$\d+)/g, '$[PARAM]')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200); // Limit length
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Performance decorator factory
function Performance(operation) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const operationName = operation || `${target.constructor.name}.${propertyKey}`;
        descriptor.value = async function (...args) {
            if (this.performanceMonitor) {
                return this.performanceMonitor.timeFunction(operationName, () => originalMethod.apply(this, args));
            }
            else {
                // Fallback if no performance monitor available
                console.warn(`PerformanceMonitor not found on 'this' for ${operationName}. Executing original method without timing.`);
                return originalMethod.apply(this, args);
            }
        };
        return descriptor;
    };
}
exports.Performance = Performance;
