"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildLogger = exports.requestLoggingMiddleware = exports.correlationMiddleware = exports.createLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const uuid_1 = require("uuid");
const isDevelopment = process.env.NODE_ENV === 'development';
// Default redaction paths for sensitive data
const DEFAULT_REDACTION_PATHS = [
    'password',
    'token',
    'authorization',
    'cookie',
    'session',
    'secret',
    'key',
    'ssn',
    'socialSecurityNumber',
    '*.password',
    '*.token',
    '*.authorization',
    '*.cookie',
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]'
];
function createLogger(config) {
    const redactionPaths = [...DEFAULT_REDACTION_PATHS, ...(config.redactionPaths || [])];
    return (0, pino_1.default)({
        level: config.level,
        base: {
            service: config.service,
            version: config.version || '1.0.0',
            environment: config.environment || process.env.NODE_ENV || 'development'
        },
        redact: {
            paths: redactionPaths,
            censor: '[REDACTED]'
        },
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
        ...(isDevelopment && {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            }
        })
    });
}
exports.createLogger = createLogger;
// Correlation ID middleware
function correlationMiddleware(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
    // Store correlation ID in request
    req.correlationId = correlationId;
    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);
    next();
}
exports.correlationMiddleware = correlationMiddleware;
// Request logging middleware
function requestLoggingMiddleware(logger) {
    return (req, res, next) => {
        const startTime = Date.now();
        const correlationId = req.correlationId || 'unknown';
        // Log incoming request
        logger.info({
            type: 'request_start',
            correlationId,
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user?.id,
            organizationId: req.user?.organizationId
        }, 'Incoming request');
        // Log response when finished
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const level = res.statusCode >= 400 ? 'warn' : 'info';
            logger[level]({
                type: 'request_complete',
                correlationId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration,
                userId: req.user?.id,
                organizationId: req.user?.organizationId
            }, 'Request completed');
        });
        next();
    };
}
exports.requestLoggingMiddleware = requestLoggingMiddleware;
// Create child logger with correlation ID
function createChildLogger(logger, req, metadata) {
    return logger.child({
        correlationId: req.correlationId,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        ...metadata
    });
}
exports.createChildLogger = createChildLogger;
