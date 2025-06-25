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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonMetrics = exports.MetricsCollector = void 0;
const express_1 = require("express");
const promClient = __importStar(require("prom-client"));
class MetricsCollector {
    constructor(options) {
        this.registry = new promClient.Registry();
        this.metrics = new Map();
        this.logger = options.logger;
        // Set default labels
        if (options.defaultLabels) {
            this.registry.setDefaultLabels({
                service: options.serviceName,
                ...options.defaultLabels,
            });
        }
        // Collect default metrics if enabled
        if (options.collectDefaultMetrics !== false) {
            promClient.collectDefaultMetrics({
                register: this.registry,
                prefix: `${options.serviceName}_`,
            });
        }
        // Initialize standard HTTP metrics
        this.httpRequestDuration = new promClient.Histogram({
            name: `${options.serviceName}_http_request_duration_seconds`,
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
            registers: [this.registry],
        });
        this.httpRequestTotal = new promClient.Counter({
            name: `${options.serviceName}_http_requests_total`,
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
        this.httpRequestsInProgress = new promClient.Gauge({
            name: `${options.serviceName}_http_requests_in_progress`,
            help: 'Number of HTTP requests in progress',
            labelNames: ['method', 'route'],
            registers: [this.registry],
        });
        // Register custom metrics
        if (options.customMetrics) {
            options.customMetrics.forEach(metric => this.registerCustomMetric(metric));
        }
    }
    registerCustomMetric(config) {
        const { name, help, type, labelNames = [], buckets, percentiles } = config;
        let metric;
        switch (type) {
            case 'counter':
                metric = new promClient.Counter({
                    name,
                    help,
                    labelNames,
                    registers: [this.registry],
                });
                break;
            case 'gauge':
                metric = new promClient.Gauge({
                    name,
                    help,
                    labelNames,
                    registers: [this.registry],
                });
                break;
            case 'histogram':
                metric = new promClient.Histogram({
                    name,
                    help,
                    labelNames,
                    buckets: buckets || [0.1, 0.5, 1, 2, 5, 10],
                    registers: [this.registry],
                });
                break;
            case 'summary':
                metric = new promClient.Summary({
                    name,
                    help,
                    labelNames,
                    percentiles: percentiles || [0.5, 0.9, 0.95, 0.99],
                    registers: [this.registry],
                });
                break;
            default:
                throw new Error(`Unknown metric type: ${type}`);
        }
        this.metrics.set(name, metric);
        this.logger.debug({ name, type }, 'Custom metric registered');
    }
    /**
     * Get a registered metric by name
     */
    getMetric(name) {
        return this.metrics.get(name);
    }
    /**
     * Increment a counter metric
     */
    incrementCounter(name, labels, value = 1) {
        const metric = this.metrics.get(name);
        if (metric && metric instanceof promClient.Counter) {
            metric.inc(labels || {}, value);
        }
        else {
            this.logger.warn({ name }, 'Counter metric not found');
        }
    }
    /**
     * Set a gauge metric
     */
    setGauge(name, value, labels) {
        const metric = this.metrics.get(name);
        if (metric && metric instanceof promClient.Gauge) {
            metric.set(labels || {}, value);
        }
        else {
            this.logger.warn({ name }, 'Gauge metric not found');
        }
    }
    /**
     * Observe a histogram metric
     */
    observeHistogram(name, value, labels) {
        const metric = this.metrics.get(name);
        if (metric && metric instanceof promClient.Histogram) {
            metric.observe(labels || {}, value);
        }
        else {
            this.logger.warn({ name }, 'Histogram metric not found');
        }
    }
    /**
     * Create HTTP metrics middleware
     */
    createHttpMetricsMiddleware() {
        return (req, res, next) => {
            const route = req.route?.path || req.path || 'unknown';
            const method = req.method;
            // Track in-progress requests
            this.httpRequestsInProgress.inc({ method, route });
            // Track request duration
            const timer = this.httpRequestDuration.startTimer({ method, route });
            // Clean up on response finish
            res.on('finish', () => {
                const statusCode = res.statusCode.toString();
                // Update metrics
                timer({ status_code: statusCode });
                this.httpRequestTotal.inc({ method, route, status_code: statusCode });
                this.httpRequestsInProgress.dec({ method, route });
            });
            next();
        };
    }
    /**
     * Create metrics endpoint
     */
    createMetricsEndpoint() {
        const router = (0, express_1.Router)();
        router.get('/metrics', async (_req, res) => {
            try {
                res.set('Content-Type', this.registry.contentType);
                const metrics = await this.registry.metrics();
                res.end(metrics);
            }
            catch (error) {
                this.logger.error({ err: error }, 'Failed to collect metrics');
                res.status(500).end();
            }
        });
        return router;
    }
    /**
     * Get the Prometheus registry
     */
    getRegistry() {
        return this.registry;
    }
}
exports.MetricsCollector = MetricsCollector;
/**
 * Common custom metrics for microservices
 */
exports.CommonMetrics = {
    // Business metrics
    userRegistrations: {
        name: 'user_registrations_total',
        help: 'Total number of user registrations',
        type: 'counter',
        labelNames: ['user_type'],
    },
    activeUsers: {
        name: 'active_users_gauge',
        help: 'Number of active users',
        type: 'gauge',
        labelNames: ['user_type'],
    },
    // Database metrics
    databaseQueryDuration: {
        name: 'database_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        type: 'histogram',
        labelNames: ['operation', 'table'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    },
    databaseConnectionPool: {
        name: 'database_connection_pool_size',
        help: 'Size of database connection pool',
        type: 'gauge',
        labelNames: ['state'], // active, idle, waiting
    },
    // Cache metrics
    cacheHits: {
        name: 'cache_hits_total',
        help: 'Total number of cache hits',
        type: 'counter',
        labelNames: ['cache_name'],
    },
    cacheMisses: {
        name: 'cache_misses_total',
        help: 'Total number of cache misses',
        type: 'counter',
        labelNames: ['cache_name'],
    },
    // External service metrics
    externalServiceRequests: {
        name: 'external_service_requests_total',
        help: 'Total number of external service requests',
        type: 'counter',
        labelNames: ['service', 'method', 'status'],
    },
    externalServiceDuration: {
        name: 'external_service_duration_seconds',
        help: 'Duration of external service requests',
        type: 'histogram',
        labelNames: ['service', 'method'],
        buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10],
    },
    // Queue metrics
    queueSize: {
        name: 'queue_size',
        help: 'Current size of the queue',
        type: 'gauge',
        labelNames: ['queue_name'],
    },
    queueProcessingDuration: {
        name: 'queue_processing_duration_seconds',
        help: 'Duration of queue message processing',
        type: 'histogram',
        labelNames: ['queue_name', 'message_type'],
    },
};
