import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import logger from '../utils/logger';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions?: string[];
  organizationId?: string;
  teamIds?: string[];
  lang?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
}

// Extend Express Request interface to include user
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
        lang: string;
      };
    }
  }
}

const JWKS_URI = process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json';
const ISSUER = process.env.JWT_ISSUER || 'user-service';
const AUDIENCE = process.env.JWT_AUDIENCE || 'hockeyhub-internal';

// Cache the remote JWKS instance
const remoteJWKS = createRemoteJWKSet(new URL(JWKS_URI));

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  console.log(`[Auth Middleware] ${req.method} ${req.url}`);
  console.log(`[Auth Middleware] Headers:`, req.headers);

  // Try to get token from Authorization header first
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  console.log(`[Auth Middleware] Bearer token:`, token ? 'Found' : 'Not found');

  // If no Bearer token, try to get from cookies
  if (!token && req.headers.cookie) {
    console.log(`[Auth Middleware] Raw cookies:`, req.headers.cookie);
    
    const cookies = req.headers.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    console.log(`[Auth Middleware] Parsed cookies:`, Object.keys(cookies));
    token = cookies.accessToken;
    console.log(`[Auth Middleware] Access token from cookies:`, token ? 'Found' : 'Not found');
  }

  if (!token) {
    console.log(`[Auth Middleware] No token found, returning 401`);
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, remoteJWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const typed = payload as unknown as JWTPayload;
    
    req.user = {
      userId: typed.userId,
      email: typed.email,
      roles: typed.roles || [],
      permissions: typed.permissions || [],
      organizationId: typed.organizationId,
      teamIds: typed.teamIds || [],
      lang: typed.lang || 'en',
    };

    console.log(`[Auth Middleware] Authentication successful for user:`, typed.email);

    // If token is close to expiry (<60s), send header so client can refresh
    if (typed.exp && Date.now() / 1000 > typed.exp - 60) {
      res.setHeader('X-Token-Expiring-Soon', 'true');
    }

    next();
  } catch (err) {
    console.log(`[Auth Middleware] JWT verification failed:`, err);
    logger.warn({ err }, 'JWT verification failed');
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
}

// Middleware to check for specific permissions
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Middleware to check for specific roles
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
}

// Middleware to check for any of the specified roles
export function requireAnyRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
}