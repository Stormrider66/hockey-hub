import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ExtendedError } from 'socket.io/dist/namespace';
import Logger from '../utils/logger';
import { AuthenticatedSocket } from '../types/socket';

// Reuse the same JWKS configuration as the HTTP auth
const JWKS_URI = process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json';
const ISSUER = process.env.JWT_ISSUER || 'user-service';
const AUDIENCE = process.env.JWT_AUDIENCE || 'hockeyhub-internal';

// Cache the remote JWKS instance
const remoteJWKS = createRemoteJWKSet(new URL(JWKS_URI));

export async function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
): Promise<void> {
  try {
    // Try to get token from handshake auth, headers, or query
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      socket.handshake.query?.token;
    
    if (!token) {
      Logger.debug('Socket Auth: No token provided', {
        socketId: socket.id,
      });
      return next(new Error('Authentication token required'));
    }

    // Verify JWT using the same JWKS flow as HTTP
    const { payload } = await jwtVerify(token as string, remoteJWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    // Extract user information from JWT payload
    const typed = payload as any;
    
    // Attach user info to socket
    socket.userId = typed.userId || typed.sub;
    socket.userEmail = typed.email;
    socket.roles = typed.roles || [];
    socket.permissions = typed.permissions || [];
    socket.organizationId = typed.organizationId;
    socket.teamIds = typed.teamIds || [];
    socket.lang = typed.lang || 'en';

    Logger.info('Socket Auth: Authentication successful', {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.userEmail,
      roles: socket.roles?.join(','),
    });

    next();
  } catch (error) {
    Logger.warn('Socket Auth: Authentication failed', {
      socketId: socket.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(new Error('Invalid authentication token'));
  }
}