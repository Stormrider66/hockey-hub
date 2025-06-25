import { HttpError } from './httpError';
export declare class ApplicationError extends HttpError {
    constructor(code?: string, message?: string, statusCode?: number);
    code: string;
}
export declare class NotFoundError extends ApplicationError {
    constructor(message?: string);
}
export declare class ConflictError extends ApplicationError {
    constructor(message?: string);
}
export declare class ValidationError extends ApplicationError {
    details?: any;
    constructor(message?: string, details?: any);
}
export declare class AuthorizationError extends ApplicationError {
    constructor(message?: string);
}
//# sourceMappingURL=serviceErrors.d.ts.map