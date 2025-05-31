import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import {
  AuthenticatedUser,
  TokenPayload,
  TypedRequest,
  ErrorResponse,
} from '../types';

// Re-export the AuthenticatedUser interface for backward compatibility
export { AuthenticatedUser };

// Define RequestHandler type
type AuthRequestHandler = (req: TypedRequest, res: Response, next: NextFunction) => void;

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  logger.fatal('FATAL ERROR: JWT_SECRET environment variable is required for authentication middleware.');
  process.exit(1);
}

export const authenticateToken: AuthRequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    logger.warn('Authentication token missing');
    return res.status(401).json({
      error: true,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED',
    } as ErrorResponse);
  }

  try {
    // Verify the token using the public key or secret
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    // Type guard to check if decoded object has the necessary properties
    const isValidPayload = (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof decoded.userId === 'string' && // Still checking for userId in the token
      Array.isArray(decoded.roles) &&
      Array.isArray(decoded.permissions)
    );

    if (!isValidPayload) {
      logger.error('Invalid token payload structure', { payload: decoded });
      throw new Error('Invalid token structure');
    }

    // Cast to our TokenPayload type
    const tokenPayload = decoded as TokenPayload;

    // Explicitly create the AuthenticatedUser object
    const authenticatedUser: AuthenticatedUser = {
      id: tokenPayload.userId, // Map userId from token to id in our interface
      email: tokenPayload.email || '', // Provide default or handle potentially missing email
      roles: tokenPayload.roles,
      permissions: tokenPayload.permissions,
      organizationId: tokenPayload.organizationId || '', // Provide default empty string if missing
      teamIds: tokenPayload.teamIds,
      lang: tokenPayload.lang || 'sv', // Default language if not present
      // Add getter for userId that returns id
      get userId() {
        return this.id;
      }
    };

    // Attach user information to the request object
    req.user = authenticatedUser;

    // Add explicit check before logging
    if (req.user && req.user.id) { // Changed from userId to id
        logger.debug('Token authenticated successfully', { userId: req.user.id });
    } else {
        // This case should theoretically not happen if validation passed
        logger.error('req.user or req.user.id is undefined after authentication');
        throw new Error('Failed to attach user to request after authentication');
    }

    next();
  } catch (error: unknown) { // Catch as unknown
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Authentication token expired', { error: error.message });
      return res.status(401).json({
        error: true,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      } as ErrorResponse);
    } else if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Invalid authentication token', { error: error.message });
         return res.status(401).json({
            error: true,
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
          } as ErrorResponse);
    }
    // Handle other potential errors during verification
    const message = error instanceof Error ? error.message : 'Unknown error during token verification';
    logger.error('Token verification failed', { error: message });
    return res.status(401).json({
      error: true,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    } as ErrorResponse);
  }
};