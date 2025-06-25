export declare enum ErrorCategory {
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    VALIDATION = "VALIDATION",
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    NOT_FOUND = "NOT_FOUND",
    RATE_LIMIT = "RATE_LIMIT",
    DATABASE = "DATABASE"
}
export interface ErrorDetails {
    [key: string]: any;
}
export declare class BaseError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly category: ErrorCategory;
    readonly details?: ErrorDetails;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, category: ErrorCategory, details?: ErrorDetails, isOperational?: boolean);
}
export declare class AuthenticationError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class AuthorizationError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class ValidationError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class NotFoundError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class ConflictError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class ExternalServiceError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class RateLimitError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class DatabaseError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
export declare class InternalError extends BaseError {
    constructor(message?: string, code?: string, details?: ErrorDetails);
}
/**
 * Type guard to check if error is operational
 */
export declare function isOperationalError(error: Error): error is BaseError;
/**
 * Maps common database errors to appropriate error types
 */
export declare function mapDatabaseError(error: any): BaseError;
