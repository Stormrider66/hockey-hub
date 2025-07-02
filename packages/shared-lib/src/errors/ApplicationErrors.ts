import { BaseError } from './BaseError';

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string | number, context?: Record<string, any>) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, 404, 'RESOURCE_NOT_FOUND', true, context);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, 'UNAUTHORIZED', true, context);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error thrown when user lacks required permissions
 */
export class ForbiddenError extends BaseError {
  constructor(
    message: string = 'Insufficient permissions', 
    requiredPermission?: string,
    context?: Record<string, any>
  ) {
    super(
      message, 
      403, 
      'FORBIDDEN', 
      true, 
      { ...context, requiredPermission }
    );
    this.name = 'ForbiddenError';
  }
}

/**
 * Error thrown for invalid input or request data
 */
export class ValidationError extends BaseError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(
    message: string = 'Validation failed',
    validationErrors: Array<{ field: string; message: string; value?: any }> = [],
    context?: Record<string, any>
  ) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * Error thrown when there's a conflict with existing data
 */
export class ConflictError extends BaseError {
  constructor(
    message: string,
    conflictingResource?: string,
    context?: Record<string, any>
  ) {
    super(
      message, 
      409, 
      'CONFLICT', 
      true, 
      { ...context, conflictingResource }
    );
    this.name = 'ConflictError';
  }
}

/**
 * Error thrown when a business rule is violated
 */
export class BusinessRuleError extends BaseError {
  constructor(
    message: string,
    rule?: string,
    context?: Record<string, any>
  ) {
    super(
      message, 
      422, 
      'BUSINESS_RULE_VIOLATION', 
      true, 
      { ...context, rule }
    );
    this.name = 'BusinessRuleError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(
      message, 
      429, 
      'RATE_LIMIT_EXCEEDED', 
      true, 
      { ...context, retryAfter }
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when an external service fails
 */
export class ExternalServiceError extends BaseError {
  public readonly service: string;

  constructor(
    service: string,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      `External service '${service}' error: ${message}`, 
      503, 
      'EXTERNAL_SERVICE_ERROR', 
      true, 
      { ...context, originalError: originalError?.message }
    );
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Error thrown for database operations
 */
export class DatabaseError extends BaseError {
  constructor(
    message: string,
    operation?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message, 
      500, 
      'DATABASE_ERROR', 
      false, // Database errors are usually not operational
      { ...context, operation, originalError: originalError?.message }
    );
    this.name = 'DatabaseError';
  }
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends BaseError {
  constructor(
    message: string = 'Request timeout',
    operation?: string,
    context?: Record<string, any>
  ) {
    super(
      message, 
      408, 
      'REQUEST_TIMEOUT', 
      true, 
      { ...context, operation }
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Generic internal server error
 */
export class InternalServerError extends BaseError {
  constructor(
    message: string = 'Internal server error',
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(
      message, 
      500, 
      'INTERNAL_SERVER_ERROR', 
      false,
      { ...context, originalError: originalError?.message }
    );
    this.name = 'InternalServerError';
  }
}