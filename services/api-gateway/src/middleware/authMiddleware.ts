import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import logger from '../utils/logger';

const JWKS_URI = process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json';
const ISSUER = 'user-service';
const AUDIENCE = 'hockeyhub-internal';

// Cache the remote set instance.
const remoteJWKS = createRemoteJWKSet(new URL(JWKS_URI));

export interface GatewayUser {
  userId: string;
  email?: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: GatewayUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
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
    
    const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie) => {
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
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { payload } = await jwtVerify(token, remoteJWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const typed = payload as JWTPayload & {
      userId: string;
      roles: string[];
      permissions: string[];
      email?: string;
    };

    req.user = {
      userId: typed.userId,
      email: typed.email,
      roles: typed.roles || [],
      permissions: typed.permissions || [],
    };

    console.log(`[Auth Middleware] Authentication successful for user:`, typed.email);

    // If token is close to expiry (<60s), send header so client can refresh.
    if (typed.exp && Date.now() / 1000 > typed.exp - 60) {
      res.setHeader('X-Token-Expiring-Soon', 'true');
    }

    next();
  } catch (err) {
    console.log(`[Auth Middleware] JWT verification failed:`, err);
    logger.warn({ err }, 'JWT verification failed');
    return res.status(401).json({ error: 'Invalid token' });
  }
} 