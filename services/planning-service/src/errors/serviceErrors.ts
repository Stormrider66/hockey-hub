// Base class for custom application errors
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: any;

    constructor(message: string, statusCode: number, code: string, details?: any) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 404 Not Found
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', details?: any) {
        super(message, 404, 'NOT_FOUND', details);
    }
}

// 403 Forbidden / Authorization Error
export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions', details?: any) {
        super(message, 403, 'FORBIDDEN', details);
    }
}

// 401 Unauthorized / Authentication Error (Use if needed, often handled by auth middleware)
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required', details?: any) {
        super(message, 401, 'UNAUTHENTICATED', details);
    }
}

// 400 Bad Request / Validation Error
export class ValidationError extends AppError {
    constructor(message: string = 'Input validation failed', details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

// 409 Conflict Error
export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict', details?: any) {
        super(message, 409, 'CONFLICT', details);
    }
}

// 500 Internal Server Error / Database Error
export class DatabaseError extends AppError {
    constructor(message: string = 'A database error occurred', details?: any) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

// 500 Generic Internal Error
export class InternalServerError extends AppError {
    constructor(message: string = 'An unexpected internal error occurred', details?: any) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    }
} 