import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { ErrorContext, AsyncHandler } from './types';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly category: string;
    readonly isOperational: boolean;
    readonly context?: ErrorContext;
    constructor(message: string, statusCode: number, category: string, isOperational?: boolean, context?: ErrorContext);
}
export declare class ValidationError extends AppError {
    constructor(message: string, context?: ErrorContext);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, context?: ErrorContext);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, context?: ErrorContext);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, context?: ErrorContext);
}
export declare class ConflictError extends AppError {
    constructor(message: string, context?: ErrorContext);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, context?: ErrorContext);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, context?: ErrorContext);
}
export declare function errorHandler(logger: pino.Logger): (error: Error, req: Request, res: Response, _next: NextFunction) => void;
export declare function asyncHandler<T>(fn: AsyncHandler<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare function mapDatabaseError(error: any, context?: ErrorContext): AppError;
export declare function createErrorContext(req: Request, metadata?: Record<string, any>): ErrorContext;
