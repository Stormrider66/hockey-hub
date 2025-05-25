import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@hockey-hub/types';

interface JWTPayload {
  sub: string; // user id
  role: UserRole;
  organizationId: string;
  exp?: number;
}

// Attach typed user to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        organizationId: string;
      };
    }
  }
}

/**
 * Authentication middleware – verifies JWT unless NODE_ENV === 'test'.
 * Adds req.user with id, role and organizationId.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    // In tests we allow a shortcut via headers to avoid cryptography
    const role = (req.headers['x-mock-role'] as string) || UserRole.ADMIN;
    const organizationId = (req.headers['x-organization-id'] as string) || 'org1';
    req.user = { id: 'test-user', role: role as UserRole, organizationId };
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'Missing bearer token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_PUBLIC_KEY || 'development-secret'; // For RS256 use public key here
    const payload = jwt.verify(token, secret, { algorithms: ['HS256', 'RS256'] }) as JWTPayload;
    req.user = { id: payload.sub, role: payload.role, organizationId: payload.organizationId };
    next();
  } catch (err) {
    console.error('[Auth] JWT verification failed:', (err as Error).message);
    return res.status(401).json({ error: true, message: 'Invalid or expired token' });
  }
};

/**
 * Role-based access control middleware.
 * Usage: router.post('/path', requireRole(UserRole.ADMIN, UserRole.CLUB_ADMIN), handler)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      if (process.env.NODE_ENV === 'test') {
        req.user = { id: 'test-user', role: UserRole.ADMIN, organizationId: 'org1' };
      } else {
        return res.status(401).json({ error: true, message: 'Unauthenticated' });
      }
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: true, message: 'Forbidden' });
    }
    next();
  };
}; 