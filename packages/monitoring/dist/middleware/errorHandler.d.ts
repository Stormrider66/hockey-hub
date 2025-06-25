import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';
import { BaseError, ErrorCategory } from '../utils/errors';
export interface ErrorResponse {
    error: true;
    message: string;
    code: string;
    category: ErrorCategory;
    details?: Record<string, any>;
    timestamp: string;
    path: string;
    correlationId: string;
}
export interface ErrorHandlerOptions {
    logger: Logger;
    includeStackTrace?: boolean;
    defaultMessage?: string;
}
/**
 * Creates an error handler middleware with the provided logger
 */
export declare function createErrorHandler(options: ErrorHandlerOptions): (error: Error | BaseError, req: Request & {
    correlationId?: string;
}, res: Response, _next: NextFunction) => void;
/**
 * Async error wrapper for route handlers
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
