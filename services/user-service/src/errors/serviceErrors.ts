import { HttpError } from './httpError'; // Assuming httpError defines HttpError(message, statusCode)

export class ApplicationError extends HttpError {
    constructor(code: string = 'INTERNAL_ERROR', message: string = 'An internal server error occurred', statusCode: number = 500) {
        super(message, statusCode);
        this.code = code;
        this.name = 'ApplicationError';
    }
    public code: string;
}

export class NotFoundError extends ApplicationError {
    constructor(message: string = 'Resource not found') {
        super('NOT_FOUND', message, 404);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends ApplicationError {
    constructor(message: string = 'Resource conflict') {
        super('RESOURCE_CONFLICT', message, 409);
        this.name = 'ConflictError';
    }
}

export class ValidationError extends ApplicationError {
    public details?: any;
    constructor(message: string = 'Validation failed', details?: any) {
        super('VALIDATION_ERROR', message, 400);
        this.name = 'ValidationError';
        if (details) {
            this.details = details;
        }
    }
}

export class AuthorizationError extends ApplicationError {
    constructor(message: string = 'Insufficient permissions') {
        super('AUTHORIZATION_ERROR', message, 403);
        this.name = 'AuthorizationError';
    }
} 