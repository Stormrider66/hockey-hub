"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = exports.checkRole = void 0;
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware factory to check if user has at least one of the provided roles.
 * @param roles Roles that are allowed to access the route.
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        var _a;
        const user = req.user;
        if (!user) {
            logger_1.default.warn('RBAC checkRole: User not authenticated');
            return res.status(401).json({
                error: true,
                message: 'Authentication required',
                code: 'AUTHENTICATION_REQUIRED',
            });
        }
        // If no roles specified, allow access (nothing to restrict)
        if (roles.length === 0) {
            return next();
        }
        const hasRequiredRole = (_a = user.roles) === null || _a === void 0 ? void 0 : _a.some((r) => roles.includes(r));
        if (!hasRequiredRole) {
            logger_1.default.warn('RBAC checkRole: Insufficient role', {
                userId: user.id,
                userRoles: user.roles,
                requiredRoles: roles,
            });
            return res.status(403).json({
                error: true,
                message: 'Insufficient role',
                code: 'INSUFFICIENT_PERMISSIONS',
            });
        }
        logger_1.default.debug('RBAC checkRole: Access granted', {
            userId: user.id,
            path: req.path,
        });
        next();
    };
};
exports.checkRole = checkRole;
/**
 * Middleware factory to check if user possesses ALL required permissions.
 * Supports wildcard matching such as `resource:*` or `*:*`.
 * @param permissions Permissions required to access the route.
 */
const checkPermission = (...permissions) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            logger_1.default.warn('RBAC checkPermission: User not authenticated');
            return res.status(401).json({
                error: true,
                message: 'Authentication required',
                code: 'AUTHENTICATION_REQUIRED',
            });
        }
        // If no permissions specified, allow access
        if (permissions.length === 0) {
            return next();
        }
        const userPermissions = user.permissions || [];
        const hasAllPermissions = permissions.every((requiredPerm) => {
            // Exact match
            if (userPermissions.includes(requiredPerm) || userPermissions.includes('*:*')) {
                return true;
            }
            // Wildcard match (resource:*)
            const [resource] = requiredPerm.split(':');
            return userPermissions.includes(`${resource}:*`);
        });
        if (!hasAllPermissions) {
            logger_1.default.warn('RBAC checkPermission: Insufficient permissions', {
                userId: user.id,
                userPermissions,
                requiredPermissions: permissions,
            });
            return res.status(403).json({
                error: true,
                message: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS',
            });
        }
        logger_1.default.debug('RBAC checkPermission: Access granted', {
            userId: user.id,
            path: req.path,
        });
        next();
    };
};
exports.checkPermission = checkPermission;
//# sourceMappingURL=rbac.js.map