"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const authMiddleware_1 = require("./middleware/authMiddleware");
const node_fetch_1 = __importDefault(require("node-fetch"));
const url_1 = __importDefault(require("url"));
// Import monitoring package
const monitoring_1 = require("@hockey-hub/monitoring");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Initialize monitoring
const monitoring = (0, monitoring_1.setupSimpleMonitoring)(app, 'api-gateway', {
    service: {
        version: process.env.SERVICE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    },
    tracing: {
        enabled: process.env.TRACING_ENABLED !== 'false',
        jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
    },
    metrics: {
        enabled: process.env.METRICS_ENABLED !== 'false',
        prefix: 'hockey_hub_gateway'
    },
    healthCheck: {
        enabled: true,
        path: '/health',
        checks: []
    }
});
const { logger, healthCheckManager, circuitBreakerManager, businessMetrics } = monitoring;
// Add health checks for downstream services
const serviceHealthChecks = [
    { name: 'user-service', url: 'http://127.0.0.1:3001/health', critical: true },
    { name: 'calendar-service', url: 'http://127.0.0.1:3003/health', critical: false },
    { name: 'training-service', url: 'http://127.0.0.1:3004/health', critical: false },
    { name: 'medical-service', url: 'http://127.0.0.1:3005/health', critical: false },
    { name: 'planning-service', url: 'http://127.0.0.1:3006/health', critical: false },
    { name: 'statistics-service', url: 'http://127.0.0.1:3007/health', critical: false },
    { name: 'payment-service', url: 'http://127.0.0.1:3008/health', critical: false },
    { name: 'admin-service', url: 'http://127.0.0.1:3009/health', critical: false }
];
serviceHealthChecks.forEach(({ name, url, critical }) => {
    healthCheckManager.addCheck(monitoring_1.HealthCheckManager.createExternalServiceCheck(name, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield (0, node_fetch_1.default)(url, { timeout: 5000 });
            return response.ok;
        }
        catch (_a) {
            return false;
        }
    })));
});
// Rate limiting configurations
const generalRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs for sensitive operations
    message: { error: 'Too many requests for this operation, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Allowed service targets for SSRF protection
const ALLOWED_SERVICES = new Set([
    'http://127.0.0.1:3001', // User Service
    'http://127.0.0.1:3002', // Communication Service
    'http://127.0.0.1:3003', // Calendar Service
    'http://127.0.0.1:3004', // Training Service
    'http://127.0.0.1:3005', // Medical Service
    'http://127.0.0.1:3006', // Planning Service
    'http://127.0.0.1:3007', // Statistics Service
    'http://127.0.0.1:3008', // Payment Service
    'http://127.0.0.1:3009', // Admin Service
]);
// Validate service target to prevent SSRF
function validateServiceTarget(targetUrl) {
    try {
        const parsed = url_1.default.parse(targetUrl);
        const baseUrl = `${parsed.protocol}//${parsed.host}`;
        return ALLOWED_SERVICES.has(baseUrl);
    }
    catch (_a) {
        return false;
    }
}
// Enhanced proxy builder with circuit breaker
function buildProxy(target, stripPrefix = '') {
    // Validate target to prevent SSRF
    if (!validateServiceTarget(target)) {
        throw new Error(`Invalid service target: ${target}`);
    }
    const serviceName = target.replace('http://127.0.0.1:', '').replace(/:\d+$/, '');
    const config = {
        target,
        changeOrigin: true,
        logLevel: 'error', // Reduce noise, we have our own logging
        timeout: 10000, // 10 second timeout
        onProxyReq: (proxyReq, req, _res) => {
            var _a;
            // Forward correlation ID and other headers
            if (req.correlationId) {
                proxyReq.setHeader('X-Correlation-ID', req.correlationId);
            }
            if (req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            if (req.user) {
                proxyReq.setHeader('X-User-ID', req.user.id);
                proxyReq.setHeader('X-Organization-ID', req.user.organizationId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            // Log proxy request
            logger.debug({
                type: 'proxy_request',
                correlationId: req.correlationId,
                target,
                method: req.method,
                path: req.path,
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
            }, `Proxying request to ${target}`);
        },
        onProxyRes: (proxyRes, req, _res) => {
            var _a;
            // Log proxy response
            logger.debug({
                type: 'proxy_response',
                correlationId: req.correlationId,
                target,
                method: req.method,
                path: req.path,
                statusCode: proxyRes.statusCode,
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
            }, `Received response from ${target}`);
            // Track metrics
            if (businessMetrics) {
                const isError = proxyRes.statusCode >= 400;
                if (isError) {
                    logger.warn({
                        type: 'proxy_error',
                        correlationId: req.correlationId,
                        target,
                        statusCode: proxyRes.statusCode,
                        method: req.method,
                        path: req.path
                    }, `Error response from ${target}`);
                }
            }
        },
        onError: (err, req, res) => {
            var _a;
            logger.error({
                type: 'proxy_error',
                correlationId: req.correlationId,
                target,
                error: err.message,
                method: req.method,
                path: req.path,
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
            }, `Proxy error to ${target}: ${err.message}`);
            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Service temporarily unavailable',
                    service: serviceName,
                    correlationId: req.correlationId,
                    timestamp: new Date().toISOString()
                });
            }
        }
    };
    if (stripPrefix) {
        config.pathRewrite = {
            [`^${stripPrefix}`]: ''
        };
    }
    return (0, http_proxy_middleware_1.createProxyMiddleware)(config);
}
// Enhanced manual proxy for auth routes with circuit breaker
function manualProxyWithCircuitBreaker(req, res, targetService) {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceName = targetService.replace('http://127.0.0.1:', '');
        return circuitBreakerManager.executeWithBreaker(`proxy-${serviceName}`, () => __awaiter(this, void 0, void 0, function* () {
            const targetUrl = `${targetService}${req.url}`;
            // Validate target URL to prevent SSRF
            if (!validateServiceTarget(targetUrl)) {
                logger.error({
                    type: 'ssrf_attempt',
                    correlationId: req.correlationId,
                    targetUrl,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip
                }, `SSRF attempt blocked: ${targetUrl}`);
                throw new Error('Invalid request target');
            }
            logger.debug({
                type: 'manual_proxy',
                correlationId: req.correlationId,
                targetUrl,
                method: req.method
            }, `Forwarding to: ${targetUrl}`);
            // Forward all headers including cookies
            const forwardHeaders = {};
            Object.keys(req.headers).forEach(key => {
                if (key !== 'host') { // Don't forward host header
                    forwardHeaders[key] = req.headers[key];
                }
            });
            const response = yield (0, node_fetch_1.default)(targetUrl, {
                method: req.method,
                headers: forwardHeaders,
                body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
                timeout: 10000
            });
            logger.debug({
                type: 'manual_proxy_response',
                correlationId: req.correlationId,
                statusCode: response.status,
                service: serviceName
            }, `${serviceName} responded with ${response.status}`);
            // Forward response status
            res.status(response.status);
            // Forward all response headers including Set-Cookie
            response.headers.forEach((value, key) => {
                if (key.toLowerCase() === 'set-cookie') {
                    const setCookieValues = response.headers.raw()['set-cookie'];
                    if (setCookieValues) {
                        res.setHeader('Set-Cookie', setCookieValues);
                    }
                }
                else {
                    res.setHeader(key, value);
                }
            });
            const data = yield response.text();
            res.send(data);
        }), () => __awaiter(this, void 0, void 0, function* () {
            // Fallback when circuit breaker is open
            logger.warn({
                type: 'circuit_breaker_fallback',
                correlationId: req.correlationId,
                service: serviceName
            }, `Circuit breaker open for ${serviceName}, using fallback`);
            res.status(503).json({
                error: 'Service temporarily unavailable',
                service: serviceName,
                correlationId: req.correlationId,
                timestamp: new Date().toISOString(),
                reason: 'circuit_breaker_open'
            });
        }));
    });
}
// Apply rate limiting to all requests
app.use(generalRateLimit);
// Basic Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3002', 'http://localhost:3000'], // Frontend and any other allowed origins
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
}));
app.use((0, helmet_1.default)()); // Adds various security headers
// --- Health Check ---
// Note: The monitoring package already sets up /health, /health/live, /health/ready
// We can add a gateway-specific health check
app.get('/api/gateway/health', (0, monitoring_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gatewayHealth = yield healthCheckManager.runHealthChecks();
    res.status(gatewayHealth.status === 'healthy' ? 200 : 503).json(Object.assign(Object.assign({}, gatewayHealth), { gateway: {
            version: process.env.SERVICE_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime()
        } }));
})));
// --- Public Auth Routes (no JWT needed) with strict rate limiting ---
logger.info('[API Gateway] Setting up auth proxy to http://127.0.0.1:3001');
app.all('/api/v1/auth/*', authRateLimit, express_1.default.json(), (0, monitoring_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.info({
        type: 'auth_request',
        correlationId: req.correlationId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    }, `Auth request: ${req.method} ${req.url}`);
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    yield manualProxyWithCircuitBreaker(req, res, 'http://127.0.0.1:3001');
})));
// --- Authentication Middleware (protects everything below) ---
app.use('/api', authMiddleware_1.authenticate);
// --- Protected Proxies with rate limiting ---
// Medical Service - strip /medical prefix when forwarding
app.use('/api/v1/medical', strictRateLimit, buildProxy('http://127.0.0.1:3005', '^/api/v1/medical'));
// User Service (general)
app.use('/api/v1/users', buildProxy('http://127.0.0.1:3001'));
// Calendar Service
app.use('/api/v1/calendar', buildProxy('http://127.0.0.1:3003'));
// Training Service
app.use('/api/v1/training', buildProxy('http://127.0.0.1:3004'));
// Communication Service
app.use('/api/v1/communication', buildProxy('http://127.0.0.1:3002'));
// Planning Service
app.use('/api/v1/planning', buildProxy('http://127.0.0.1:3006'));
// Statistics Service
app.use('/api/v1/statistics', buildProxy('http://127.0.0.1:3007'));
// Payment Service
app.use('/api/v1/payment', strictRateLimit, buildProxy('http://127.0.0.1:3008'));
// Admin Service
app.use('/api/v1/admin', strictRateLimit, buildProxy('http://127.0.0.1:3009'));
// Catch-all 404
app.use('*', (_req, res) => {
    res.status(404).json({
        error: 'Not Found in API Gateway',
        timestamp: new Date().toISOString()
    });
});
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    logger.info('Received SIGINT, starting graceful shutdown...');
    // Shutdown monitoring
    yield monitoring.shutdown();
    // Close server
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    logger.info('Received SIGTERM, starting graceful shutdown...');
    // Shutdown monitoring
    yield monitoring.shutdown();
    // Close server
    process.exit(0);
}));
app.listen(PORT, () => {
    logger.info({
        port: PORT,
        environment: process.env.NODE_ENV,
        version: process.env.SERVICE_VERSION
    }, `🚀 API Gateway listening on port ${PORT}`);
});
