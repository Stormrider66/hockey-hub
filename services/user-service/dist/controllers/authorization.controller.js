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
exports.checkAuthorizationController = void 0;
const authorizationService_1 = require("../services/authorizationService");
const logger_1 = __importDefault(require("../config/logger"));
// import { HttpError } from '../errors/httpError'; // Keep commented out unless needed
/**
 * Controller to handle authorization checks.
 */
const checkAuthorizationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Extract parameters from query string, including the optional resourceOrganizationId
        const { userId, action, resourceType, resourceId, resourceOrganizationId } = req.query;
        // Basic validation
        if (!userId || !action || !resourceType) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required query parameters: userId, action, resourceType' });
        }
        // Ensure primary parameters are strings
        if (typeof userId !== 'string' || typeof action !== 'string' || typeof resourceType !== 'string') {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid parameter types for userId, action, or resourceType' });
        }
        // Validate optional resourceId and resourceOrganizationId if present
        if (resourceId && typeof resourceId !== 'string') {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid parameter type for resourceId' });
        }
        if (resourceOrganizationId && typeof resourceOrganizationId !== 'string') {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid parameter type for resourceOrganizationId' });
        }
        logger_1.default.debug(`Received auth check request: userId=${userId}, action=${action}, resourceType=${resourceType}, resourceId=${resourceId || 'N/A'}, resourceOrgId=${resourceOrganizationId || 'N/A'}`);
        // Perform the authorization check using the service, passing the org ID
        const isAuthorized = yield (0, authorizationService_1.canPerformAction)(userId, action, resourceType, resourceId, resourceOrganizationId // Pass the org ID
        );
        logger_1.default.info(`Authorization check result for user ${userId}: ${isAuthorized}`);
        // Send the response
        res.status(200).json({ authorized: isAuthorized });
    }
    catch (error) {
        logger_1.default.error('Error in checkAuthorizationController', { error });
        // Pass error to the centralized error handler
        next(error);
    }
});
exports.checkAuthorizationController = checkAuthorizationController;
//# sourceMappingURL=authorization.controller.js.map