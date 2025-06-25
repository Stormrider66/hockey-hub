import { Router } from 'express';
import * as promClient from 'prom-client';
import { Logger } from 'pino';
export interface MetricsOptions {
    serviceName: string;
    collectDefaultMetrics?: boolean;
    defaultLabels?: Record<string, string>;
    customMetrics?: CustomMetric[];
    logger: Logger;
}
export interface CustomMetric {
    name: string;
    help: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    labelNames?: string[];
    buckets?: number[];
    percentiles?: number[];
}
export declare class MetricsCollector {
    private registry;
    private metrics;
    private logger;
    private httpRequestDuration;
    private httpRequestTotal;
    private httpRequestsInProgress;
    constructor(options: MetricsOptions);
    private registerCustomMetric;
    /**
     * Get a registered metric by name
     */
    getMetric(name: string): promClient.Metric<string> | undefined;
    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;
    /**
     * Set a gauge metric
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Observe a histogram metric
     */
    observeHistogram(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Create HTTP metrics middleware
     */
    createHttpMetricsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Create metrics endpoint
     */
    createMetricsEndpoint(): Router;
    /**
     * Get the Prometheus registry
     */
    getRegistry(): promClient.Registry;
}
/**
 * Common custom metrics for microservices
 */
export declare const CommonMetrics: {
    userRegistrations: {
        name: string;
        help: string;
        type: "counter";
        labelNames: string[];
    };
    activeUsers: {
        name: string;
        help: string;
        type: "gauge";
        labelNames: string[];
    };
    databaseQueryDuration: {
        name: string;
        help: string;
        type: "histogram";
        labelNames: string[];
        buckets: number[];
    };
    databaseConnectionPool: {
        name: string;
        help: string;
        type: "gauge";
        labelNames: string[];
    };
    cacheHits: {
        name: string;
        help: string;
        type: "counter";
        labelNames: string[];
    };
    cacheMisses: {
        name: string;
        help: string;
        type: "counter";
        labelNames: string[];
    };
    externalServiceRequests: {
        name: string;
        help: string;
        type: "counter";
        labelNames: string[];
    };
    externalServiceDuration: {
        name: string;
        help: string;
        type: "histogram";
        labelNames: string[];
        buckets: number[];
    };
    queueSize: {
        name: string;
        help: string;
        type: "gauge";
        labelNames: string[];
    };
    queueProcessingDuration: {
        name: string;
        help: string;
        type: "histogram";
        labelNames: string[];
    };
};
