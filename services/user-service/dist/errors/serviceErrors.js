"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ApplicationError = void 0;
const httpError_1 = require("./httpError"); // Assuming httpError defines HttpError(message, statusCode)
class ApplicationError extends httpError_1.HttpError {
    constructor(code = 'INTERNAL_ERROR', message = 'An internal server error occurred', statusCode = 500) {
        super(message, statusCode);
        this.code = code;
        this.name = 'ApplicationError';
    }
}
exports.ApplicationError = ApplicationError;
class NotFoundError extends ApplicationError {
    constructor(message = 'Resource not found') {
        super('NOT_FOUND', message, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ApplicationError {
    constructor(message = 'Resource conflict') {
        super('RESOURCE_CONFLICT', message, 409);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends ApplicationError {
    constructor(message = 'Validation failed', details) {
        super('VALIDATION_ERROR', message, 400);
        this.name = 'ValidationError';
        if (details) {
            this.details = details;
        }
    }
}
exports.ValidationError = ValidationError;
class AuthorizationError extends ApplicationError {
    constructor(message = 'Insufficient permissions') {
        super('AUTHORIZATION_ERROR', message, 403);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
//# sourceMappingURL=serviceErrors.js.map