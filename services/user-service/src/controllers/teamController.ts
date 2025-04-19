import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/teamService';
import { CreateTeamInput, UpdateTeamInput, AddTeamMemberInput, RemoveTeamMemberInput, GetTeamInput } from '../validations/teamValidations';
import { NotFoundError, ConflictError } from '../errors/serviceErrors';
import { AuthenticatedUser } from '../middleware/authenticateToken';

const teamService = new TeamService();

export const createTeamHandler = async (
    req: Request<{}, {}, CreateTeamInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.user as AuthenticatedUser; // Assumes authenticateToken middleware ran
        const team = await teamService.createTeam(req.body, user.userId);
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
    try {
        // Fetch relations like members and organization based on needs
        const team = await teamService.getTeamById(req.params.teamId, ['organization', 'members', 'members.user']);
        // Potentially filter sensitive user data from members list before responding
        const members = team.members.map(member => ({ 
            userId: member.user.id, 
            firstName: member.user.firstName, 
            lastName: member.user.lastName, 
            role: member.role, 
            position: member.position, 
            jerseyNumber: member.jerseyNumber
        }));

        const response = {
             ...team,
             organizationName: team.organization?.name, // Add org name
             members: members,
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
    try {
        const team = await teamService.updateTeam(req.params.teamId, req.body);
        res.status(200).json({ success: true, data: team });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof ConflictError) { // e.g., if name conflict during update
             return res.status(409).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
};

export const deleteTeamHandler = async (
    req: Request<GetTeamInput>, // Use GetTeamInput for params
    res: Response,
    next: NextFunction
) => {
    try {
        await teamService.deleteTeam(req.params.teamId);
        res.status(200).json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        next(error);
    }
};

export const addTeamMemberHandler = async (
    req: Request<AddTeamMemberInput['params'], {}, AddTeamMemberInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const member = await teamService.addMemberToTeam(req.params.teamId, req.body);
        res.status(201).json({ success: true, data: member });
    } catch (error) {
         if (error instanceof NotFoundError || error instanceof ConflictError) {
            return res.status(error.statusCode).json({ 
                error: true, 
                message: error.message, 
                code: error.code 
            });
        }
        next(error);
    }
};

export const removeTeamMemberHandler = async (
    req: Request<RemoveTeamMemberInput['params'], {}, {}, RemoveTeamMemberInput['query']>,
    res: Response,
    next: NextFunction
) => {
    try {
        await teamService.removeMemberFromTeam(req.params.teamId, req.params.userId, req.query.role);
        res.status(200).json({ success: true, message: 'Team member removed successfully' });
    } catch (error) {
        if (error instanceof NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'MEMBERSHIP_NOT_FOUND' });
        }
        next(error);
    }
};

export const getTeamMembersHandler = async (
    req: Request<GetTeamInput>, // Use GetTeamInput for params
    res: Response,
    next: NextFunction
) => {
     try {
        // Note: The teamService.getTeamMembers returns User[] directly
        const members = await teamService.getTeamMembers(req.params.teamId);
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
        next(error);
    }
}; 