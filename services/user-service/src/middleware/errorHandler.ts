import { Request, Response, NextFunction } from 'express';
// import { BaseError } from '../utils/errors/BaseError'; // TODO: Create BaseError class

// Define a standard error response structure (align with documentation)
interface ErrorResponse {
  error: boolean;
  message: string;
  code?: string;
  category?: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  transactionId?: string; // TODO: Implement request ID middleware
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('Error occurred:', err); // TODO: Replace with a proper logger

  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    error: true,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    category: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // if (err instanceof BaseError) { // TODO: Uncomment when BaseError exists
  //   statusCode = err.statusCode;
  //   errorResponse = {
  //     ...errorResponse,
  //     message: err.message,
  //     code: err.errorCode,
  //     category: err.category,
  //     details: err.details,
  //   };
  // }
  // TODO: Add specific error type handling (e.g., validation errors)

  // TODO: Add transaction ID from request context

  res.status(statusCode).json(errorResponse);
}; 