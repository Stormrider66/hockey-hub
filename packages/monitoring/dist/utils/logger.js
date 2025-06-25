"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogMessages = exports.createChildLogger = exports.createLogger = void 0;
const pino_1 = __importDefault(require("pino"));
/**
 * Creates a configured Pino logger instance with standardized settings
 */
function createLogger(config) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const level = config.level || process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
    const baseOptions = {
        name: config.service,
        level,
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => ({ level: label }),
            bindings: (bindings) => ({
                pid: bindings.pid,
                hostname: bindings.hostname,
                service: config.service,
                environment: process.env.NODE_ENV || 'development',
            }),
        },
        // Redact sensitive fields
        redact: {
            paths: [
                'password',
                'token',
                'accessToken',
                'refreshToken',
                'authorization',
                'cookie',
                '*.password',
                '*.token',
                '*.accessToken',
                '*.refreshToken',
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                ...(config.redact || []),
            ],
            censor: '[REDACTED]',
        },
        serializers: {
            req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                remoteAddress: req.socket?.remoteAddress,
                remotePort: req.socket?.remotePort,
            }),
            res: pino_1.default.stdSerializers.res,
            err: pino_1.default.stdSerializers.err,
        },
    };
    // Use pretty printing in development if requested
    if (isDevelopment && config.pretty !== false) {
        const transport = pino_1.default.transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                levelFirst: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        });
        return (0, pino_1.default)(baseOptions, transport);
    }
    return (0, pino_1.default)(baseOptions);
}
exports.createLogger = createLogger;
/**
 * Creates a child logger with additional context
 */
function createChildLogger(logger, context) {
    return logger.child(context);
}
exports.createChildLogger = createChildLogger;
/**
 * Standard log messages for consistency
 */
exports.LogMessages = {
    // Server lifecycle
    SERVER_STARTING: 'Server starting',
    SERVER_STARTED: 'Server started successfully',
    SERVER_STOPPING: 'Server shutting down',
    SERVER_STOPPED: 'Server stopped',
    // Database
    DB_CONNECTING: 'Connecting to database',
    DB_CONNECTED: 'Database connected successfully',
    DB_DISCONNECTED: 'Database disconnected',
    DB_ERROR: 'Database error occurred',
    DB_QUERY_SLOW: 'Slow database query detected',
    // HTTP
    HTTP_REQUEST_STARTED: 'HTTP request started',
    HTTP_REQUEST_COMPLETED: 'HTTP request completed',
    HTTP_REQUEST_FAILED: 'HTTP request failed',
    // Authentication
    AUTH_SUCCESS: 'Authentication successful',
    AUTH_FAILED: 'Authentication failed',
    AUTH_TOKEN_EXPIRED: 'Authentication token expired',
    AUTH_UNAUTHORIZED: 'Unauthorized access attempt',
    // Business operations
    OPERATION_STARTED: 'Operation started',
    OPERATION_COMPLETED: 'Operation completed successfully',
    OPERATION_FAILED: 'Operation failed',
    // Circuit breaker
    CIRCUIT_BREAKER_OPEN: 'Circuit breaker opened',
    CIRCUIT_BREAKER_HALF_OPEN: 'Circuit breaker half-open',
    CIRCUIT_BREAKER_CLOSED: 'Circuit breaker closed',
    // Health checks
    HEALTH_CHECK_PASSED: 'Health check passed',
    HEALTH_CHECK_FAILED: 'Health check failed',
};
