"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerFactory = exports.RequestLogger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(service) {
        this.service = service;
        this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    }
    parseLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'error': return LogLevel.ERROR;
            case 'warn': return LogLevel.WARN;
            case 'info': return LogLevel.INFO;
            case 'debug': return LogLevel.DEBUG;
            default: return LogLevel.INFO;
        }
    }
    formatLog(level, message, context) {
        const timestamp = new Date().toISOString();
        const enrichedContext = this.enrichContext(context);
        if (process.env.NODE_ENV === 'production') {
            // JSON format for production
            return JSON.stringify({
                timestamp,
                level,
                service: this.service,
                message,
                ...enrichedContext
            });
        }
        else {
            // Pretty format for development
            const contextStr = Object.keys(enrichedContext).length > 0
                ? `\n${JSON.stringify(enrichedContext, null, 2)}`
                : '';
            return `${timestamp} [${this.service}] ${level.toUpperCase()}: ${message}${contextStr}`;
        }
    }
    log(level, levelStr, message, context) {
        if (level <= this.logLevel) {
            const output = this.formatLog(levelStr, message, context);
            switch (level) {
                case LogLevel.ERROR:
                    console.error(output);
                    break;
                case LogLevel.WARN:
                    console.warn(output);
                    break;
                default:
                    console.log(output);
            }
        }
    }
    // Core logging methods
    info(message, context) {
        this.log(LogLevel.INFO, 'info', message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, 'warn', message, context);
    }
    error(message, error, context) {
        const errorContext = {
            ...context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
                code: error.code,
                statusCode: error.statusCode
            } : undefined
        };
        this.log(LogLevel.ERROR, 'error', message, errorContext);
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, 'debug', message, context);
    }
    // Specialized logging methods
    http(req, res, duration) {
        const context = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            correlationId: req.headers['x-correlation-id'],
            requestId: req.headers['x-request-id'],
            userId: req.user?.userId
        };
        const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
        const levelStr = res.statusCode >= 400 ? 'warn' : 'info';
        this.log(level, levelStr, `HTTP ${req.method} ${req.path} ${res.statusCode}`, context);
    }
    database(operation, duration, context) {
        this.info(`Database ${operation}`, {
            ...context,
            type: 'database',
            operation,
            duration
        });
    }
    external(service, operation, duration, success, context) {
        const level = success ? LogLevel.INFO : LogLevel.WARN;
        const levelStr = success ? 'info' : 'warn';
        this.log(level, levelStr, `External service ${service} - ${operation}`, {
            ...context,
            type: 'external_service',
            service,
            operation,
            duration,
            success
        });
    }
    security(event, context) {
        this.warn(`Security event: ${event}`, {
            ...context,
            type: 'security'
        });
    }
    performance(metric, value, context) {
        this.info(`Performance metric: ${metric}`, {
            ...context,
            type: 'performance',
            metric,
            value
        });
    }
    audit(action, resource, context) {
        this.info(`Audit: ${action} on ${resource}`, {
            ...context,
            type: 'audit',
            action,
            resource
        });
    }
    // Helper methods
    enrichContext(context) {
        const enriched = {
            environment: process.env.NODE_ENV,
            ...context
        };
        // Remove undefined values
        Object.keys(enriched).forEach(key => {
            if (enriched[key] === undefined) {
                delete enriched[key];
            }
        });
        return enriched;
    }
    // Create a logger for Express request context
    requestLogger(req) {
        return new RequestLogger(this, {
            correlationId: req.headers['x-correlation-id'],
            requestId: req.headers['x-request-id'],
            userId: req.user?.userId,
            method: req.method,
            path: req.path
        });
    }
}
exports.Logger = Logger;
// Request-scoped logger
class RequestLogger {
    constructor(logger, context) {
        this.logger = logger;
        this.context = context;
    }
    info(message, context) {
        this.logger.info(message, { ...this.context, ...context });
    }
    warn(message, context) {
        this.logger.warn(message, { ...this.context, ...context });
    }
    error(message, error, context) {
        this.logger.error(message, error, { ...this.context, ...context });
    }
    debug(message, context) {
        this.logger.debug(message, { ...this.context, ...context });
    }
}
exports.RequestLogger = RequestLogger;
// Factory for creating loggers
class LoggerFactory {
    static getLogger(service) {
        if (!this.loggers.has(service)) {
            this.loggers.set(service, new Logger(service));
        }
        return this.loggers.get(service);
    }
    static setLogger(service, logger) {
        this.loggers.set(service, logger);
    }
}
exports.LoggerFactory = LoggerFactory;
LoggerFactory.loggers = new Map();
//# sourceMappingURL=Logger.js.map