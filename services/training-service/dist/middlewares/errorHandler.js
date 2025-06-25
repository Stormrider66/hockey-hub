"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = void 0;
const AppError_1 = require("../utils/AppError"); // Using path alias
// Use explicit error handler middleware signature
const errorHandlerMiddleware = (error, _req, res, next) => {
    // If headers have already been sent, delegate to the default Express error handler
    if (res.headersSent) {
        return next(error);
    }
    console.error('[ErrorHandler]', error);
    if (error instanceof AppError_1.AppError) {
        return res.status(error.statusCode).json({
            error: true,
            message: error.message,
            code: error.code,
            details: error.details
        });
    }
    // Handle TypeORM errors specifically? e.g. err.code === '23505' for unique constraint
    // Default to 500 Internal Server Error
    return res.status(500).json({
        error: true,
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
    });
};
exports.errorHandlerMiddleware = errorHandlerMiddleware;
