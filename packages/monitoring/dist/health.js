"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckManager = void 0;
class HealthCheckManager {
    constructor() {
        this.checks = new Map();
        this.startTime = Date.now();
        // Add default health checks
        this.addCheck({
            name: 'memory',
            check: this.checkMemoryUsage.bind(this),
            timeout: 1000,
            critical: false
        });
        this.addCheck({
            name: 'uptime',
            check: this.checkUptime.bind(this),
            timeout: 100,
            critical: false
        });
    }
    addCheck(healthCheck) {
        this.checks.set(healthCheck.name, healthCheck);
    }
    removeCheck(name) {
        this.checks.delete(name);
    }
    async executeCheck(check) {
        try {
            const timeout = check.timeout || 5000;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Health check timeout')), timeout);
            });
            const checkPromise = check.check();
            const result = await Promise.race([checkPromise, timeoutPromise]);
            return result;
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    async runHealthChecks() {
        const results = {};
        let overallStatus = 'healthy';
        // Run all health checks in parallel
        const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
            const result = await this.executeCheck(check);
            results[name] = result;
            // If any critical check fails, mark overall status as unhealthy
            if (check.critical && result.status === 'unhealthy') {
                overallStatus = 'unhealthy';
            }
        });
        await Promise.allSettled(checkPromises);
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            checks: results
        };
    }
    // Express route handler
    getHandler() {
        return async (_req, res) => {
            try {
                const health = await this.runHealthChecks();
                const statusCode = health.status === 'healthy' ? 200 : 503;
                res.status(statusCode).json(health);
            }
            catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    uptime: Date.now() - this.startTime,
                    error: 'Health check system failure',
                    checks: {}
                });
            }
        };
    }
    // Liveness probe (simple check that service is running)
    getLivenessHandler() {
        return (_req, res) => {
            res.status(200).json({
                status: 'alive',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime
            });
        };
    }
    // Readiness probe (check if service is ready to accept traffic)
    getReadinessHandler() {
        return async (_req, res) => {
            try {
                // Only run critical checks for readiness
                const criticalChecks = Array.from(this.checks.entries()).filter(([_, check]) => check.critical);
                if (criticalChecks.length === 0) {
                    return res.status(200).json({
                        status: 'ready',
                        timestamp: new Date().toISOString()
                    });
                }
                const results = {};
                let isReady = true;
                for (const [name, check] of criticalChecks) {
                    const result = await this.executeCheck(check);
                    results[name] = result;
                    if (result.status === 'unhealthy') {
                        isReady = false;
                    }
                }
                const statusCode = isReady ? 200 : 503;
                return res.status(statusCode).json({
                    status: isReady ? 'ready' : 'not_ready',
                    timestamp: new Date().toISOString(),
                    checks: results
                });
            }
            catch (error) {
                return res.status(503).json({
                    status: 'not_ready',
                    timestamp: new Date().toISOString(),
                    error: 'Readiness check failed'
                });
            }
        };
    }
    // Default health checks
    async checkMemoryUsage() {
        const usage = process.memoryUsage();
        const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const usagePercent = (usedMB / totalMB) * 100;
        return {
            status: usagePercent < 90 ? 'healthy' : 'unhealthy',
            details: {
                heapUsed: `${usedMB}MB`,
                heapTotal: `${totalMB}MB`,
                usagePercent: `${usagePercent.toFixed(1)}%`,
                rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
            }
        };
    }
    async checkUptime() {
        const uptime = Date.now() - this.startTime;
        const uptimeSeconds = Math.floor(uptime / 1000);
        return {
            status: 'healthy',
            details: {
                uptime: `${uptimeSeconds}s`,
                startTime: new Date(this.startTime).toISOString()
            }
        };
    }
    // Common health check factories
    static createDatabaseCheck(name, checkFn) {
        return {
            name: `database_${name}`,
            check: async () => {
                try {
                    const isHealthy = await checkFn();
                    return {
                        status: isHealthy ? 'healthy' : 'unhealthy',
                        details: { connected: isHealthy }
                    };
                }
                catch (error) {
                    return {
                        status: 'unhealthy',
                        error: error.message
                    };
                }
            },
            timeout: 5000,
            critical: true
        };
    }
    static createExternalServiceCheck(serviceName, checkFn) {
        return {
            name: `external_${serviceName}`,
            check: async () => {
                try {
                    const isHealthy = await checkFn();
                    return {
                        status: isHealthy ? 'healthy' : 'unhealthy',
                        details: { available: isHealthy }
                    };
                }
                catch (error) {
                    return {
                        status: 'unhealthy',
                        error: error.message
                    };
                }
            },
            timeout: 10000,
            critical: false
        };
    }
    static createCustomCheck(name, checkFn, critical = false, timeout = 5000) {
        return {
            name,
            check: async () => {
                try {
                    const result = await checkFn();
                    return {
                        status: result.healthy ? 'healthy' : 'unhealthy',
                        details: result.details,
                        error: result.error
                    };
                }
                catch (error) {
                    return {
                        status: 'unhealthy',
                        error: error.message
                    };
                }
            },
            timeout,
            critical
        };
    }
}
exports.HealthCheckManager = HealthCheckManager;
