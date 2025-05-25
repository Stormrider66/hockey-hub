import { Router, Request, Response, NextFunction } from 'express';
import { checkPermission } from '../controllers/authorizationController';
import { AuthenticatedUser } from '../middleware/authenticateToken';
// import { validateQuery } from '../middleware/validationMiddleware'; // TODO: Implement and import validation middleware
// import { checkPermissionSchema } from '../dtos/authorization.dto'; // TODO: Create DTO/schema for validation

const router: Router = Router();

/**
 * Mock authentication middleware for local testing
 * This should NOT be used in production and will be replaced by actual JWT verification
 */
const authenticateTokenPlaceholder = (req: Request, _res: Response, next: NextFunction) => {
    // TODO: Replace with actual JWT verification logic
    // This mock attaches a dummy user for the controller to work
    // In reality, this should come from a verified JWT
    const userIdHeader = req.headers['x-user-id'];
    const userRolesHeader = req.headers['x-user-roles'];
    
    // Create a mock user that implements the AuthenticatedUser interface
    req.user = { 
        id: typeof userIdHeader === 'string' ? userIdHeader : 'mock-user-id', 
        email: 'test@example.com',
        // Explicitly handle string case after type check
        roles: typeof userRolesHeader === 'string' 
               ? userRolesHeader.split(',') 
               : ['coach'], // Default if header is missing or not a string
        permissions: ['read:all', 'write:team'],
        organizationId: 'mock-org-id',
        lang: 'sv',
        // Add userId getter 
        get userId() {
            return this.id;
        }
    } as AuthenticatedUser;
    
    console.warn('Using placeholder authentication middleware!');
    next();
};

/**
 * GET /authorization/check
 * Checks if the authenticated user has permission to perform an action.
 * Query Parameters:
 *  - action: string (required) - The action being performed (e.g., 'team:update')
 *  - resourceType: string (required) - The type of resource (e.g., 'team', 'user')
 *  - resourceId?: string (optional) - The specific ID of the resource
 */
router.get(
    '/check',
    authenticateTokenPlaceholder, // Apply authentication middleware first
    // validateQuery(checkPermissionSchema), // TODO: Add validation for query parameters
    checkPermission
);

export default router; 