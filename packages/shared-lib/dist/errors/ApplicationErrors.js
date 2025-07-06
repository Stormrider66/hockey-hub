"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.TimeoutError = exports.DatabaseError = exports.ExternalServiceError = exports.RateLimitError = exports.BusinessRuleError = exports.ConflictError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = void 0;
const BaseError_1 = require("./BaseError");
/**
 * Error thrown when a requested resource is not found
 */
class NotFoundError extends BaseError_1.BaseError {
    constructor(resource, identifier, context) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, 'RESOURCE_NOT_FOUND', true, context);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error thrown when user is not authenticated
 */
class UnauthorizedError extends BaseError_1.BaseError {
    constructor(message = 'Authentication required', context) {
        super(message, 401, 'UNAUTHORIZED', true, context);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Error thrown when user lacks required permissions
 */
class ForbiddenError extends BaseError_1.BaseError {
    constructor(message = 'Insufficient permissions', requiredPermission, context) {
        super(message, 403, 'FORBIDDEN', true, { ...context, requiredPermission });
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Error thrown for invalid input or request data
 */
class ValidationError extends BaseError_1.BaseError {
    constructor(message = 'Validation failed', validationErrors = [], context) {
        super(message, 400, 'VALIDATION_ERROR', true, context);
        this.name = 'ValidationError';
        this.validationErrors = validationErrors;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            validationErrors: this.validationErrors
        };
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when there's a conflict with existing data
 */
class ConflictError extends BaseError_1.BaseError {
    constructor(message, conflictingResource, context) {
        super(message, 409, 'CONFLICT', true, { ...context, conflictingResource });
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Error thrown when a business rule is violated
 */
class BusinessRuleError extends BaseError_1.BaseError {
    constructor(message, rule, context) {
        super(message, 422, 'BUSINESS_RULE_VIOLATION', true, { ...context, rule });
        this.name = 'BusinessRuleError';
    }
}
exports.BusinessRuleError = BusinessRuleError;
/**
 * Error thrown when rate limit is exceeded
 */
class RateLimitError extends BaseError_1.BaseError {
    constructor(message = 'Rate limit exceeded', retryAfter, context) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { ...context, retryAfter });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Error thrown when an external service fails
 */
class ExternalServiceError extends BaseError_1.BaseError {
    constructor(service, message, originalError, context) {
        super(`External service '${service}' error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', true, { ...context, originalError: originalError?.message });
        this.name = 'ExternalServiceError';
        this.service = service;
    }
}
exports.ExternalServiceError = ExternalServiceError;
/**
 * Error thrown for database operations
 */
class DatabaseError extends BaseError_1.BaseError {
    constructor(message, operation, originalError, context) {
        super(message, 500, 'DATABASE_ERROR', false, // Database errors are usually not operational
        { ...context, operation, originalError: originalError?.message });
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Error thrown when request times out
 */
class TimeoutError extends BaseError_1.BaseError {
    constructor(message = 'Request timeout', operation, context) {
        super(message, 408, 'REQUEST_TIMEOUT', true, { ...context, operation });
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Generic internal server error
 */
class InternalServerError extends BaseError_1.BaseError {
    constructor(message = 'Internal server error', originalError, context) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', false, { ...context, originalError: originalError?.message });
        this.name = 'InternalServerError';
    }
}
exports.InternalServerError = InternalServerError;
//# sourceMappingURL=ApplicationErrors.js.map