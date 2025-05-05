import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/teamService';
import { CreateTeamInput, UpdateTeamInput, AddTeamMemberInput, RemoveTeamMemberInput, GetTeamInput } from '../validations/teamValidations';
import { NotFoundError, ConflictError } from '../errors/serviceErrors';
import { AuthenticatedUser } from '../middleware/authenticateToken';
import { AuthorizationError } from '../errors/serviceErrors';
import { ParsedQs } from 'qs';
import logger from '../config/logger'; // Ensure logger is imported

export const createTeamHandler = async (
    req: Request<{}, {}, CreateTeamInput>,
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService();
    try {
        const user = req.user as AuthenticatedUser; // Assumes authenticateToken middleware ran
        const team = await teamService.createTeam(req.body, user.userId!);
        res.status(201).json({ success: true, data: team });
    } catch (error) {
        if (error instanceof ConflictError || error instanceof NotFoundError) {
            return res.status(error.statusCode).json({ 
                error: true, 
                message: error.message, 
                code: error.code 
            });
        }
        next(error);
    }
};

export const getTeamHandler = async (
    req: Request<GetTeamInput>, // Use GetTeamInput for params
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService();
    try {
        // Fetch relations like members and organization based on needs
        const team = await teamService.getTeamById(req.params.teamId, ['organization', 'members', 'members.user']);
        
        // Await lazy-loaded relations before accessing properties
        const membersData = await Promise.all(team.members.map(async (member) => {
            const userData = await member.user; // Await the user promise
            return {
                userId: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
            role: member.role, 
            position: member.position, 
            jerseyNumber: member.jerseyNumber
            };
        }));
        
        const organizationData = await team.organization; // Await the organization promise

        const response = {
             ...team,
             organizationName: organizationData?.name, // Access name safely
             members: membersData,
             organization: undefined // Remove the full organization object
        };

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        next(error);
    }
};

export const updateTeamHandler = async (
    req: Request<UpdateTeamInput['params'], {}, UpdateTeamInput['body']>,
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService(); // Instantiate inside handler
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetTeamId = req.params.teamId;
        const updateData = req.body;

        // --- Authorization Check ---
        let isAuthorized = false;

        // 1. Check if Club Admin of the correct organization
        if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            // Need to fetch the team to check its organization
            const targetTeam = await teamService.getTeamById(targetTeamId); // Fetch without relations needed here
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }

        // 2. Check if Coach/Assistant Coach of THIS team (only if not already authorized as club_admin)
        if (!isAuthorized && (requestingUser.roles.includes('coach') || requestingUser.roles.includes('assistant_coach'))) {
             // Use the existing helper method in TeamService
            const isCoachOfTeam = await teamService.hasTeamRole(requestingUser.id, targetTeamId, ['coach', 'assistant_coach']);
            if (isCoachOfTeam) {
                isAuthorized = true;
            }
        }

        // 3. Throw error if not authorized by the above checks
        if (!isAuthorized) {
             logger.warn(`Authorization failed: User ${requestingUser.id} attempted to update team ${targetTeamId} without sufficient permissions.`);
             throw new AuthorizationError('Not authorized to update this team.');
        }
        // --- End Authorization Check ---

        // Proceed with update if authorized
        const updatedTeam = await teamService.updateTeam(targetTeamId, updateData); // Service method handles actual update
        res.status(200).json({ success: true, data: updatedTeam });

    } catch (error) {
        // Catch specific errors first
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof ConflictError) { // e.g., if name conflict during update
             return res.status(409).json({ error: true, message: error.message, code: error.code });
        }
         if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        // Pass other errors to the general error handler
        next(error);
    }
};

export const deleteTeamHandler = async (
    req: Request<GetTeamInput>, // Use GetTeamInput for params
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService();
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetTeamId = req.params.teamId;

        // --- Authorization Check ---
        let isAuthorized = false;
        
        // Only allow Club Admin of the correct organization
        if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
             // Need to fetch the team to check its organization
            const targetTeam = await teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        
        // Throw error if not authorized
        if (!isAuthorized) {
             logger.warn(`Authorization failed: User ${requestingUser.id} (Role: ${requestingUser.roles.join(',')}) attempted to delete team ${targetTeamId}.`);
             throw new AuthorizationError('Only Club Administrators can delete teams within their organization.');
        }
        // --- End Authorization Check ---
        
        // Proceed with deletion if authorized
        await teamService.deleteTeam(targetTeamId);
        res.status(200).json({ success: true, message: 'Team deleted successfully' });

    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
};

