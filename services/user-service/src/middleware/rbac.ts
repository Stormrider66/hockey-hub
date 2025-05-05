import { Response, NextFunction } from 'express';
import logger from '../config/logger';
import {
  AuthenticatedUser,
  ErrorResponse,
  TypedRequest,
} from '@hockey-hub/types';

// Type for Express middleware handler using our TypedRequest
export type RBACMiddleware = (
  req: TypedRequest,
  res: Response,
  next: NextFunction
) => void;

/**
 * Middleware factory to check if user has at least one of the provided roles.
 * @param roles Roles that are allowed to access the route.
 */
export const checkRole = (...roles: string[]): RBACMiddleware => {
  return (req, res, next) => {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      logger.warn('RBAC checkRole: User not authenticated');
      return res.status(401).json({
        error: true,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      } as ErrorResponse);
    }

    // If no roles specified, allow access (nothing to restrict)
    if (roles.length === 0) {
      return next();
    }

    const hasRequiredRole = user.roles?.some((r) => roles.includes(r));

    if (!hasRequiredRole) {
      logger.warn('RBAC checkRole: Insufficient role', {
        userId: user.id,
        userRoles: user.roles,
        requiredRoles: roles,
      });
      return res.status(403).json({
        error: true,
        message: 'Insufficient role',
        code: 'INSUFFICIENT_PERMISSIONS',
      } as ErrorResponse);
    }

    logger.debug('RBAC checkRole: Access granted', {
      userId: user.id,
      path: req.path,
    });
    next();
  };
};

/**
 * Middleware factory to check if user possesses ALL required permissions.
 * Supports wildcard matching such as `resource:*` or `*:*`.
 * @param permissions Permissions required to access the route.
 */
export const checkPermission = (
  ...permissions: string[]
): RBACMiddleware => {
  return (req, res, next) => {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      logger.warn('RBAC checkPermission: User not authenticated');
      return res.status(401).json({
        error: true,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      } as ErrorResponse);
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
      logger.warn('RBAC checkPermission: Insufficient permissions', {
        userId: user.id,
        userPermissions,
        requiredPermissions: permissions,
      });
      return res.status(403).json({
        error: true,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      } as ErrorResponse);
    }

    logger.debug('RBAC checkPermission: Access granted', {
      userId: user.id,
      path: req.path,
    });
    next();
  };
}; 