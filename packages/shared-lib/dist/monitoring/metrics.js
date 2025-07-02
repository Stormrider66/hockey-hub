"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateActiveUsers = exports.trackUserRegistration = exports.trackCacheAccess = exports.trackWebSocketDisconnection = exports.updateWebSocketConnections = exports.trackChatMessage = exports.trackDatabaseQuery = exports.metricsMiddleware = exports.activeUsers = exports.userRegistrations = exports.cacheMisses = exports.cacheHits = exports.websocketDisconnections = exports.websocketConnections = exports.chatEncryptionFailures = exports.chatMessageQueueSize = exports.chatMessagesTotal = exports.dbConnectionPool = exports.dbQueryDuration = exports.httpRequestDuration = exports.httpRequestsTotal = exports.metricsRegistry = void 0;
const prom_client_1 = require("prom-client");
// Create a custom registry
exports.metricsRegistry = new prom_client_1.Registry();
// Default metrics
const prom_client_2 = require("prom-client");
(0, prom_client_2.collectDefaultMetrics)({ register: exports.metricsRegistry });
// HTTP metrics
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [exports.metricsRegistry],
});
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [exports.metricsRegistry],
});
// Database metrics
exports.dbQueryDuration = new prom_client_1.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
    registers: [exports.metricsRegistry],
});
exports.dbConnectionPool = new prom_client_1.Gauge({
    name: 'db_connection_pool_size',
    help: 'Number of connections in the pool',
    labelNames: ['state'],
    registers: [exports.metricsRegistry],
});
// Chat system metrics
exports.chatMessagesTotal = new prom_client_1.Counter({
    name: 'chat_messages_total',
    help: 'Total number of chat messages',
    labelNames: ['type', 'status'],
    registers: [exports.metricsRegistry],
});
exports.chatMessageQueueSize = new prom_client_1.Gauge({
    name: 'chat_message_queue_size',
    help: 'Number of messages in processing queue',
    registers: [exports.metricsRegistry],
});
exports.chatEncryptionFailures = new prom_client_1.Counter({
    name: 'chat_encryption_failures_total',
    help: 'Total number of encryption failures',
    registers: [exports.metricsRegistry],
});
exports.websocketConnections = new prom_client_1.Gauge({
    name: 'websocket_connections',
    help: 'Number of active WebSocket connections',
    registers: [exports.metricsRegistry],
});
exports.websocketDisconnections = new prom_client_1.Counter({
    name: 'websocket_disconnections_total',
    help: 'Total number of WebSocket disconnections',
    labelNames: ['reason'],
    registers: [exports.metricsRegistry],
});
// Cache metrics
exports.cacheHits = new prom_client_1.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache'],
    registers: [exports.metricsRegistry],
});
exports.cacheMisses = new prom_client_1.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache'],
    registers: [exports.metricsRegistry],
});
// Business metrics
exports.userRegistrations = new prom_client_1.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['role'],
    registers: [exports.metricsRegistry],
});
exports.activeUsers = new prom_client_1.Gauge({
    name: 'active_users',
    help: 'Number of active users in the last 24 hours',
    labelNames: ['role'],
    registers: [exports.metricsRegistry],
});
// Middleware to collect HTTP metrics
function metricsMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const labels = {
            method: req.method,
            path: req.route?.path || req.path,
            status: res.statusCode.toString(),
        };
        exports.httpRequestsTotal.inc(labels);
        exports.httpRequestDuration.observe(labels, duration);
    });
    next();
}
exports.metricsMiddleware = metricsMiddleware;
// Helper functions for tracking metrics
function trackDatabaseQuery(operation, table, duration) {
    exports.dbQueryDuration.observe({ operation, table }, duration);
}
exports.trackDatabaseQuery = trackDatabaseQuery;
function trackChatMessage(type, status) {
    exports.chatMessagesTotal.inc({ type, status });
}
exports.trackChatMessage = trackChatMessage;
function updateWebSocketConnections(delta) {
    exports.websocketConnections.inc(delta);
}
exports.updateWebSocketConnections = updateWebSocketConnections;
function trackWebSocketDisconnection(reason) {
    exports.websocketDisconnections.inc({ reason });
}
exports.trackWebSocketDisconnection = trackWebSocketDisconnection;
function trackCacheAccess(cacheName, hit) {
    if (hit) {
        exports.cacheHits.inc({ cache: cacheName });
    }
    else {
        exports.cacheMisses.inc({ cache: cacheName });
    }
}
exports.trackCacheAccess = trackCacheAccess;
function trackUserRegistration(role) {
    exports.userRegistrations.inc({ role });
}
exports.trackUserRegistration = trackUserRegistration;
function updateActiveUsers(role, count) {
    exports.activeUsers.set({ role }, count);
}
exports.updateActiveUsers = updateActiveUsers;
