"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.setupMonitoring = void 0;
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const healthCheck_1 = require("./middleware/healthCheck");
const metrics_1 = require("./middleware/metrics");
const tracing_1 = require("./utils/tracing");
const performance_1 = require("./utils/performance");
/**
 * Setup comprehensive monitoring for a microservice
 */
function setupMonitoring(app, config, healthChecks = []) {
    // Create logger
    const logger = (0, logger_1.createLogger)({
        service: config.service.name,
        level: config.logging.level,
        pretty: config.logging.pretty,
        redact: config.logging.redactPaths,
    });
    // Initialize tracing if enabled
    if (config.tracing?.enabled) {
        (0, tracing_1.initializeTracing)({
            serviceName: config.service.name,
            serviceVersion: config.service.version,
            environment: config.service.environment,
            otlpEndpoint: config.tracing.endpoint,
            enabled: true,
            logger,
        });
    }
    // Add request logging middleware
    const requestLoggerMiddleware = (0, requestLogger_1.createRequestLogger)({
        logger,
        excludePaths: ['/health', '/metrics'],
        slowRequestThreshold: 1000,
    });
    app.use(requestLoggerMiddleware);
    // Initialize metrics if enabled
    let metrics;
    if (config.metrics?.enabled !== false) {
        metrics = new metrics_1.MetricsCollector({
            serviceName: config.service.name,
            collectDefaultMetrics: true,
            defaultLabels: {
                version: config.service.version || '1.0.0',
                environment: config.service.environment || 'development',
                ...config.metrics?.defaultLabels,
            },
            customMetrics: [
                metrics_1.CommonMetrics.databaseQueryDuration,
                metrics_1.CommonMetrics.externalServiceRequests,
                metrics_1.CommonMetrics.externalServiceDuration,
            ],
            logger,
        });
        // Add metrics middleware
        app.use(metrics.createHttpMetricsMiddleware());
        // Add metrics endpoint
        const metricsPath = config.metrics?.path || '/metrics';
        app.use(metricsPath, metrics.createMetricsEndpoint());
    }
    // Add health check endpoints if enabled
    if (config.healthCheck?.enabled !== false) {
        const healthCheckPath = config.healthCheck?.path || '/health';
        const defaultHealthChecks = [
            healthCheck_1.CommonHealthChecks.memory(85), // Alert at 85% memory usage
            ...healthChecks,
        ];
        const healthCheckRouter = (0, healthCheck_1.createHealthCheck)({
            service: config.service.name,
            version: config.service.version,
            checks: defaultHealthChecks,
            logger,
            timeout: config.healthCheck?.timeout,
        });
        app.use(healthCheckPath, healthCheckRouter);
    }
    // Create performance monitor
    const performanceMonitor = new performance_1.PerformanceMonitor(logger);
    // Add error handler (should be last)
    const errorHandler = (0, errorHandler_1.createErrorHandler)({
        logger,
        includeStackTrace: config.service.environment === 'development',
    });
    app.use(errorHandler);
    // Log startup
    logger.info({
        service: config.service.name,
        version: config.service.version,
        environment: config.service.environment,
        tracing: config.tracing?.enabled ? 'enabled' : 'disabled',
        metrics: config.metrics?.enabled !== false ? 'enabled' : 'disabled',
        healthCheck: config.healthCheck?.enabled !== false ? 'enabled' : 'disabled',
    }, 'Monitoring initialized');
    return {
        logger,
        metrics: metrics,
        performanceMonitor,
    };
}
exports.setupMonitoring = setupMonitoring;
/**
 * Graceful shutdown helper
 */
async function gracefulShutdown(logger, shutdownFns) {
    logger.info('Starting graceful shutdown');
    // Set timeout for shutdown
    const shutdownTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
    }, 30000); // 30 seconds timeout
    try {
        // Run all shutdown functions in parallel
        await Promise.all(shutdownFns.map(async (fn) => {
            try {
                await fn();
            }
            catch (error) {
                logger.error({ err: error }, 'Error during shutdown');
            }
        }));
        clearTimeout(shutdownTimeout);
        logger.info('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        logger.error({ err: error }, 'Graceful shutdown failed');
        clearTimeout(shutdownTimeout);
        process.exit(1);
    }
}
exports.gracefulShutdown = gracefulShutdown;
