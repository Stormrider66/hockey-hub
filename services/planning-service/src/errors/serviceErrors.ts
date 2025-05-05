// Base class for custom application errors
export class ServiceError extends Error {
    public statusCode: number;
    public code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
export class NotFoundError extends ServiceError {
    constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
        super(message, 404, code);
    }
}

export class AuthorizationError extends ServiceError {
    constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
        super(message, 403, code);
    }
}

export class ConflictError extends ServiceError {
    constructor(message: string = 'Resource conflict', code: string = 'CONFLICT') {
        super(message, 409, code);
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string = 'Validation failed', code: string = 'VALIDATION_ERROR') {
        super(message, 400, code);
    }
} 