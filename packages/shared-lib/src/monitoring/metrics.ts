import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create a custom registry
export const metricsRegistry = new Registry();

// Default metrics
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register: metricsRegistry });

// HTTP metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [metricsRegistry],
});

export const dbConnectionPool = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Number of connections in the pool',
  labelNames: ['state'],
  registers: [metricsRegistry],
});

// Chat system metrics
export const chatMessagesTotal = new Counter({
  name: 'chat_messages_total',
  help: 'Total number of chat messages',
  labelNames: ['type', 'status'],
  registers: [metricsRegistry],
});

export const chatMessageQueueSize = new Gauge({
  name: 'chat_message_queue_size',
  help: 'Number of messages in processing queue',
  registers: [metricsRegistry],
});

export const chatEncryptionFailures = new Counter({
  name: 'chat_encryption_failures_total',
  help: 'Total number of encryption failures',
  registers: [metricsRegistry],
});

export const websocketConnections = new Gauge({
  name: 'websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [metricsRegistry],
});

export const websocketDisconnections = new Counter({
  name: 'websocket_disconnections_total',
  help: 'Total number of WebSocket disconnections',
  labelNames: ['reason'],
  registers: [metricsRegistry],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache'],
  registers: [metricsRegistry],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache'],
  registers: [metricsRegistry],
});

// Business metrics
export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['role'],
  registers: [metricsRegistry],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users in the last 24 hours',
  labelNames: ['role'],
  registers: [metricsRegistry],
});

// Middleware to collect HTTP metrics
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode.toString(),
    };
    
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });
  
  next();
}

// Helper functions for tracking metrics
export function trackDatabaseQuery(operation: string, table: string, duration: number) {
  dbQueryDuration.observe({ operation, table }, duration);
}

export function trackChatMessage(type: string, status: 'success' | 'failure') {
  chatMessagesTotal.inc({ type, status });
}

export function updateWebSocketConnections(delta: number) {
  websocketConnections.inc(delta);
}

export function trackWebSocketDisconnection(reason: string) {
  websocketDisconnections.inc({ reason });
}

export function trackCacheAccess(cacheName: string, hit: boolean) {
  if (hit) {
    cacheHits.inc({ cache: cacheName });
  } else {
    cacheMisses.inc({ cache: cacheName });
  }
}

export function trackUserRegistration(role: string) {
  userRegistrations.inc({ role });
}

export function updateActiveUsers(role: string, count: number) {
  activeUsers.set({ role }, count);
}