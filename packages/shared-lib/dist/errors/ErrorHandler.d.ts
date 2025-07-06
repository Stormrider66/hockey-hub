import { Request, Response, NextFunction } from 'express';
import { BaseError } from './BaseError';
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
        validationErrors?: Array<{
            field: string;
            message: string;
        }>;
        stack?: string;
    };
}
/**
 * Convert various error types to our custom error format
 */
export declare function normalizeError(error: unknown, req?: Request): BaseError;
/**
 * Express error handler middleware
 */
export declare function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void;
/**
 * Async error wrapper for route handlers
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Not found error handler (404)
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=ErrorHandler.d.ts.map