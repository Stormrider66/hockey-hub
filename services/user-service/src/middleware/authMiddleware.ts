import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { UserOrganization } from '../entities/UserOrganization';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
        permissions: string[];
        organizationId?: string;
        teamIds: string[];
      };
    }
  }
}

// Middleware to extract user information from headers (sent by API Gateway)
export function extractUser(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;
  const rolesHeader = req.headers['x-user-roles'] as string;
  const permissionsHeader = req.headers['x-user-permissions'] as string;
  const organizationId = req.headers['x-organization-id'] as string;
  const teamIdsHeader = req.headers['x-team-ids'] as string;

  if (userId && email) {
    req.user = {
      userId,
      email,
      roles: rolesHeader ? JSON.parse(rolesHeader) : [],
      permissions: permissionsHeader ? JSON.parse(permissionsHeader) : [],
      organizationId,
      teamIds: teamIdsHeader ? JSON.parse(teamIdsHeader) : []
    };
  }

  next();
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

// Middleware to check for specific permission
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For now, check permissions from headers
    // In future, we might want to load fresh permissions from database
    if (req.user.permissions.includes(permission)) {
      return next();
    }

    // If permission not in headers, try to load from database
    if (req.user.organizationId) {
      try {
        const userOrgRepo = AppDataSource.getRepository(UserOrganization);
        const userOrg = await userOrgRepo.findOne({
          where: {
            userId: req.user.userId,
            organizationId: req.user.organizationId,
            isActive: true
          },
          relations: ['roleEntity', 'roleEntity.permissions']
        });

        if (userOrg && userOrg.roleEntity) {
          const permissions = userOrg.getPermissions();
          if (permissions.includes(permission)) {
            // Update request with fresh permissions
            req.user.permissions = permissions;
            return next();
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Middleware to check for any of the specified permissions
export function requireAnyPermission(permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (hasPermission) {
      return next();
    }

    // If not found in headers, try database
    if (req.user.organizationId) {
      try {
        const userOrgRepo = AppDataSource.getRepository(UserOrganization);
        const userOrg = await userOrgRepo.findOne({
          where: {
            userId: req.user.userId,
            organizationId: req.user.organizationId,
            isActive: true
          },
          relations: ['roleEntity', 'roleEntity.permissions']
        });

        if (userOrg && userOrg.roleEntity) {
          const userPermissions = userOrg.getPermissions();
          const hasDbPermission = permissions.some(permission => 
            userPermissions.includes(permission)
          );
          
          if (hasDbPermission) {
            req.user.permissions = userPermissions;
            return next();
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Middleware to check if user belongs to organization
export function requireOrganization(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.organizationId) {
    return res.status(403).json({ error: 'Organization context required' });
  }
  next();
}

// Middleware to check if user can access a specific resource
export function canAccessResource(resourceType: 'user' | 'team' | 'organization') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      return next();
    }

    // Check based on resource type
    switch (resourceType) {
      case 'user':
        // Users can access their own profile
        if (req.user.userId === resourceId) {
          return next();
        }
        // Otherwise need appropriate permission
        return requirePermission('users.read')(req, res, next);

      case 'team':
        // Check if user is member of the team
        if (req.user.teamIds.includes(resourceId)) {
          return next();
        }
        // Otherwise need appropriate permission
        return requirePermission('teams.read')(req, res, next);

      case 'organization':
        // Check if user belongs to the organization
        if (req.user.organizationId === resourceId) {
          return next();
        }
        // Otherwise need appropriate permission
        return requirePermission('organizations.read')(req, res, next);

      default:
        return next();
    }
  };
}