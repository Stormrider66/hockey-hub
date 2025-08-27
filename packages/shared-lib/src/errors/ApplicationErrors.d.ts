import { BaseError } from './BaseError';
/**
 * Error thrown when a requested resource is not found
 */
export declare class NotFoundError extends BaseError {
    constructor(resource: string, identifier?: string | number, context?: Record<string, any>);
}
/**
 * Error thrown when user is not authenticated
 */
export declare class UnauthorizedError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * Error thrown when user lacks required permissions
 */
export declare class ForbiddenError extends BaseError {
    constructor(message?: string, requiredPermission?: string, context?: Record<string, any>);
}
/**
 * Error thrown for invalid input or request data
 */
export declare class ValidationError extends BaseError {
    readonly validationErrors: Array<{
        field: string;
        message: string;
        value?: any;
    }>;
    constructor(message?: string, validationErrors?: Array<{
        field: string;
        message: string;
        value?: any;
    }>, context?: Record<string, any>);
    toJSON(): {
        validationErrors: {
            field: string;
            message: string;
            value?: any;
        }[];
        name: string;
        message: string;
        code: string;
        statusCode: number;
        timestamp: Date;
        context: Record<string, any> | undefined;
        stack: string | undefined;
    };
}
/**
 * Error thrown when there's a conflict with existing data
 */
export declare class ConflictError extends BaseError {
    constructor(message: string, conflictingResource?: string, context?: Record<string, any>);
}
/**
 * Error thrown when a business rule is violated
 */
export declare class BusinessRuleError extends BaseError {
    constructor(message: string, rule?: string, context?: Record<string, any>);
}
/**
 * Error thrown when rate limit is exceeded
 */
export declare class RateLimitError extends BaseError {
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number, context?: Record<string, any>);
}
/**
 * Error thrown when an external service fails
 */
export declare class ExternalServiceError extends BaseError {
    readonly service: string;
    constructor(service: string, message: string, originalError?: Error, context?: Record<string, any>);
}
/**
 * Error thrown for database operations
 */
export declare class DatabaseError extends BaseError {
    constructor(message: string, operation?: string, originalError?: Error, context?: Record<string, any>);
}
/**
 * Error thrown when request times out
 */
export declare class TimeoutError extends BaseError {
    constructor(message?: string, operation?: string, context?: Record<string, any>);
}
/**
 * Generic internal server error
 */
export declare class InternalServerError extends BaseError {
    constructor(message?: string, originalError?: Error, context?: Record<string, any>);
}
//# sourceMappingURL=ApplicationErrors.d.ts.map