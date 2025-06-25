"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseQueryLogger = exports.createRequestLogger = void 0;
const pino_http_1 = __importDefault(require("pino-http"));
const correlation_1 = require("../utils/correlation");
const response_time_1 = __importDefault(require("response-time"));
const on_finished_1 = __importDefault(require("on-finished"));
/**
 * Creates a request logging middleware
 */
function createRequestLogger(options) {
    const { logger, excludePaths = ['/health', '/metrics'], slowRequestThreshold = 1000 } = options;
    // Create pino-http middleware
    const httpLogger = (0, pino_http_1.default)({
        logger,
        autoLogging: false, // We'll handle logging manually for more control
        genReqId: (req) => (0, correlation_1.getCorrelationId)(req),
        customLogLevel: (_req, res) => {
            if (res.statusCode >= 500)
                return 'error';
            if (res.statusCode >= 400)
                return 'warn';
            return 'info';
        },
    });
    return [
        // Add response time tracking
        (0, response_time_1.default)(),
        // Main logging middleware
        (req, res, next) => {
            // Skip logging for excluded paths
            if (excludePaths.some(path => req.path.startsWith(path))) {
                return next();
            }
            // Set correlation ID
            const correlationId = (0, correlation_1.getCorrelationId)(req);
            (0, correlation_1.setCorrelationId)(req, correlationId);
            // Add pino logger to request
            httpLogger(req, res, () => { });
            // Record start time
            req.startTime = Date.now();
            // Log request start
            const requestLogger = logger.child({
                correlationId,
                method: req.method,
                url: req.url,
                path: req.path,
                query: req.query,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                userId: req.user?.id,
                organizationId: req.user?.organizationId,
            });
            requestLogger.info('Request started');
            // Log response when finished
            (0, on_finished_1.default)(res, () => {
                const duration = Date.now() - (req.startTime || 0);
                const responseLogger = requestLogger.child({
                    statusCode: res.statusCode,
                    duration,
                    contentLength: res.get('content-length'),
                });
                // Check if request was slow
                if (duration > slowRequestThreshold) {
                    responseLogger.warn('Slow request detected');
                }
                else if (res.statusCode >= 500) {
                    responseLogger.error('Request failed with server error');
                }
                else if (res.statusCode >= 400) {
                    responseLogger.warn('Request failed with client error');
                }
                else {
                    responseLogger.info('Request completed');
                }
            });
            next();
        },
    ];
}
exports.createRequestLogger = createRequestLogger;
/**
 * Creates a middleware to log slow database queries
 */
function createDatabaseQueryLogger(logger, slowQueryThreshold = 100) {
    return {
        logQuery: (query, parameters, duration) => {
            const queryLogger = logger.child({
                query: query.substring(0, 200), // Truncate long queries
                parameters: parameters?.length,
                duration,
            });
            if (duration && duration > slowQueryThreshold) {
                queryLogger.warn('Slow database query detected');
            }
            else {
                queryLogger.debug('Database query executed');
            }
        },
        logError: (error, query) => {
            logger.error({
                err: error,
                query: query.substring(0, 200),
            }, 'Database query failed');
        },
    };
}
exports.createDatabaseQueryLogger = createDatabaseQueryLogger;
