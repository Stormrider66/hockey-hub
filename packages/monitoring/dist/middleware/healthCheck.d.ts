import { Logger } from 'pino';
export declare enum HealthStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy"
}
export interface HealthCheckResult {
    status: HealthStatus;
    message?: string;
    duration?: number;
    details?: any;
}
export interface HealthCheck {
    name: string;
    check: () => Promise<HealthCheckResult>;
    critical?: boolean;
    timeout?: number;
}
export interface HealthCheckOptions {
    service: string;
    version?: string;
    checks: HealthCheck[];
    logger: Logger;
    timeout?: number;
}
export interface HealthResponse {
    status: HealthStatus;
    service: string;
    version: string;
    timestamp: string;
    uptime: number;
    checks: {
        [name: string]: HealthCheckResult & {
            duration: number;
        };
    };
}
/**
 * Creates a health check endpoint
 */
export declare function createHealthCheck(options: HealthCheckOptions): any;
/**
 * Common health check implementations
 */
export declare const CommonHealthChecks: {
    /**
     * Database connectivity check
     */
    database: (queryFn: () => Promise<any>) => HealthCheck;
    /**
     * External service dependency check
     */
    externalService: (name: string, url: string, expectedStatus?: number) => HealthCheck;
    /**
     * Memory usage check
     */
    memory: (thresholdPercent?: number) => HealthCheck;
};
