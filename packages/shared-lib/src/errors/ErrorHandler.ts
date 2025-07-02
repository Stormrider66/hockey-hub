import { Request, Response, NextFunction } from 'express';
import { BaseError } from './BaseError';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { QueryFailedError } from 'typeorm';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ValidationError, UnauthorizedError, DatabaseError, InternalServerError } from './ApplicationErrors';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: Date;
    requestId?: string;
    path?: string;
    method?: string;
    validationErrors?: Array<{ field: string; message: string }>;
    stack?: string;
  };
}

/**
 * Convert various error types to our custom error format
 */
export function normalizeError(error: any, req?: Request): BaseError {
  // If it's already our custom error, return it
  if (error instanceof BaseError) {
    return error;
  }

  // Handle class-validator errors
  if (Array.isArray(error) && error[0] instanceof ClassValidatorError) {
    const validationErrors = error.flatMap((err: ClassValidatorError) => {
      const constraints = err.constraints || {};
      return Object.values(constraints).map(message => ({
        field: err.property,
        message
      }));
    });
    return new ValidationError('Validation failed', validationErrors);
  }

  // Handle TypeORM errors
  if (error instanceof QueryFailedError) {
    const message = error.message;
    
    // Check for unique constraint violations
    if (message.includes('duplicate key') || message.includes('UNIQUE')) {
      const match = message.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
      if (match) {
        return new ValidationError(
          `${match[1]} already exists`,
          [{ field: match[1], message: `Value '${match[2]}' already exists` }]
        );
      }
    }
    
    // Check for foreign key violations
    if (message.includes('foreign key') || message.includes('REFERENCES')) {
      return new ValidationError('Referenced resource not found');
    }
    
    return new DatabaseError(message, 'query', error);
  }

  // Handle JWT errors
  if (error instanceof JsonWebTokenError) {
    return new UnauthorizedError('Invalid token');
  }
  
  if (error instanceof TokenExpiredError) {
    return new UnauthorizedError('Token has expired');
  }

  // Handle syntax errors (usually JSON parsing)
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new ValidationError('Invalid JSON format');
  }

  // Default to internal server error
  return new InternalServerError(
    error.message || 'An unexpected error occurred',
    error
  );
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
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
    user: (req as any).user,
    correlationId: req.headers['x-correlation-id']
  };

  // Log based on error type
  if (normalizedError.isOperational) {
    console.warn('Operational error:', logData);
  } else {
    console.error('System error:', logData);
  }

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: normalizedError.message,
      code: normalizedError.code,
      statusCode: normalizedError.statusCode,
      timestamp: normalizedError.timestamp,
      requestId: req.headers['x-request-id'] as string,
      path: req.path,
      method: req.method,
      validationErrors: (normalizedError as ValidationError).validationErrors,
      stack: process.env.NODE_ENV === 'development' ? normalizedError.stack : undefined
    }
  };

  res.status(normalizedError.statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found error handler (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
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