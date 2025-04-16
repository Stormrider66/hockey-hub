import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define a type for the decoded user payload from JWT
// Should match the payload structure defined in User Service
interface AuthenticatedUser {
    id: string;
    email: string;
    roles: string[];
    organizationId?: string;
    teamIds?: string[];
    preferredLanguage: string;
    firstName?: string; 
    lastName?: string; 
    // Add other fields present in your JWT payload
}

// Extend the Express Request interface to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

/**
 * Middleware to verify JWT token from Authorization header.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const publicKey = process.env.JWT_PUBLIC_KEY;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: true, 
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required: No token provided' 
        });
    }

    const token = authHeader.split(' ')[1];

    if (!publicKey) {
        console.error('[Auth Middleware] JWT_PUBLIC_KEY is not set in environment variables.');
        return res.status(500).json({ 
            error: true, 
            code: 'SERVER_CONFIG_ERROR', 
            message: 'Authentication configuration error' 
        });
    }

    const formattedPublicKey = publicKey.replace(/\n/g, '\n');

    try {
        const decoded = jwt.verify(token, formattedPublicKey, { algorithms: ['RS256'] }) as AuthenticatedUser;
        req.user = decoded; // Attach user payload to the request object
        console.log(`[Auth Middleware] User authenticated: ${req.user.email} (ID: ${req.user.id})`);
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        let code = 'INVALID_TOKEN';
        let message = 'Authentication failed: Invalid token';
        if (err instanceof jwt.TokenExpiredError) {
            code = 'TOKEN_EXPIRED';
            message = 'Authentication failed: Token expired';
            console.warn(`[Auth Middleware] Token expired for request to ${req.path}`);
        } else if (err instanceof jwt.JsonWebTokenError) {
            console.warn(`[Auth Middleware] Invalid token for request to ${req.path}:`, err.message);
        } else {
            console.error(`[Auth Middleware] Unknown authentication error for request to ${req.path}:`, err);
        }
        return res.status(401).json({ 
            error: true, 
            code: code, 
            message: message 
        });
    }
};

/**
 * Middleware to check if the authenticated user has specific roles.
 * @param allowedRoles Array of role names allowed to access the route.
 */
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.roles) {
            return res.status(401).json({ 
                error: true, 
                code: 'UNAUTHENTICATED', 
                message: 'User not authenticated' 
            });
        }

        const hasPermission = allowedRoles.some(role => req.user!.roles.includes(role));

        if (!hasPermission) {
             console.warn(`[Auth Middleware] Forbidden access attempt by user ${req.user.id} (${req.user.roles.join(',')}) to ${req.path}. Allowed: ${allowedRoles.join(',')}`);
             return res.status(403).json({ 
                error: true, 
                code: 'FORBIDDEN', 
                message: 'Insufficient permissions' 
             });
        }

        next(); // User has the required role
    };
}; 