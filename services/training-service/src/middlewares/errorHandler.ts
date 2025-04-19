// Placeholder for error handling middleware
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError'; // Using path alias

// Use explicit error handler middleware signature
export const errorHandlerMiddleware = (
    error: Error | AppError,
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    // If headers have already been sent, delegate to the default Express error handler
    if (res.headersSent) {
        return next(error);
    }

    console.error('[ErrorHandler]', error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: true,
            message: error.message,
            code: error.code,
            details: error.details
        });
    } 
    
    // Handle TypeORM errors specifically? e.g. err.code === '23505' for unique constraint

    // Default to 500 Internal Server Error
    return res.status(500).json({
        error: true,
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
    });
}; 