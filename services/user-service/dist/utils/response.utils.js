"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNoContent = exports.sendSuccess = void 0;
/**
 * Sends a standardized success response
 *
 * @param res Express response object
 * @param data Data to include in the response
 * @param message Optional message to include
 * @param statusCode HTTP status code (defaults to 200)
 */
const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data
    };
    if (message) {
        response.message = message;
    }
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Sends a success response with no data (204 No Content)
 *
 * @param res Express response object
 */
const sendNoContent = (res) => {
    return res.status(204).end();
};
exports.sendNoContent = sendNoContent;
//# sourceMappingURL=response.utils.js.map