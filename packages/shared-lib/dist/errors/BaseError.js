"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
/**
 * Base error class for all custom errors in the Hockey Hub application
 */
class BaseError extends Error {
    constructor(message, statusCode, code, isOperational = true, context) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.timestamp = new Date();
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Convert error to a JSON-serializable format
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            context: this.context,
            stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
        };
    }
}
exports.BaseError = BaseError;
