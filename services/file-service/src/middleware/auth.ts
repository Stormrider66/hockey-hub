import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
    teamIds?: string[];
    roles: string[];
    permissions: string[];
  };
}

// Middleware to extract user from API Gateway headers
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user data from API Gateway headers
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userRoles = req.headers['x-user-roles'] as string;
    const userPermissions = req.headers['x-user-permissions'] as string;
    const organizationId = req.headers['x-organization-id'] as string;
    const teamIds = req.headers['x-team-ids'] as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'No user ID provided' });
      return;
    }

    // Construct user object
    req.user = {
      id: userId,
      email: userEmail,
      organizationId: organizationId || undefined,
      teamIds: teamIds ? teamIds.split(',') : [],
      roles: userRoles ? userRoles.split(',') : [],
      permissions: userPermissions ? userPermissions.split(',') : [],
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed' });
  }
};

// Check if user has specific permission
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Missing required permission: ${permission}` 
      });
    }

    next();
  };
};

// Check if user has any of the specified roles
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Requires one of these roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Check if user belongs to the organization
export const requireOrganization = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
  
  if (orgId && req.user.organizationId !== orgId) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access denied to this organization' 
    });
  }

  next();
};

// Check if user belongs to the team
export const requireTeam = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
  
  if (teamId && !req.user.teamIds?.includes(teamId)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access denied to this team' 
    });
  }

  next();
};

// Optional authentication - continues even if no user
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (userId) {
      const userEmail = req.headers['x-user-email'] as string;
      const userRoles = req.headers['x-user-roles'] as string;
      const userPermissions = req.headers['x-user-permissions'] as string;
      const organizationId = req.headers['x-organization-id'] as string;
      const teamIds = req.headers['x-team-ids'] as string;

      req.user = {
        id: userId,
        email: userEmail,
        organizationId: organizationId || undefined,
        teamIds: teamIds ? teamIds.split(',') : [],
        roles: userRoles ? userRoles.split(',') : [],
        permissions: userPermissions ? userPermissions.split(',') : [],
      };
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};