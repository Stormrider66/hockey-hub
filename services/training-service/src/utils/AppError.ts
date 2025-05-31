export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: any;

    constructor(code: string, message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
