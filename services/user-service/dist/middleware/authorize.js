"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware to check if the authenticated user has the required roles or permissions.
 */
const authorize = (options) => (req, res, next) => {
    const user = req.user;
    // Should be caught by authenticateToken first, but double-check
    if (!user) {
        logger_1.default.error('Authorization check failed: User not authenticated.');
        return res.status(401).json({
            error: true,
            message: 'Authentication required for authorization',
            code: 'AUTHENTICATION_REQUIRED',
        });
    }
    const { allowedRoles, requiredPermissions } = options;
    let hasPermission = false;
    // 1. Check Roles (if specified)
    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = user.roles || [];
        const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
        if (hasRequiredRole) {
            hasPermission = true; // Role match is sufficient if permissions aren't strictly required
        }
    }
    // 2. Check Permissions (if specified)
    // Permissions check takes precedence if both roles and permissions are specified
    if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = user.permissions || [];
        // Check if user has ALL required permissions
        const hasRequiredPermissions = requiredPermissions.every(requiredPerm => {
            // Check for exact match or wildcard match (e.g., 'resource:*')
            if (userPermissions.includes(requiredPerm) || userPermissions.includes('*:*')) {
                return true;
            }
            const [resource] = requiredPerm.split(':');
            return userPermissions.includes(`${resource}:*`);
        });
        hasPermission = hasRequiredPermissions; // Override role check if permissions are specified
    }
    // 3. Final check
    // If neither roles nor permissions were specified, allow access (assuming auth is enough)
    if (!allowedRoles && !requiredPermissions) {
        hasPermission = true;
    }
    if (hasPermission) {
        logger_1.default.debug('Authorization successful', { userId: user.userId, roles: user.roles, path: req.path });
        return next();
    }
    else {
        logger_1.default.warn('Authorization failed', {
            userId: user.userId,
            roles: user.roles,
            requiredRoles: allowedRoles,
            requiredPermissions: requiredPermissions,
            path: req.path,
        });
        return res.status(403).json({
            error: true,
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
        });
    }
};
exports.authorize = authorize;
//# sourceMappingURL=authorize.js.map