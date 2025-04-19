import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';
import {
    // Keep Zod type for validation, but use a specific type for the handler's query
    // ListUsersInput, 
    GetUserInput, 
    UpdateUserInput, 
    AssignRoleInput, 
    RemoveRoleInput
} from '../validations/userValidations';
import { ListUsersQueryDto } from '../dtos/user.dto'; // Import the DTO for query structure
import { NotFoundError, ConflictError, AuthorizationError } from '../errors/serviceErrors';
import { AuthenticatedUser } from '../middleware/authenticateToken';

const userService = new UserService();

// Define the expected structure of query params AFTER validation/transformation
interface ProcessedListUsersQuery {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    teamId?: string;
    status?: 'active' | 'inactive' | 'pending';
    sort: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order: 'asc' | 'desc';
    organizationId?: string;
}

// --- User Handlers --- //

export const listUsersHandler = async (
    // Use the original DTO for typing the raw query, validation middleware handles transformation
    req: Request<{}, {}, {}, ListUsersQueryDto>, 
    res: Response,
    next: NextFunction
) => {
    try {
        // The query object might still be typed as ParsedQs | undefined by Express,
        // but validateRequest middleware ensures it matches ListUsersInput schema
        // and transforms page/limit. We cast it to our processed type.
        const processedQuery = req.query as unknown as ProcessedListUsersQuery; 

        // TODO: Add authorization check based on organizationId or role
        const organizationId = req.user?.organizationId; // Example extraction
        const options = { 
            ...processedQuery,
            // Ensure organizationId is applied based on role
            organizationId: req.user?.roles.includes('admin') ? processedQuery.organizationId : organizationId 
        };
        
        const { users, total } = await userService.listUsers(options); // Pass processed options
        
        res.status(200).json({ 
            success: true, 
            data: users, 
            meta: { 
                total, 
                page: options.page, // Use number from options
                limit: options.limit, // Use number from options
                pages: Math.ceil(total / options.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getUserHandler = async (
    req: Request<GetUserInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        // TODO: Add finer-grained authorization (can user view this specific profile?)
        const user = await userService.findById(req.params.userId, ['roles', 'teamMemberships', 'teamMemberships.team']);
        // Potentially filter response based on requester's role
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'USER_NOT_FOUND' });
        }
        next(error);
    }
};

export const updateUserHandler = async (
    req: Request<UpdateUserInput['params'], {}, UpdateUserInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetUserId = req.params.userId;

        // Authorization: User can update self, Admins can update others (basic check)
        // More specific checks (e.g., club admin within org) might be needed
        if (requestingUser.userId !== targetUserId && !requestingUser.roles.includes('admin') && !requestingUser.roles.includes('club_admin')) {
             throw new AuthorizationError('Cannot update another user\'s profile.');
        }
        
        // Pass requesting user's info for service-level checks
        const user = await userService.updateUser(targetUserId, req.body, requestingUser.userId, requestingUser.roles);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'USER_NOT_FOUND' });
        }
         if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
};

export const deleteUserHandler = async (
    req: Request<GetUserInput>, // Uses the same param schema as getUser
    res: Response,
    next: NextFunction
) => {
    try {
        const requestingUser = req.user as AuthenticatedUser;
        // Authorization handled by the authorize middleware on the route
        
        await userService.deleteUser(req.params.userId, requestingUser.userId);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'USER_NOT_FOUND' });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
};

// --- Role Management Handlers --- //

export const assignRoleHandler = async (
    req: Request<AssignRoleInput['params'], {}, AssignRoleInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const requestingUser = req.user as AuthenticatedUser;
        // Authorization handled by the authorize middleware on the route

        const user = await userService.assignRoleToUser(req.params.userId, req.body.roleName, requestingUser.userId);
        res.status(200).json({ success: true, data: user }); // Return updated user
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ConflictError) {
            return res.status(error.statusCode).json({ 
                error: true, 
                message: error.message, 
                code: error.code 
            });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
};

export const removeRoleHandler = async (
    req: Request<RemoveRoleInput>,
    res: Response,
    next: NextFunction
) => {
     try {
        const requestingUser = req.user as AuthenticatedUser;
         // Authorization handled by the authorize middleware on the route

        const user = await userService.removeRoleFromUser(req.params.userId, req.params.roleName, requestingUser.userId);
        res.status(200).json({ success: true, data: user }); // Return updated user
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ 
                error: true, 
                message: error.message, 
                code: 'ROLE_ASSIGNMENT_NOT_FOUND' // More specific code
            });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
}; 