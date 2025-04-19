import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AuthenticatedUser } from './authenticateToken'; // Import the user type

interface AuthorizeOptions {
  allowedRoles?: string[];
  requiredPermissions?: string[];
}

/**
 * Middleware to check if the authenticated user has the required roles or permissions.
 */
export const authorize = 
  (options: AuthorizeOptions) => 
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser | undefined;

    // Should be caught by authenticateToken first, but double-check
    if (!user) {
      logger.error('Authorization check failed: User not authenticated.');
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
      logger.debug('Authorization successful', { userId: user.userId, roles: user.roles, path: req.path });
      return next();
    } else {
      logger.warn('Authorization failed', {
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