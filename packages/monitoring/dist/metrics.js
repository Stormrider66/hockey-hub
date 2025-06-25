"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableDefaultMetrics = exports.MetricsCollector = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
class MetricsCollector {
    constructor(serviceName, prefix = 'hockey_hub') {
        this.serviceName = serviceName;
        this.prefix = prefix;
        this.customMetrics = new Map();
        // Initialize default HTTP metrics
        this.httpRequestDuration = new prom_client_1.default.Histogram({
            name: `${prefix}_http_request_duration_seconds`,
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code', 'service'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        });
        this.httpRequestTotal = new prom_client_1.default.Counter({
            name: `${prefix}_http_requests_total`,
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code', 'service']
        });
        this.httpRequestSizeBytes = new prom_client_1.default.Histogram({
            name: `${prefix}_http_request_size_bytes`,
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route', 'service'],
            buckets: [1, 100, 1000, 10000, 100000, 1000000]
        });
        this.httpResponseSizeBytes = new prom_client_1.default.Histogram({
            name: `${prefix}_http_response_size_bytes`,
            help: 'Size of HTTP responses in bytes',
            labelNames: ['method', 'route', 'status_code', 'service'],
            buckets: [1, 100, 1000, 10000, 100000, 1000000, 10000000]
        });
        this.activeConnections = new prom_client_1.default.Gauge({
            name: `${prefix}_active_connections`,
            help: 'Number of active connections',
            labelNames: ['service']
        });
        // Register metrics
        prom_client_1.default.register.registerMetric(this.httpRequestDuration);
        prom_client_1.default.register.registerMetric(this.httpRequestTotal);
        prom_client_1.default.register.registerMetric(this.httpRequestSizeBytes);
        prom_client_1.default.register.registerMetric(this.httpResponseSizeBytes);
        prom_client_1.default.register.registerMetric(this.activeConnections);
    }
    // HTTP metrics middleware
    httpMetricsMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            // Track request size
            const requestSize = parseInt(req.get('content-length') || '0', 10);
            if (requestSize > 0) {
                this.httpRequestSizeBytes
                    .labels(req.method, req.route?.path || req.path, this.serviceName)
                    .observe(requestSize);
            }
            // Increment active connections
            this.activeConnections.labels(this.serviceName).inc();
            res.on('finish', () => {
                const duration = (Date.now() - startTime) / 1000;
                const route = req.route?.path || req.path;
                const statusCode = res.statusCode.toString();
                // Record metrics
                this.httpRequestDuration
                    .labels(req.method, route, statusCode, this.serviceName)
                    .observe(duration);
                this.httpRequestTotal
                    .labels(req.method, route, statusCode, this.serviceName)
                    .inc();
                // Track response size
                const responseSize = parseInt(res.get('content-length') || '0', 10);
                if (responseSize > 0) {
                    this.httpResponseSizeBytes
                        .labels(req.method, route, statusCode, this.serviceName)
                        .observe(responseSize);
                }
                // Decrement active connections
                this.activeConnections.labels(this.serviceName).dec();
            });
            next();
        };
    }
    // Custom metric creation helpers
    createCounter(name, help, labelNames = []) {
        const fullName = `${this.prefix}_${name}`;
        const counter = new prom_client_1.default.Counter({
            name: fullName,
            help,
            labelNames: [...labelNames, 'service']
        });
        prom_client_1.default.register.registerMetric(counter);
        this.customMetrics.set(fullName, counter);
        return counter;
    }
    createGauge(name, help, labelNames = []) {
        const fullName = `${this.prefix}_${name}`;
        const gauge = new prom_client_1.default.Gauge({
            name: fullName,
            help,
            labelNames: [...labelNames, 'service']
        });
        prom_client_1.default.register.registerMetric(gauge);
        this.customMetrics.set(fullName, gauge);
        return gauge;
    }
    createHistogram(name, help, labelNames = [], buckets) {
        const fullName = `${this.prefix}_${name}`;
        const histogram = new prom_client_1.default.Histogram({
            name: fullName,
            help,
            labelNames: [...labelNames, 'service'],
            buckets
        });
        prom_client_1.default.register.registerMetric(histogram);
        this.customMetrics.set(fullName, histogram);
        return histogram;
    }
    // Business metrics helpers
    createBusinessMetrics() {
        return {
            // Authentication metrics
            loginAttempts: this.createCounter('login_attempts_total', 'Total login attempts', ['status']),
            tokenValidations: this.createCounter('token_validations_total', 'Total token validations', ['status']),
            // Database metrics
            databaseQueries: this.createHistogram('database_query_duration_seconds', 'Database query duration', ['operation', 'table']),
            databaseConnections: this.createGauge('database_connections_active', 'Active database connections'),
            // Training metrics
            trainingSessions: this.createCounter('training_sessions_total', 'Total training sessions', ['type', 'status']),
            exercisesExecuted: this.createCounter('exercises_executed_total', 'Total exercises executed', ['category']),
            // Medical metrics
            medicalDocuments: this.createCounter('medical_documents_total', 'Total medical documents', ['type']),
            treatmentPlans: this.createCounter('treatment_plans_total', 'Total treatment plans', ['status']),
            // Calendar metrics
            eventsScheduled: this.createCounter('events_scheduled_total', 'Total events scheduled', ['type']),
            resourceBookings: this.createCounter('resource_bookings_total', 'Total resource bookings', ['resource_type']),
            // Communication metrics
            messagesExchanged: this.createCounter('messages_exchanged_total', 'Total messages exchanged', ['type']),
            notificationsSent: this.createCounter('notifications_sent_total', 'Total notifications sent', ['channel'])
        };
    }
    // Get metrics endpoint handler
    getMetricsHandler() {
        return async (_req, res) => {
            try {
                res.set('Content-Type', prom_client_1.default.register.contentType);
                const metrics = await prom_client_1.default.register.metrics();
                res.send(metrics);
            }
            catch (error) {
                res.status(500).send('Error collecting metrics');
            }
        };
    }
    // Clear all metrics (useful for testing)
    clearMetrics() {
        prom_client_1.default.register.clear();
        this.customMetrics.clear();
    }
}
exports.MetricsCollector = MetricsCollector;
// Initialize default metrics collection
function enableDefaultMetrics(serviceName) {
    prom_client_1.default.collectDefaultMetrics({
        labels: { service: serviceName },
        prefix: 'hockey_hub_nodejs_'
    });
}
exports.enableDefaultMetrics = enableDefaultMetrics;
