import { Express } from 'express';
import { MonitoringConfig } from './types';
import { createLogger } from './utils/logger';
import { HealthCheck } from './middleware/healthCheck';
import { MetricsCollector } from './middleware/metrics';
import { PerformanceMonitor } from './utils/performance';
export interface MonitoringSetupResult {
    logger: ReturnType<typeof createLogger>;
    metrics: MetricsCollector;
    performanceMonitor: PerformanceMonitor;
}
/**
 * Setup comprehensive monitoring for a microservice
 */
export declare function setupMonitoring(app: Express, config: MonitoringConfig, healthChecks?: HealthCheck[]): MonitoringSetupResult;
/**
 * Graceful shutdown helper
 */
export declare function gracefulShutdown(logger: ReturnType<typeof createLogger>, shutdownFns: Array<() => Promise<void>>): Promise<void>;
