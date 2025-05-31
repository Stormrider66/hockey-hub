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
import { User } from '../entities/User'; // Import User entity

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
    const userService = new UserService();
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
    const userService = new UserService();
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
    const userService = new UserService();
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetUserId = req.params.userId;

        // Authorization: User can update self, Admins can update others (basic check)
        // More specific checks (e.g., club admin within org) might be needed
        if (requestingUser.userId !== targetUserId && !requestingUser.roles.includes('admin') && !requestingUser.roles.includes('club_admin')) {
             throw new AuthorizationError('Cannot update another user\'s profile.');
        }
        
        // Pass requesting user's info for service-level checks
        const user = await userService.updateUser(targetUserId, req.body, requestingUser.userId!, requestingUser.roles);
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
    const userService = new UserService();
    try {
        const requestingUser = req.user as AuthenticatedUser;
        // Authorization handled by the authorize middleware on the route
        
        await userService.deleteUser(req.params.userId, requestingUser.userId!);
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
    const userService = new UserService();
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetUserId = req.params.userId;
        const roleNameToAssign = req.body.roleName;

        // Fetch target user to check organization
        const targetUser = await userService.findUserEntityById(targetUserId);
        if (!targetUser) {
            throw new NotFoundError('Target user not found.');
        }

        // Authorization Checks
        const isSystemAdmin = requestingUser.roles.includes('admin');
        const isClubAdmin = requestingUser.roles.includes('club_admin');

        if (isSystemAdmin) {
            // System Admin can assign any role
        } else if (isClubAdmin) {
            // Club Admin checks
            if (requestingUser.organizationId !== targetUser.organizationId) {
                throw new AuthorizationError('Club admin can only manage roles within their own organization.');
            }
            if (roleNameToAssign === 'admin') {
                 throw new AuthorizationError('Club admin cannot assign the system admin role.');
            }
        } else {
            // Other roles cannot assign roles
            throw new AuthorizationError('Insufficient permissions to assign roles.');
        }

        // Authorization passed, proceed with assignment
        const user = await userService.assignRoleToUser(targetUserId, roleNameToAssign, requestingUser.userId!);
        res.status(200).json({ success: true, data: user }); // Return updated user
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ConflictError) {
            return res.status(error.statusCode).json({ 
                error: true, 
                message: error.message, 
                code: error.code 
            });
        }
         if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
};

export const removeRoleHandler = async (
    req: Request<RemoveRoleInput>,
    res: Response,
    next: NextFunction
) => {
    const userService = new UserService();
     try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetUserId = req.params.userId;
        const roleNameToRemove = req.params.roleName;
        
        // Fetch target user to check organization
        const targetUser = await userService.findUserEntityById(targetUserId);
        if (!targetUser) {
            throw new NotFoundError('Target user not found.');
        }

        // Authorization Checks
        const isSystemAdmin = requestingUser.roles.includes('admin');
        const isClubAdmin = requestingUser.roles.includes('club_admin');

        if (isSystemAdmin) {
            // System Admin can remove any role
            if (targetUser.id === requestingUser.userId && roleNameToRemove === 'admin') {
                 throw new AuthorizationError('System admin cannot remove their own admin role.');
            }
        } else if (isClubAdmin) {
            // Club Admin checks
            if (requestingUser.organizationId !== targetUser.organizationId) {
                throw new AuthorizationError('Club admin can only manage roles within their own organization.');
            }
            if (roleNameToRemove === 'admin') {
                 throw new AuthorizationError('Club admin cannot remove the system admin role.');
            }
            // Prevent club admin removing their own club_admin role if they are the target?
            // (Consider adding this check if needed)
        } else {
            // Other roles cannot remove roles
            throw new AuthorizationError('Insufficient permissions to remove roles.');
        }

         // Authorization passed, proceed with removal
        const user = await userService.removeRoleFromUser(targetUserId, roleNameToRemove, requestingUser.userId!);
        res.status(200).json({ success: true, data: user }); // Return updated user
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ 
                error: true, 
                message: error.message, 
                code: 'ROLE_ASSIGNMENT_NOT_FOUND' // More specific code
            });
        }
         if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
}; 