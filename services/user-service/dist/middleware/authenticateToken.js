"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../config/logger"));
const keyManager_1 = require("../utils/keyManager");
const ACCESS_TOKEN_PUBLIC_KEY = keyManager_1.jwtPublicKey;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        logger_1.default.warn('Authentication token missing');
        return res.status(401).json({
            error: true,
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED',
        });
    }
    try {
        // Verify the token using the public key or secret
        const decoded = jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_PUBLIC_KEY);
        // Type guard to check if decoded object has the necessary properties
        const isValidPayload = (typeof decoded === 'object' &&
            decoded !== null &&
            typeof decoded.userId === 'string' && // Still checking for userId in the token
            Array.isArray(decoded.roles) &&
            Array.isArray(decoded.permissions));
        if (!isValidPayload) {
            logger_1.default.error('Invalid token payload structure', { payload: decoded });
            throw new Error('Invalid token structure');
        }
        // Cast to our TokenPayload type
        const tokenPayload = decoded;
        // Explicitly create the AuthenticatedUser object
        const authenticatedUser = {
            id: tokenPayload.userId, // Map userId from token to id in our interface
            email: tokenPayload.email || '', // Provide default or handle potentially missing email
            roles: tokenPayload.roles,
            permissions: tokenPayload.permissions,
            organizationId: tokenPayload.organizationId || '', // Provide default empty string if missing
            teamIds: tokenPayload.teamIds,
            lang: tokenPayload.lang || 'sv', // Default language if not present
            // Add getter for userId that returns id
            get userId() {
                return this.id;
            }
        };
        // Attach user information to the request object
        req.user = authenticatedUser;
        // Add explicit check before logging
        if (req.user && req.user.id) { // Changed from userId to id
            logger_1.default.debug('Token authenticated successfully', { userId: req.user.id });
        }
        else {
            // This case should theoretically not happen if validation passed
            logger_1.default.error('req.user or req.user.id is undefined after authentication');
            throw new Error('Failed to attach user to request after authentication');
        }
        next();
    }
    catch (error) { // Catch as unknown
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.default.warn('Authentication token expired', { error: error.message });
            return res.status(401).json({
                error: true,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.default.error('Invalid authentication token', { error: error.message });
            return res.status(401).json({
                error: true,
                message: 'Invalid token',
                code: 'INVALID_TOKEN',
            });
        }
        // Handle other potential errors during verification
        const message = error instanceof Error ? error.message : 'Unknown error during token verification';
        logger_1.default.error('Token verification failed', { error: message });
        return res.status(401).json({
            error: true,
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
        });
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=authenticateToken.js.map