export const addTeamMemberHandler = async (
    req: Request<AddTeamMemberInput['params'], {}, AddTeamMemberInput['body']>,
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService(); // Instantiate inside handler
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetTeamId = req.params.teamId;
        const memberData = req.body;

        // --- Authorization Check ---
        let isAuthorized = false;

        // 1. Check if Admin or Club Admin of the team's organization
        if (requestingUser.roles.includes('admin')) {
            isAuthorized = true;
        } else if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            const targetTeam = await teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }

        // 2. Check if Coach/Assistant Coach of THIS team (only if not already authorized)
        if (!isAuthorized && (requestingUser.roles.includes('coach') || requestingUser.roles.includes('assistant_coach'))) {
            const isCoachOfTeam = await teamService.hasTeamRole(requestingUser.id, targetTeamId, ['coach', 'assistant_coach']);
            if (isCoachOfTeam) {
                isAuthorized = true;
            }
        }

        // 3. Throw error if not authorized
        if (!isAuthorized) {
            logger.warn(`Authorization failed: User ${requestingUser.id} attempted to add member to team ${targetTeamId}.`);
            throw new AuthorizationError('Not authorized to add members to this team.');
        }
        // --- End Authorization Check ---

        // Proceed if authorized
        const member = await teamService.addMemberToTeam(targetTeamId, memberData);
        res.status(201).json({ success: true, data: member });

    } catch (error) {
         if (error instanceof NotFoundError || error instanceof ConflictError) {
            return res.status(error.statusCode).json({ 
                error: true, 
                message: error.message, 
                code: error.code 
            });
        }
        if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
};

export const removeTeamMemberHandler = async (
    req: Request<RemoveTeamMemberInput['params'], {}, {}, RemoveTeamMemberInput['query']>,
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService(); // Instantiate inside handler
    try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetTeamId = req.params.teamId;
        const targetUserId = req.params.userId;
        const targetRole = req.query.role;

        // --- Authorization Check ---
        let isAuthorized = false;
        // Similar logic to adding a member
        if (requestingUser.roles.includes('admin')) {
            isAuthorized = true;
        } else if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            const targetTeam = await teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        if (!isAuthorized && (requestingUser.roles.includes('coach') || requestingUser.roles.includes('assistant_coach'))) {
            const isCoachOfTeam = await teamService.hasTeamRole(requestingUser.id, targetTeamId, ['coach', 'assistant_coach']);
            if (isCoachOfTeam) {
                isAuthorized = true;
            }
        }
        // Prevent users from removing themselves? (Optional business rule)
        // if (requestingUser.id === targetUserId) {
        //     isAuthorized = false; // Or throw specific error
        // }

        if (!isAuthorized) {
            logger.warn(`Authorization failed: User ${requestingUser.id} attempted to remove member ${targetUserId} from team ${targetTeamId}.`);
            throw new AuthorizationError('Not authorized to remove members from this team.');
        }
        // --- End Authorization Check ---

        // Proceed if authorized
        await teamService.removeMemberFromTeam(targetTeamId, targetUserId, targetRole as string | undefined);
        res.status(200).json({ success: true, message: 'Team member removed successfully' });

    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'MEMBERSHIP_NOT_FOUND' });
        }
        if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
};

export const getTeamMembersHandler = async (
    req: Request<GetTeamInput>, // Use GetTeamInput for params
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService();
     try {
        const requestingUser = req.user as AuthenticatedUser;
        const targetTeamId = req.params.teamId;

        // --- Authorization Check ---
        let isAuthorized = false;

        // 1. Check if Admin or Club Admin of the team's organization
        if (requestingUser.roles.includes('admin')) {
            isAuthorized = true;
        } else if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            const targetTeam = await teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        
        // 2. Check if the user is a member of the team (any role)
        if (!isAuthorized) {
            const isMember = await teamService.isUserMemberOfTeam(requestingUser.id, targetTeamId);
            if (isMember) {
                isAuthorized = true;
            }
        }
        
        // 3. Throw error if not authorized
        if (!isAuthorized) {
            logger.warn(`Authorization failed: User ${requestingUser.id} attempted to view members of team ${targetTeamId}.`);
            throw new AuthorizationError('Not authorized to view members of this team.');
        }
        // --- End Authorization Check ---

        // Proceed if authorized
        const members = await teamService.getTeamMembers(targetTeamId);
        // Map to basic user info if needed, exclude sensitive data
        const memberResponse = members.map(user => ({
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email, // Consider if email should be exposed here
            // Add role/position if available/needed from TeamMember entity
        }));
        res.status(200).json({ success: true, data: memberResponse });

    } catch (error) {
         if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof AuthorizationError) {
             return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
};

// Define the expected structure of query params AFTER validation/transformation
interface ProcessedListTeamsQuery {
    page: number;
    limit: number;
    search?: string;
    organizationId?: string;
    status?: 'active' | 'inactive' | 'archived';
    category?: string;
    sort: 'name' | 'category' | 'createdAt';
    order: 'asc' | 'desc';
}

// Handler for listing teams
export const listTeamsHandler = async (
    req: Request<{}, {}, {}, ParsedQs>, 
    res: Response,
    next: NextFunction
) => {
    const teamService = new TeamService();
    try {
        const user = req.user as AuthenticatedUser;
        // Cast to ProcessedListTeamsQuery AFTER validation middleware has run
        const processedQuery = req.query as unknown as ProcessedListTeamsQuery;
        
        // Apply organization filtering based on user role
        const options = { 
            ...processedQuery,
            organizationId: user.roles.includes('admin') ? processedQuery.organizationId : user.organizationId 
        };
        
        // Ensure non-admins MUST have an organizationId context
        if (!options.organizationId && !user.roles.includes('admin')) {
            throw new AuthorizationError('Organization context is required.');
        }

        const { teams, total } = await teamService.listTeams(options);
        
        res.status(200).json({ 
            success: true, 
            data: teams, 
            meta: { 
                total,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(total / options.limit)
            }
        });
    } catch (error) {
        next(error);
    }
}; 