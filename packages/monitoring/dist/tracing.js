"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceMethod = exports.TracingManager = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const exporter_prometheus_1 = require("@opentelemetry/exporter-prometheus");
const api_1 = require("@opentelemetry/api");
class TracingManager {
    constructor(config) {
        this.config = config;
        this.sdk = null;
        this.isInitialized = false;
        if (config.enabled !== false) {
            this.initialize();
        }
    }
    initialize() {
        try {
            // Configure Jaeger exporter
            const jaegerExporter = new exporter_jaeger_1.JaegerExporter({
                endpoint: this.config.jaegerEndpoint || process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
            });
            // Configure Prometheus metrics exporter
            const prometheusExporter = new exporter_prometheus_1.PrometheusExporter({
                port: parseInt(process.env.PROMETHEUS_PORT || '9464'),
            });
            // Initialize SDK
            this.sdk = new sdk_node_1.NodeSDK({
                serviceName: this.config.serviceName,
                traceExporter: jaegerExporter,
                metricReader: prometheusExporter,
                instrumentations: [
                    (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                        // Disable fs instrumentation as it's too noisy
                        '@opentelemetry/instrumentation-fs': {
                            enabled: false,
                        },
                        // Configure HTTP instrumentation
                        '@opentelemetry/instrumentation-http': {
                            enabled: true,
                            ignoreIncomingRequestHook: (req) => {
                                // Ignore health checks and metrics endpoints
                                const url = req.url || '';
                                return url.includes('/health') || url.includes('/metrics');
                            },
                        },
                        // Configure Express instrumentation
                        '@opentelemetry/instrumentation-express': {
                            enabled: true,
                        },
                        // Configure PostgreSQL instrumentation
                        '@opentelemetry/instrumentation-pg': {
                            enabled: true,
                        }
                    }),
                ],
            });
            this.sdk.start();
            this.tracer = api_1.trace.getTracer(this.config.serviceName);
            this.isInitialized = true;
            console.log(`[Tracing] OpenTelemetry initialized for service: ${this.config.serviceName}`);
        }
        catch (error) {
            console.error('[Tracing] Failed to initialize OpenTelemetry:', error);
        }
    }
    // Create a custom span
    createSpan(name, options) {
        if (!this.isInitialized || !this.tracer) {
            return {
                setAttributes: () => { },
                setStatus: () => { },
                recordException: () => { },
                end: () => { },
                addEvent: () => { }
            };
        }
        return this.tracer.startSpan(name, {
            kind: options?.kind || api_1.SpanKind.INTERNAL,
            attributes: options?.attributes || {}
        });
    }
    // Trace a function execution
    traceFunction(name, fn, attributes) {
        if (!this.isInitialized) {
            return fn();
        }
        const span = this.createSpan(name, { attributes });
        try {
            const result = fn();
            if (result instanceof Promise) {
                return result
                    .then((value) => {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                    span.end();
                    return value;
                })
                    .catch((error) => {
                    span.recordException(error);
                    span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.message });
                    span.end();
                    throw error;
                });
            }
            else {
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.end();
                return result;
            }
        }
        catch (error) {
            span.recordException(error);
            span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.message });
            span.end();
            throw error;
        }
    }
    // Trace middleware for Express
    traceMiddleware() {
        return (req, res, next) => {
            if (!this.isInitialized) {
                return next();
            }
            const span = this.createSpan(`${req.method} ${req.route?.path || req.path}`, {
                kind: api_1.SpanKind.SERVER,
                attributes: {
                    'http.method': req.method,
                    'http.url': req.url,
                    'http.user_agent': req.get('User-Agent'),
                    'user.id': req.user?.id,
                    'organization.id': req.user?.organizationId,
                    'correlation.id': req.correlationId
                }
            });
            // Add span to request context
            req.span = span;
            res.on('finish', () => {
                span.setAttributes({
                    'http.status_code': res.statusCode,
                    'http.response.size': res.get('content-length')
                });
                if (res.statusCode >= 400) {
                    span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                }
                else {
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                }
                span.end();
            });
            next();
        };
    }
    // Database operation tracing
    traceDatabaseOperation(operation, table, query, fn) {
        return this.traceFunction(`db.${operation}`, fn, {
            'db.operation': operation,
            'db.table': table,
            'db.statement': query,
            'db.system': 'postgresql'
        });
    }
    // External service call tracing
    traceExternalCall(serviceName, operation, fn) {
        return this.traceFunction(`external.${serviceName}.${operation}`, fn, {
            'service.name': serviceName,
            'service.operation': operation
        });
    }
    // Shutdown tracing
    async shutdown() {
        if (this.sdk) {
            await this.sdk.shutdown();
            console.log('[Tracing] OpenTelemetry shutdown complete');
        }
    }
}
exports.TracingManager = TracingManager;
// Performance decorator for class methods
function TraceMethod(operationName) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const name = operationName || `${target.constructor.name}.${propertyKey}`;
            if (this.tracingManager) {
                return this.tracingManager.traceFunction(name, () => originalMethod.apply(this, args));
            }
            else {
                console.warn(`TracingManager not found on 'this' for ${name}. Executing original method without tracing.`);
                return originalMethod.apply(this, args);
            }
        };
        return descriptor;
    };
}
exports.TraceMethod = TraceMethod;
