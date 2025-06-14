import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../types';
import type { ErrorHandlerMiddleware, TypedRequest, ErrorResponse } from '../types';
import logger from '../config/logger';

/**
 * Global error handler middleware
 * Formats all errors into a consistent response structure
 */
export const errorHandler: ErrorHandlerMiddleware = (
  error: Error, 
  req: TypedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  // Default status code and error message
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  let details = undefined;

  // Extract request information for logging
  const reqId = req.headers['x-request-id'] || 'unknown';
  const path = req.originalUrl || req.url;
  const timestamp = new Date().toISOString();

  // Handle HttpException or HttpError (legacy) with statusCode property
  if (error instanceof HttpException) {
    statusCode = error.status;
    message = error.message;
    errorCode = error.code || errorCode;
    details = error.details;
  } else if ((error as any)?.statusCode) {
    statusCode = (error as any).statusCode;
    message = error.message;
    // Preserve error name as code if no specific code
    errorCode = (error as any).code || error.name || errorCode;
  }

  // Convert to standardized error response
  const errorResponse: ErrorResponse = {
    error: true,
    message: message,
    code: errorCode,
    status: statusCode,
    details: details,
    timestamp: timestamp,
    path: path,
    transactionId: reqId.toString()
  };

  // Log error
  logger.error('Request error', {
    statusCode,
    message: error.message,
    code: errorCode,
    path,
    transactionId: reqId,
    stack: error.stack,
    errorName: error.name,
    fullError: error
  });

  // Also log to console for immediate visibility
  console.error('=== ERROR DETAILS ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('Full error object:', error);
  console.error('===================');

  // Send formatted response to client
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;