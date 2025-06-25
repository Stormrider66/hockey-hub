"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const types_1 = require("../types");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Global error handler middleware
 * Formats all errors into a consistent response structure
 */
const errorHandler = (error, req, res, next) => {
    // Default status code and error message
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details = undefined;
    // Extract request information for logging
    const reqId = req.headers['x-request-id'] || 'unknown';
    const path = req.originalUrl || req.url;
    const timestamp = new Date().toISOString();
    // Handle HttpException or HttpError (legacy) with statusCode property
    if (error instanceof types_1.HttpException) {
        statusCode = error.status;
        message = error.message;
        errorCode = error.code || errorCode;
        details = error.details;
    }
    else if (error === null || error === void 0 ? void 0 : error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
        // Preserve error name as code if no specific code
        errorCode = error.code || error.name || errorCode;
    }
    // Convert to standardized error response
    const errorResponse = {
        error: true,
        message: message,
        code: errorCode,
        status: statusCode,
        details: details,
        timestamp: timestamp,
        path: path,
        transactionId: reqId.toString()
    };
    // Log error
    logger_1.default.error('Request error', {
        statusCode,
        message: error.message,
        code: errorCode,
        path,
        transactionId: reqId,
        stack: error.stack,
        errorName: error.name,
        fullError: error
    });
    // Also log to console for immediate visibility
    console.error('=== ERROR DETAILS ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error object:', error);
    console.error('===================');
    // Send formatted response to client
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorHandler.js.map