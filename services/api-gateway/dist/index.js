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
    'http://127.0.0.1:3002', // Communication Service (updated port)
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
// Helper to build proxy with common settings
function buildProxy(target, stripPrefix = '') {
    // Validate target to prevent SSRF
    if (!validateServiceTarget(target)) {
        throw new Error(`Invalid service target: ${target}`);
    }
    const config = {
        target,
        changeOrigin: true,
        logLevel: 'debug',
        timeout: 10000, // 10 second timeout
        onProxyReq: (proxyReq, req, _res) => {
            // Forward cookies and other headers
            if (req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            // Forward Authorization header if present
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            // Forward user data from JWT as a header
            if (req.user) {
                proxyReq.setHeader('X-User-Data', JSON.stringify(req.user));
            }
            // If no Authorization header but we have a validated user, add it
            if (!req.headers.authorization && req.user && req.headers.cookie) {
                // Extract access token from cookies and add as Bearer token
                const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {});
                if (cookies.accessToken) {
                    proxyReq.setHeader('Authorization', `Bearer ${cookies.accessToken}`);
                }
            }
        },
        onProxyRes: (proxyRes, _req, res) => {
            // Forward Set-Cookie headers back to client
            if (proxyRes.headers['set-cookie']) {
                res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
            }
        },
        onError: (err, req, res) => {
            console.error(`[API Gateway] Proxy error for ${req.url}:`, err.message);
            res.status(502).json({ error: 'Service temporarily unavailable' });
        },
    };
    // Only add pathRewrite if stripPrefix is provided and not empty
    if (stripPrefix) {
        config.pathRewrite = { [stripPrefix]: '' };
    }
    return (0, http_proxy_middleware_1.createProxyMiddleware)(config);
}
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Apply rate limiting to all requests
app.use(generalRateLimit);
// Basic Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3002', 'http://localhost:3000'], // Frontend and any other allowed origins
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
})); // Enable CORS for all routes
app.use((0, helmet_1.default)()); // Adds various security headers
// Only parse JSON for non-proxied routes (like health check)
// Proxied routes should not have their body parsed by the gateway
// --- Health Check ---
app.get('/api/gateway/health', (_req, res) => {
    res.status(200).json({ status: 'API Gateway is running' });
});
// --- Public Auth Routes (no JWT needed) with strict rate limiting ---
console.log('[API Gateway] Setting up auth proxy to http://127.0.0.1:3001');
app.all('/api/v1/auth/*', authRateLimit, express_1.default.json(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[API Gateway] Manual proxy: ${req.method} ${req.url}`);
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    try {
        const targetUrl = `http://127.0.0.1:3001${req.url}`;
        // Validate target URL to prevent SSRF
        if (!validateServiceTarget(targetUrl)) {
            console.error(`[API Gateway] SSRF attempt blocked: ${targetUrl}`);
            return res.status(400).json({ error: 'Invalid request target' });
        }
        console.log(`[API Gateway] Forwarding to: ${targetUrl}`);
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
            body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
        });
        console.log(`[API Gateway] User Service responded with ${response.status}`);
        // Forward response status
        res.status(response.status);
        // Forward all response headers including Set-Cookie
        response.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
                // Handle Set-Cookie specially to preserve multiple values
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
    }
    catch (error) {
        console.error(`[API Gateway] Manual proxy error:`, error);
        res.status(502).json({ error: 'Service temporarily unavailable', service: 'user-service' });
    }
}));
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
app.use('/api/v1/planning', buildProxy('http://127.0.0.1:3006', '^/api/v1/planning'));
// Statistics Service
app.use('/api/v1/statistics', buildProxy('http://127.0.0.1:3007'));
// Payment Service
app.use('/api/v1/payment', strictRateLimit, buildProxy('http://127.0.0.1:3008'));
// Admin Service
app.use('/api/v1/admin', strictRateLimit, buildProxy('http://127.0.0.1:3009'));
// Add more service proxies here following the same pattern...
// Catch-all 404
app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not Found in API Gateway' });
});
// --- Start Server --- //
app.listen(PORT, () => {
    console.log(`[API Gateway] Server listening on port ${PORT}`);
});
