"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const authorizationService_1 = require("../services/authorizationService");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Controller to handle permission check requests.
 */
const checkPermission = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Extract authenticated user ID from request (assuming auth middleware adds req.user)
    // Ensure your auth middleware correctly populates req.user.id
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        // This should ideally be caught by the auth middleware, but double-check
        // Use standard Error, potentially add a status code if needed by error handler
        const error = new Error('User not authenticated');
        error.statusCode = 401;
        return next(error);
    }
    // Extract parameters from query string
    const { action, resourceType, resourceId } = req.query;
    // Basic validation
    if (typeof action !== 'string' || typeof resourceType !== 'string') {
        // Use standard Error
        const error = new Error('Missing required query parameters: action, resourceType');
        error.statusCode = 400;
        return next(error);
    }
    if (resourceId !== undefined && typeof resourceId !== 'string') {
        // Use standard Error
        const error = new Error('Invalid query parameter: resourceId must be a string');
        error.statusCode = 400;
        return next(error);
    }
    try {
        logger_1.default.debug('Checking permission via API', { userId, action, resourceType, resourceId });
        const isAuthorized = yield (0, authorizationService_1.canPerformAction)(userId, action, resourceType, resourceId);
        res.status(200).json({ authorized: isAuthorized });
    }
    catch (error) {
        logger_1.default.error('Error during permission check', { error, userId, action, resourceType, resourceId });
        next(error); // Pass error to the global error handler
    }
});
exports.checkPermission = checkPermission;
//# sourceMappingURL=authorizationController.js.map