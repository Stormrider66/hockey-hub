"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLoggingMiddleware = exports.createLoggingMiddleware = void 0;
const Logger_1 = require("../utils/Logger");
const uuid_1 = require("uuid");
/**
 * Create logging middleware for Express applications
 */
function createLoggingMiddleware(options) {
    const logger = Logger_1.LoggerFactory.getLogger(options.serviceName);
    const skipPaths = new Set(options.skipPaths || ['/health', '/metrics', '/favicon.ico']);
    const sensitiveFields = new Set(options.sensitiveFields || [
        'password', 'token', 'secret', 'authorization', 'cookie', 'credit_card'
    ]);
    return (req, res, next) => {
        // Skip logging for certain paths
        if (skipPaths.has(req.path)) {
            return next();
        }
        // Generate request ID if not present
        if (!req.headers['x-request-id']) {
            req.headers['x-request-id'] = (0, uuid_1.v4)();
        }
        // Generate correlation ID if not present
        if (!req.headers['x-correlation-id']) {
            req.headers['x-correlation-id'] = req.headers['x-request-id'];
        }
        // Attach logger to request
        req.logger = logger.requestLogger(req);
        req.startTime = Date.now();
        // Log incoming request
        const requestLog = {
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        if (options.logHeaders) {
            requestLog.headers = sanitizeObject(req.headers, sensitiveFields);
        }
        if (options.logBody && req.body && Object.keys(req.body).length > 0) {
            requestLog.body = sanitizeObject(req.body, sensitiveFields);
        }
        req.logger?.info('Incoming request', requestLog);
        // Capture response
        const originalSend = res.send;
        let responseBody;
        res.send = function (data) {
            responseBody = data;
            return originalSend.call(this, data);
        };
        // Log response when finished
        res.on('finish', () => {
            const duration = Date.now() - (req.startTime || 0);
            logger.http(req, res, duration);
            // Log additional response details for errors
            if (res.statusCode >= 400) {
                const errorLog = {
                    statusCode: res.statusCode,
                    duration,
                    path: req.path,
                    method: req.method
                };
                if (responseBody) {
                    try {
                        const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                        errorLog.error = parsed.error || parsed.message || parsed;
                    }
                    catch {
                        errorLog.response = responseBody.substring(0, 500); // Limit size
                    }
                }
                req.logger?.warn('Request failed', errorLog);
            }
        });
        next();
    };
}
exports.createLoggingMiddleware = createLoggingMiddleware;
/**
 * Sanitize an object by removing sensitive fields
 */
function sanitizeObject(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const lowerKey = key.toLowerCase();
            // Check if field is sensitive
            const isSensitive = Array.from(sensitiveFields).some(field => lowerKey.includes(field.toLowerCase()));
            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitized[key] = sanitizeObject(obj[key], sensitiveFields);
            }
            else {
                sanitized[key] = obj[key];
            }
        }
    }
    return sanitized;
}
/**
 * Error logging middleware
 */
function errorLoggingMiddleware(serviceName) {
    const logger = Logger_1.LoggerFactory.getLogger(serviceName);
    return (err, req, res, next) => {
        const duration = Date.now() - (req.startTime || 0);
        const errorContext = {
            method: req.method,
            path: req.path,
            statusCode: err.statusCode || 500,
            duration,
            correlationId: req.headers['x-correlation-id'],
            requestId: req.headers['x-request-id'],
            userId: req.user?.userId,
            errorCode: err.code,
            errorName: err.name,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        };
        // Log based on error type
        if (err.isOperational) {
            logger.warn(`Operational error: ${err.message}`, errorContext);
        }
        else {
            logger.error(`System error: ${err.message}`, err, errorContext);
        }
        next(err);
    };
}
exports.errorLoggingMiddleware = errorLoggingMiddleware;
