"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonHealthChecks = exports.createHealthCheck = exports.HealthStatus = void 0;
const express_1 = require("express");
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["HEALTHY"] = "healthy";
    HealthStatus["DEGRADED"] = "degraded";
    HealthStatus["UNHEALTHY"] = "unhealthy";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * Creates a health check endpoint
 */
function createHealthCheck(options) {
    const { service, version = '1.0.0', checks, logger, timeout = 5000 } = options;
    const startTime = Date.now();
    const router = (0, express_1.Router)();
    // Liveness probe - basic check that service is running
    router.get('/health/live', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            service,
            timestamp: new Date().toISOString(),
        });
    });
    // Readiness probe - comprehensive health check
    router.get('/health/ready', async (_req, res) => {
        const timestamp = new Date().toISOString();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const results = {};
        let overallStatus = HealthStatus.HEALTHY;
        // Run all health checks in parallel
        await Promise.all(checks.map(async (check) => {
            const checkStart = Date.now();
            const checkTimeout = check.timeout || timeout;
            try {
                // Run check with timeout
                const result = await Promise.race([
                    check.check(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), checkTimeout)),
                ]);
                const duration = Date.now() - checkStart;
                results[check.name] = { ...result, duration };
                // Update overall status
                if (result.status === HealthStatus.UNHEALTHY && check.critical !== false) {
                    overallStatus = HealthStatus.UNHEALTHY;
                }
                else if (result.status === HealthStatus.DEGRADED && overallStatus === HealthStatus.HEALTHY) {
                    overallStatus = HealthStatus.DEGRADED;
                }
                // Log slow checks
                if (duration > checkTimeout * 0.8) {
                    logger.warn({
                        check: check.name,
                        duration,
                        threshold: checkTimeout,
                    }, 'Health check is slow');
                }
            }
            catch (error) {
                const duration = Date.now() - checkStart;
                results[check.name] = {
                    status: HealthStatus.UNHEALTHY,
                    message: error instanceof Error ? error.message : 'Health check failed',
                    duration,
                };
                if (check.critical !== false) {
                    overallStatus = HealthStatus.UNHEALTHY;
                }
                logger.error({
                    check: check.name,
                    error: error instanceof Error ? error.message : error,
                }, 'Health check failed');
            }
        }));
        const response = {
            status: overallStatus,
            service,
            version,
            timestamp,
            uptime,
            checks: results,
        };
        const statusCode = overallStatus === HealthStatus.HEALTHY ? 200 : 503;
        res.status(statusCode).json(response);
    });
    // Simple health endpoint for backwards compatibility
    router.get('/health', async (_req, res) => {
        res.redirect('/health/ready');
    });
    return router;
}
exports.createHealthCheck = createHealthCheck;
/**
 * Common health check implementations
 */
exports.CommonHealthChecks = {
    /**
     * Database connectivity check
     */
    database: (queryFn) => ({
        name: 'database',
        critical: true,
        timeout: 3000,
        check: async () => {
            const start = Date.now();
            try {
                await queryFn();
                const duration = Date.now() - start;
                if (duration > 1000) {
                    return {
                        status: HealthStatus.DEGRADED,
                        message: 'Database response is slow',
                        details: { responseTime: duration },
                    };
                }
                return {
                    status: HealthStatus.HEALTHY,
                    message: 'Database is responsive',
                };
            }
            catch (error) {
                return {
                    status: HealthStatus.UNHEALTHY,
                    message: error instanceof Error ? error.message : 'Database connection failed',
                };
            }
        },
    }),
    /**
     * External service dependency check
     */
    externalService: (name, url, expectedStatus = 200) => ({
        name: `external:${name}`,
        critical: false,
        timeout: 5000,
        check: async () => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    signal: AbortSignal.timeout(4000),
                });
                if (response.status === expectedStatus) {
                    return {
                        status: HealthStatus.HEALTHY,
                        message: `${name} is reachable`,
                    };
                }
                else {
                    return {
                        status: HealthStatus.DEGRADED,
                        message: `${name} returned unexpected status: ${response.status}`,
                        details: { status: response.status },
                    };
                }
            }
            catch (error) {
                return {
                    status: HealthStatus.UNHEALTHY,
                    message: `${name} is unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
                };
            }
        },
    }),
    /**
     * Memory usage check
     */
    memory: (thresholdPercent = 90) => ({
        name: 'memory',
        critical: false,
        check: async () => {
            const used = process.memoryUsage();
            const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
            if (heapUsedPercent > thresholdPercent) {
                return {
                    status: HealthStatus.UNHEALTHY,
                    message: `Memory usage is above ${thresholdPercent}%`,
                    details: {
                        heapUsedPercent: heapUsedPercent.toFixed(2),
                        heapUsed: used.heapUsed,
                        heapTotal: used.heapTotal,
                    },
                };
            }
            else if (heapUsedPercent > thresholdPercent * 0.8) {
                return {
                    status: HealthStatus.DEGRADED,
                    message: `Memory usage is approaching threshold`,
                    details: {
                        heapUsedPercent: heapUsedPercent.toFixed(2),
                    },
                };
            }
            return {
                status: HealthStatus.HEALTHY,
                message: 'Memory usage is normal',
                details: {
                    heapUsedPercent: heapUsedPercent.toFixed(2),
                },
            };
        },
    }),
};
