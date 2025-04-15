// Placeholder for error handling middleware
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/AppError'; // Using path alias

export const errorHandlerMiddleware = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    console.error('[ErrorHandler]', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: true,
            message: err.message,
            code: err.code,
            details: err.details
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