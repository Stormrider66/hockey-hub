// @ts-nocheck - Socket auth middleware with JWT verification
import { Socket } from 'socket.io';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ExtendedError } from 'socket.io/dist/namespace';
import { Logger } from '@hockey-hub/shared-lib';
const logger = new Logger('AuthMiddleware');

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    organizationId: string;
    roles: string[];
    lang?: string;
  };
}

// Use the same JWKS configuration as API Gateway
const JWKS_URI = process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json';
const ISSUER = process.env.JWT_ISSUER || 'user-service';
const AUDIENCE = process.env.JWT_AUDIENCE || 'hockeyhub-internal';

// Cache the remote JWKS instance
const remoteJWKS = createRemoteJWKSet(new URL(JWKS_URI));

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Get token from handshake auth, headers, or query
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;

    if (!token) {
      logger.debug('Socket Auth: No token provided', {
        socketId: socket.id,
      });
      return next(new Error('Authentication required'));
    }

    // Verify token using JWKS
    const { payload } = await jwtVerify(token as string, remoteJWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    // Extract user information from JWT payload
    const typed = payload as any;

    // Attach user info to socket
    socket.userId = typed.userId || typed.sub;
    socket.user = {
      id: typed.userId || typed.sub,
      email: typed.email,
      organizationId: typed.organizationId,
      roles: typed.roles || [],
      lang: typed.lang || 'en',
    };

    logger.info('Socket Auth: Authentication successful', {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.user.email,
    });

    next();
  } catch (error) {
    logger.warn('Socket Auth: Authentication failed', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(new Error('Invalid token'));
  }
};