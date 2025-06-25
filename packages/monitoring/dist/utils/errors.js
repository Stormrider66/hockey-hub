"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDatabaseError = exports.isOperationalError = exports.InternalError = exports.DatabaseError = exports.RateLimitError = exports.ExternalServiceError = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AuthorizationError = exports.AuthenticationError = exports.BaseError = exports.ErrorCategory = void 0;
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorCategory["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["RESOURCE_CONFLICT"] = "RESOURCE_CONFLICT";
    ErrorCategory["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    ErrorCategory["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCategory["NOT_FOUND"] = "NOT_FOUND";
    ErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCategory["DATABASE"] = "DATABASE";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
class BaseError extends Error {
    constructor(message, statusCode, code, category, details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.category = category;
        this.details = details;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, BaseError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BaseError = BaseError;
class AuthenticationError extends BaseError {
    constructor(message = 'Authentication failed', code = 'AUTH_FAILED', details) {
        super(message, 401, code, ErrorCategory.AUTHENTICATION, details);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends BaseError {
    constructor(message = 'Access denied', code = 'ACCESS_DENIED', details) {
        super(message, 403, code, ErrorCategory.AUTHORIZATION, details);
    }
}
exports.AuthorizationError = AuthorizationError;
class ValidationError extends BaseError {
    constructor(message = 'Validation failed', code = 'VALIDATION_FAILED', details) {
        super(message, 400, code, ErrorCategory.VALIDATION, details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends BaseError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND', details) {
        super(message, 404, code, ErrorCategory.NOT_FOUND, details);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends BaseError {
    constructor(message = 'Resource conflict', code = 'CONFLICT', details) {
        super(message, 409, code, ErrorCategory.RESOURCE_CONFLICT, details);
    }
}
exports.ConflictError = ConflictError;
class ExternalServiceError extends BaseError {
    constructor(message = 'External service error', code = 'EXTERNAL_SERVICE_ERROR', details) {
        super(message, 502, code, ErrorCategory.EXTERNAL_SERVICE, details);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends BaseError {
    constructor(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED', details) {
        super(message, 429, code, ErrorCategory.RATE_LIMIT, details);
    }
}
exports.RateLimitError = RateLimitError;
class DatabaseError extends BaseError {
    constructor(message = 'Database error', code = 'DATABASE_ERROR', details) {
        super(message, 500, code, ErrorCategory.DATABASE, details);
    }
}
exports.DatabaseError = DatabaseError;
class InternalError extends BaseError {
    constructor(message = 'Internal server error', code = 'INTERNAL_ERROR', details) {
        super(message, 500, code, ErrorCategory.INTERNAL_ERROR, details, false);
    }
}
exports.InternalError = InternalError;
/**
 * Type guard to check if error is operational
 */
function isOperationalError(error) {
    if (error instanceof BaseError) {
        return error.isOperational;
    }
    return false;
}
exports.isOperationalError = isOperationalError;
/**
 * Maps common database errors to appropriate error types
 */
function mapDatabaseError(error) {
    const message = error.message || 'Database operation failed';
    // PostgreSQL error codes
    if (error.code === '23505') {
        return new ConflictError('Resource already exists', 'DUPLICATE_ENTRY', {
            field: error.constraint,
        });
    }
    if (error.code === '23503') {
        return new ValidationError('Referenced resource does not exist', 'FOREIGN_KEY_VIOLATION', {
            field: error.constraint,
        });
    }
    if (error.code === '23502') {
        return new ValidationError('Required field is missing', 'NOT_NULL_VIOLATION', {
            column: error.column,
        });
    }
    if (error.code === '22P02') {
        return new ValidationError('Invalid input syntax', 'INVALID_INPUT_SYNTAX');
    }
    return new DatabaseError(message, 'DATABASE_ERROR', {
        code: error.code,
        detail: error.detail,
    });
}
exports.mapDatabaseError = mapDatabaseError;
