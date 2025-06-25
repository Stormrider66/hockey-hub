"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorContext = exports.mapDatabaseError = exports.asyncHandler = exports.errorHandler = exports.DatabaseError = exports.ExternalServiceError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
// Base error classes
class AppError extends Error {
    constructor(message, statusCode, category, isOperational = true, context) {
        super(message);
        this.statusCode = statusCode;
        this.category = category;
        this.isOperational = isOperational;
        this.context = context;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, context) {
        super(message, 400, 'VALIDATION', true, context);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource, context) {
        super(`${resource} not found`, 404, 'NOT_FOUND', true, context);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', context) {
        super(message, 401, 'AUTHENTICATION', true, context);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', context) {
        super(message, 403, 'AUTHORIZATION', true, context);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message, context) {
        super(message, 409, 'RESOURCE_CONFLICT', true, context);
    }
}
exports.ConflictError = ConflictError;
class ExternalServiceError extends AppError {
    constructor(service, message, context) {
        super(`External service error: ${service} - ${message}`, 502, 'EXTERNAL_SERVICE', true, context);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class DatabaseError extends AppError {
    constructor(message, context) {
        super(`Database error: ${message}`, 500, 'DATABASE', true, context);
    }
}
exports.DatabaseError = DatabaseError;
// Error handling middleware
function errorHandler(logger) {
    return (error, req, res, _next) => {
        const correlationId = req.correlationId || 'unknown';
        const transactionId = require('uuid').v4();
        // Determine if this is an operational error
        const isOperational = error instanceof AppError ? error.isOperational : false;
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        const category = error instanceof AppError ? error.category : 'INTERNAL_ERROR';
        // Log the error
        const logLevel = statusCode >= 500 ? 'error' : 'warn';
        logger[logLevel]({
            type: 'error',
            correlationId,
            transactionId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                statusCode,
                category,
                isOperational
            },
            request: {
                method: req.method,
                url: req.url,
                userId: req.user?.id,
                organizationId: req.user?.organizationId
            },
            context: error instanceof AppError ? error.context : undefined
        }, `Error occurred: ${error.message}`);
        // Don't expose internal errors in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        const message = isOperational || isDevelopment
            ? error.message
            : 'Internal server error';
        const errorResponse = {
            error: true,
            message,
            code: error.name,
            category,
            timestamp: new Date().toISOString(),
            path: req.path,
            correlationId,
            transactionId,
            ...(isDevelopment && { stack: error.stack })
        };
        res.status(statusCode).json(errorResponse);
    };
}
exports.errorHandler = errorHandler;
// Async error handler wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.asyncHandler = asyncHandler;
// Common database error mapper
function mapDatabaseError(error, context) {
    // PostgreSQL specific error codes
    switch (error.code) {
        case '23505': // unique_violation
            return new ConflictError('Resource already exists', context);
        case '23503': // foreign_key_violation
            return new ValidationError('Referenced resource does not exist', context);
        case '23502': // not_null_violation
            return new ValidationError('Required field is missing', context);
        case '23514': // check_violation
            return new ValidationError('Data validation failed', context);
        case '42P01': // undefined_table
            return new DatabaseError('Database schema error', context);
        case '28P01': // invalid_password
            return new DatabaseError('Database authentication failed', context);
        case '3D000': // invalid_catalog_name
            return new DatabaseError('Database does not exist', context);
        default:
            if (error.name === 'QueryFailedError') {
                return new DatabaseError(error.message, context);
            }
            return new AppError(error.message || 'Unknown database error', 500, 'DATABASE', false, context);
    }
}
exports.mapDatabaseError = mapDatabaseError;
// Create error context helper
function createErrorContext(req, metadata) {
    return {
        correlationId: req.correlationId,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        path: req.path,
        method: req.method,
        service: process.env.SERVICE_NAME,
        metadata
    };
}
exports.createErrorContext = createErrorContext;
