"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSimpleMonitoring = exports.setupMonitoring = exports.CircuitBreakerManager = exports.PerformanceMonitor = exports.HealthCheckManager = exports.TracingManager = exports.enableDefaultMetrics = exports.MetricsCollector = exports.createChildLogger = exports.requestLoggingMiddleware = exports.correlationMiddleware = exports.createLogger = exports.CircuitBreakerProtection = exports.Performance = exports.TraceMethod = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const logger_1 = require("./logger");
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
Object.defineProperty(exports, "correlationMiddleware", { enumerable: true, get: function () { return logger_1.correlationMiddleware; } });
Object.defineProperty(exports, "requestLoggingMiddleware", { enumerable: true, get: function () { return logger_1.requestLoggingMiddleware; } });
Object.defineProperty(exports, "createChildLogger", { enumerable: true, get: function () { return logger_1.createChildLogger; } });
const errors_1 = require("./errors");
const metrics_1 = require("./metrics");
Object.defineProperty(exports, "MetricsCollector", { enumerable: true, get: function () { return metrics_1.MetricsCollector; } });
Object.defineProperty(exports, "enableDefaultMetrics", { enumerable: true, get: function () { return metrics_1.enableDefaultMetrics; } });
const tracing_1 = require("./tracing");
Object.defineProperty(exports, "TracingManager", { enumerable: true, get: function () { return tracing_1.TracingManager; } });
Object.defineProperty(exports, "TraceMethod", { enumerable: true, get: function () { return tracing_1.TraceMethod; } });
const health_1 = require("./health");
Object.defineProperty(exports, "HealthCheckManager", { enumerable: true, get: function () { return health_1.HealthCheckManager; } });
const performance_1 = require("./performance");
Object.defineProperty(exports, "PerformanceMonitor", { enumerable: true, get: function () { return performance_1.PerformanceMonitor; } });
Object.defineProperty(exports, "Performance", { enumerable: true, get: function () { return performance_1.Performance; } });
const circuitBreaker_1 = require("./circuitBreaker");
Object.defineProperty(exports, "CircuitBreakerManager", { enumerable: true, get: function () { return circuitBreaker_1.CircuitBreakerManager; } });
Object.defineProperty(exports, "CircuitBreakerProtection", { enumerable: true, get: function () { return circuitBreaker_1.CircuitBreakerProtection; } });
// Re-export types and utilities
__exportStar(require("./types"), exports);
__exportStar(require("./errors"), exports);
// Main monitoring setup function
function setupMonitoring(app, config) {
    // Initialize logger
    const logger = (0, logger_1.createLogger)({
        level: config.logging.level,
        service: config.service.name,
        version: config.service.version,
        environment: config.service.environment,
        redactionPaths: config.logging.redactionPaths
    });
    // Initialize tracing
    const tracingManager = new tracing_1.TracingManager({
        serviceName: config.service.name,
        serviceVersion: config.service.version,
        environment: config.service.environment,
        jaegerEndpoint: config.tracing.jaegerEndpoint,
        enabled: config.tracing.enabled
    });
    // Initialize metrics
    let metricsCollector = null;
    if (config.metrics.enabled) {
        if (config.metrics.collectDefaultMetrics !== false) {
            (0, metrics_1.enableDefaultMetrics)(config.service.name);
        }
        metricsCollector = new metrics_1.MetricsCollector(config.service.name, config.metrics.prefix || 'hockey_hub');
    }
    // Initialize health checks
    const healthCheckManager = new health_1.HealthCheckManager();
    if (config.healthCheck.enabled && config.healthCheck.checks) {
        config.healthCheck.checks.forEach(check => healthCheckManager.addCheck(check));
    }
    // Initialize performance monitor
    const performanceMonitor = new performance_1.PerformanceMonitor(logger);
    // Set common performance thresholds
    performanceMonitor.setThreshold('database', 1000); // 1 second for DB operations
    performanceMonitor.setThreshold('external', 5000); // 5 seconds for external calls
    performanceMonitor.setThreshold('http', 2000); // 2 seconds for HTTP requests
    // Initialize circuit breaker manager
    const circuitBreakerManager = new circuitBreaker_1.CircuitBreakerManager(logger);
    // Setup middleware in correct order
    app.use(logger_1.correlationMiddleware);
    app.use((0, logger_1.requestLoggingMiddleware)(logger));
    if (config.tracing.enabled && tracingManager) {
        app.use(tracingManager.traceMiddleware());
    }
    if (metricsCollector) {
        app.use(metricsCollector.httpMetricsMiddleware());
    }
    app.use(performanceMonitor.performanceMiddleware());
    // Add health check routes
    if (config.healthCheck.enabled) {
        const healthPath = config.healthCheck.path || '/health';
        app.get(healthPath, healthCheckManager.getHandler());
        app.get(`${healthPath}/live`, healthCheckManager.getLivenessHandler());
        app.get(`${healthPath}/ready`, healthCheckManager.getReadinessHandler());
    }
    // Add metrics endpoint
    if (metricsCollector) {
        app.get('/metrics', metricsCollector.getMetricsHandler());
    }
    // Add monitoring info endpoint
    app.get('/monitoring/info', (_req, res) => {
        res.json({
            service: config.service,
            monitoring: {
                logging: { enabled: true, level: config.logging.level },
                tracing: { enabled: config.tracing.enabled },
                metrics: { enabled: config.metrics.enabled },
                healthCheck: { enabled: config.healthCheck.enabled }
            },
            performance: performanceMonitor.getPerformanceStats(),
            circuitBreakers: circuitBreakerManager.getAllMetrics(),
            uptime: process.uptime(),
            version: config.service.version || '1.0.0'
        });
    });
    // Error handling middleware (must be last)
    app.use((0, errors_1.errorHandler)(logger));
    // Return monitoring utilities for use in application code
    return {
        logger,
        tracingManager,
        metricsCollector,
        healthCheckManager,
        performanceMonitor,
        circuitBreakerManager,
        // Utility functions
        createChildLogger: (req, metadata) => (0, logger_1.createChildLogger)(logger, req, metadata),
        asyncHandler: errors_1.asyncHandler,
        mapDatabaseError: errors_1.mapDatabaseError,
        createErrorContext: errors_1.createErrorContext,
        // Business metrics (if metrics enabled)
        businessMetrics: metricsCollector ? metricsCollector.createBusinessMetrics() : null,
        // Cleanup function
        shutdown: async () => {
            logger.info('Shutting down monitoring systems...');
            if (tracingManager) {
                await tracingManager.shutdown();
            }
            if (metricsCollector) {
                prom_client_1.default.register.clear();
            }
            // Clean up stale performance operations
            const staleCount = performanceMonitor.cleanupStaleOperations();
            if (staleCount > 0) {
                logger.info({ staleOperations: staleCount }, 'Cleaned up stale performance operations');
            }
            logger.info('Monitoring shutdown complete');
        }
    };
}
exports.setupMonitoring = setupMonitoring;
// Simple setup function with defaults
function setupSimpleMonitoring(app, serviceName, options = {}) {
    const defaultConfig = {
        service: {
            name: serviceName,
            version: process.env.SERVICE_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        },
        logging: {
            level: process.env.LOG_LEVEL || 'info'
        },
        tracing: {
            enabled: process.env.TRACING_ENABLED !== 'false',
            jaegerEndpoint: process.env.JAEGER_ENDPOINT
        },
        metrics: {
            enabled: process.env.METRICS_ENABLED !== 'false',
            collectDefaultMetrics: true
        },
        healthCheck: {
            enabled: true,
            path: '/health'
        }
    };
    const config = mergeConfigs(defaultConfig, options);
    return setupMonitoring(app, config);
}
exports.setupSimpleMonitoring = setupSimpleMonitoring;
// Helper function to merge configurations
function mergeConfigs(defaultConfig, overrides) {
    return {
        service: { ...defaultConfig.service, ...overrides.service },
        logging: { ...defaultConfig.logging, ...overrides.logging },
        tracing: { ...defaultConfig.tracing, ...overrides.tracing },
        metrics: { ...defaultConfig.metrics, ...overrides.metrics },
        healthCheck: { ...defaultConfig.healthCheck, ...overrides.healthCheck }
    };
}
