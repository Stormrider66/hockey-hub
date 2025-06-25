"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createErrorHandler = void 0;
const errors_1 = require("../utils/errors");
const correlation_1 = require("../utils/correlation");
/**
 * Creates an error handler middleware with the provided logger
 */
function createErrorHandler(options) {
    const { logger, includeStackTrace = process.env.NODE_ENV === 'development', defaultMessage = 'An unexpected error occurred', } = options;
    return (error, req, res, _next) => {
        const correlationId = (0, correlation_1.getCorrelationIdFromRequest)(req) || 'unknown';
        const timestamp = new Date().toISOString();
        const path = req.originalUrl || req.url;
        // Default values
        let statusCode = 500;
        let message = defaultMessage;
        let code = 'INTERNAL_ERROR';
        let category = errors_1.ErrorCategory.INTERNAL_ERROR;
        let details;
        // Handle BaseError instances
        if (error instanceof errors_1.BaseError) {
            statusCode = error.statusCode;
            message = error.message;
            code = error.code;
            category = error.category;
            details = error.details;
        }
        else if (error.statusCode) {
            // Handle errors with statusCode property
            statusCode = error.statusCode;
            message = error.message || message;
            code = error.code || error.name || code;
        }
        // Log the error
        const logContext = {
            correlationId,
            statusCode,
            code,
            category,
            path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id,
            organizationId: req.user?.organizationId,
            ...(includeStackTrace && { stack: error.stack }),
        };
        if ((0, errors_1.isOperationalError)(error)) {
            logger.warn({ ...logContext, err: error }, 'Operational error occurred');
        }
        else {
            logger.error({ ...logContext, err: error }, 'Unexpected error occurred');
        }
        // Prepare error response
        const errorResponse = {
            error: true,
            message,
            code,
            category,
            timestamp,
            path,
            correlationId,
        };
        // Include details in development or for operational errors
        if (details && (includeStackTrace || (0, errors_1.isOperationalError)(error))) {
            errorResponse.details = details;
        }
        // Include stack trace in development
        if (includeStackTrace && error.stack) {
            errorResponse.details = {
                ...errorResponse.details,
                stack: error.stack,
            };
        }
        // Send response
        res.status(statusCode).json(errorResponse);
    };
}
exports.createErrorHandler = createErrorHandler;
/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.asyncHandler = asyncHandler;
