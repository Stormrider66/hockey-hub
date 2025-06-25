"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name; // Set the error name to the class name
        // Ensure the prototype chain is set correctly
        Object.setPrototypeOf(this, new.target.prototype);
        // Capture stack trace, excluding constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=httpError.js.map