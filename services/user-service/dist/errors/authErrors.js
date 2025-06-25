"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.UnauthorizedError = void 0;
const httpError_1 = require("./httpError");
// Represents a 401 Unauthorized error
class UnauthorizedError extends httpError_1.HttpError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
// Represents a 409 Conflict error
class ConflictError extends httpError_1.HttpError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
// Add other auth-related errors here if needed (e.g., ForbiddenError - 403) 
//# sourceMappingURL=authErrors.js.map