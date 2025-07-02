"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.normalizeError = void 0;
const BaseError_1 = require("./BaseError");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("typeorm");
const jsonwebtoken_1 = require("jsonwebtoken");
const ApplicationErrors_1 = require("./ApplicationErrors");
/**
 * Convert various error types to our custom error format
 */
function normalizeError(error, req) {
    // If it's already our custom error, return it
    if (error instanceof BaseError_1.BaseError) {
        return error;
    }
    // Handle class-validator errors
    if (Array.isArray(error) && error[0] instanceof class_validator_1.ValidationError) {
        const validationErrors = error.flatMap((err) => {
            const constraints = err.constraints || {};
            return Object.values(constraints).map(message => ({
                field: err.property,
                message
            }));
        });
        return new ApplicationErrors_1.ValidationError('Validation failed', validationErrors);
    }
    // Handle TypeORM errors
    if (error instanceof typeorm_1.QueryFailedError) {
        const message = error.message;
        // Check for unique constraint violations
        if (message.includes('duplicate key') || message.includes('UNIQUE')) {
            const match = message.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
            if (match) {
                return new ApplicationErrors_1.ValidationError(`${match[1]} already exists`, [{ field: match[1], message: `Value '${match[2]}' already exists` }]);
            }
        }
        // Check for foreign key violations
        if (message.includes('foreign key') || message.includes('REFERENCES')) {
            return new ApplicationErrors_1.ValidationError('Referenced resource not found');
        }
        return new ApplicationErrors_1.DatabaseError(message, 'query', error);
    }
    // Handle JWT errors
    if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
        return new ApplicationErrors_1.UnauthorizedError('Invalid token');
    }
    if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        return new ApplicationErrors_1.UnauthorizedError('Token has expired');
    }
    // Handle syntax errors (usually JSON parsing)
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return new ApplicationErrors_1.ValidationError('Invalid JSON format');
    }
    // Default to internal server error
    return new ApplicationErrors_1.InternalServerError(error.message || 'An unexpected error occurred', error);
}
exports.normalizeError = normalizeError;
/**
 * Express error handler middleware
 */
function errorHandler(error, req, res, next) {
    // Normalize the error
    const normalizedError = normalizeError(error, req);
    // Log the error
    const logData = {
        error: normalizedError.toJSON(),
        request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: req.query,
            body: req.body,
            ip: req.ip,
            userAgent: req.get('user-agent')
        },
        user: req.user,
        correlationId: req.headers['x-correlation-id']
    };
    // Log based on error type
    if (normalizedError.isOperational) {
        console.warn('Operational error:', logData);
    }
    else {
        console.error('System error:', logData);
    }
    // Send error response
    const errorResponse = {
        success: false,
        error: {
            message: normalizedError.message,
            code: normalizedError.code,
            statusCode: normalizedError.statusCode,
            timestamp: normalizedError.timestamp,
            requestId: req.headers['x-request-id'],
            path: req.path,
            method: req.method,
            validationErrors: normalizedError.validationErrors,
            stack: process.env.NODE_ENV === 'development' ? normalizedError.stack : undefined
        }
    };
    res.status(normalizedError.statusCode).json(errorResponse);
}
exports.errorHandler = errorHandler;
/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.asyncHandler = asyncHandler;
/**
 * Not found error handler (404)
 */
function notFoundHandler(req, res) {
    const errorResponse = {
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'ROUTE_NOT_FOUND',
            statusCode: 404,
            timestamp: new Date(),
            path: req.path,
            method: req.method
        }
    };
    res.status(404).json(errorResponse);
}
exports.notFoundHandler = notFoundHandler;
