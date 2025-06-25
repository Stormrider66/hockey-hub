"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceQueueOperation = exports.traceHttpRequest = exports.traceDatabaseOperation = exports.addSpanEvent = exports.addSpanAttributes = exports.withSpan = exports.createSpan = exports.getTracer = exports.shutdownTracing = exports.initializeTracing = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const api_1 = require("@opentelemetry/api");
let sdk = null;
/**
 * Initialize OpenTelemetry tracing
 */
function initializeTracing(config) {
    const { serviceName, serviceVersion = '1.0.0', environment = process.env.NODE_ENV || 'development', otlpEndpoint = process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces', enabled = process.env.ENABLE_TRACING === 'true', logger, } = config;
    if (!enabled) {
        logger.info('Tracing is disabled');
        return;
    }
    try {
        const resource = new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
            [semantic_conventions_1.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
        });
        const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: otlpEndpoint,
            headers: {},
        });
        sdk = new sdk_node_1.NodeSDK({
            resource,
            traceExporter,
            instrumentations: [
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                    '@opentelemetry/instrumentation-fs': {
                        enabled: false, // Disable fs instrumentation to reduce noise
                    },
                }),
            ],
        });
        sdk.start();
        logger.info({ serviceName, otlpEndpoint }, 'Tracing initialized');
    }
    catch (error) {
        logger.error({ err: error }, 'Failed to initialize tracing');
    }
}
exports.initializeTracing = initializeTracing;
/**
 * Shutdown tracing gracefully
 */
async function shutdownTracing() {
    if (sdk) {
        await sdk.shutdown();
        sdk = null;
    }
}
exports.shutdownTracing = shutdownTracing;
/**
 * Get the current tracer
 */
function getTracer(name) {
    return api_1.trace.getTracer(name || 'default');
}
exports.getTracer = getTracer;
/**
 * Create a new span
 */
function createSpan(name, options) {
    const tracer = getTracer();
    return tracer.startSpan(name, options);
}
exports.createSpan = createSpan;
/**
 * Wrap a function with a span
 */
async function withSpan(name, fn, options) {
    const span = createSpan(name, options);
    try {
        const result = await api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), () => fn(span));
        span.setStatus({ code: api_1.SpanStatusCode.OK });
        return result;
    }
    catch (error) {
        span.setStatus({
            code: api_1.SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        if (error instanceof Error) {
            span.recordException(error);
        }
        throw error;
    }
    finally {
        span.end();
    }
}
exports.withSpan = withSpan;
/**
 * Add attributes to the current span
 */
function addSpanAttributes(attributes) {
    const span = api_1.trace.getActiveSpan();
    if (span) {
        span.setAttributes(attributes);
    }
}
exports.addSpanAttributes = addSpanAttributes;
/**
 * Add an event to the current span
 */
function addSpanEvent(name, attributes) {
    const span = api_1.trace.getActiveSpan();
    if (span) {
        span.addEvent(name, attributes);
    }
}
exports.addSpanEvent = addSpanEvent;
/**
 * Database operation tracing helper
 */
async function traceDatabaseOperation(operation, query, fn) {
    return withSpan(`db.${operation}`, async (span) => {
        span.setAttributes({
            'db.system': 'postgresql',
            'db.operation': operation,
            'db.statement': query.substring(0, 500), // Truncate long queries
        });
        const startTime = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            span.setAttributes({
                'db.duration': duration,
                'db.rows_affected': result?.rowCount || 0,
            });
            return result;
        }
        catch (error) {
            span.setAttributes({
                'db.error': true,
                'db.error_message': error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }, { kind: api_1.SpanKind.CLIENT });
}
exports.traceDatabaseOperation = traceDatabaseOperation;
/**
 * HTTP request tracing helper
 */
async function traceHttpRequest(method, url, fn) {
    return withSpan(`http.${method.toLowerCase()}`, async (span) => {
        span.setAttributes({
            'http.method': method,
            'http.url': url,
            'http.target': new URL(url).pathname,
        });
        try {
            const result = await fn();
            // If result has status code, add it
            if (result?.status) {
                span.setAttributes({
                    'http.status_code': result.status,
                });
            }
            return result;
        }
        catch (error) {
            if (error?.response?.status) {
                span.setAttributes({
                    'http.status_code': error.response.status,
                });
            }
            throw error;
        }
    }, { kind: api_1.SpanKind.CLIENT });
}
exports.traceHttpRequest = traceHttpRequest;
/**
 * Message queue operation tracing helper
 */
async function traceQueueOperation(operation, queueName, messageType, fn) {
    return withSpan(`queue.${operation}`, async (span) => {
        span.setAttributes({
            'messaging.system': 'nats',
            'messaging.destination': queueName,
            'messaging.operation': operation,
            'messaging.message_type': messageType,
        });
        return fn();
    }, { kind: operation === 'publish' ? api_1.SpanKind.PRODUCER : api_1.SpanKind.CONSUMER });
}
exports.traceQueueOperation = traceQueueOperation;
