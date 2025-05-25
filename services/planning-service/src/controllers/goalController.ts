/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import * as GoalRepository from '../repositories/goalRepository';
import { TeamGoal, PlayerGoal } from '../types/planning';
import { 
    CreateTeamGoalInput, UpdateTeamGoalInput, 
    CreatePlayerGoalInput, UpdatePlayerGoalInput 
} from '../validation/goalSchemas';
import { checkTeamAccess, checkPlayerAccess } from '../services/authzService';
import axios from 'axios';
// Import custom errors
import { NotFoundError, AuthorizationError, InternalServerError, AuthenticationError, ValidationError } from '../errors/serviceErrors';
// import logger from '../config/logger'; // Comment out logger import
// import { findTeamById } from '../repositories/teamRepository'; // Hypothetical import

const USER_SERVICE_BASE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001/api/v1';

// Helper function to extract token (avoids repetition)
const extractAuthToken = (req: Request): string | undefined => {
    return req.headers.authorization?.split(' ')[1];
};

// Helper to fetch team organization ID
const getTeamOrgId = async (teamId: string, token?: string): Promise<string | null> => {
    if (!token) return null;
    try {
        const response = await axios.get<{ data: { organizationId: string } }>(`${USER_SERVICE_BASE_URL}/teams/${teamId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 3000
        });
        return response.data?.data?.organizationId || null;
    } catch (error: any) {
        // Throw specific error if team not found by User Service
        if (axios.isAxiosError(error) && error.response?.status === 404) {
             throw new NotFoundError(`Team organization details not found for team ${teamId}.`);
        }
        console.error(`Error fetching org ID for team ${teamId}:`, error.message);
        throw new InternalServerError('Failed to fetch team organization details.', error);
    }
};

// Helper to fetch user organization ID
const getUserOrgId = async (userId: string, token?: string): Promise<string | null> => {
    if (!token) return null;
    try {
        // Assuming GET /users/:id response includes organization: { id: string, name: string } | null
        const response = await axios.get<{ data: { organization?: { id: string } } }>(`${USER_SERVICE_BASE_URL}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 3000
        });
        return response.data?.data?.organization?.id || null;
    } catch (error: any) {
         if (axios.isAxiosError(error) && error.response?.status === 404) {
             // Don't throw here, just return null if user/org isn't found, let auth check handle it
             console.warn(`User ${userId} or their organization not found via User Service.`);
             return null;
         }
        console.error(`Error fetching org ID for user ${userId}:`, error.message);
        throw new InternalServerError('Failed to fetch user organization details.', error);
    }
};

// --- Team Goal Controllers ---

export const getTeamGoals = async (req: Request, res: Response, next: NextFunction) => {
    const { teamId, seasonId, status, category, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;
    const authToken = extractAuthToken(req);
    if (!userId || !authToken) {
         // Use AuthenticationError
         return next(new AuthenticationError('User context or token missing.')); 
    }
    
    try {
        let teamOrganizationId: string | null = null;
        if (teamId) {
            teamOrganizationId = await getTeamOrgId(teamId as string, authToken); // Throws NotFoundError if team org not found
            if (!(await checkTeamAccess(userId, teamId as string, 'team-goal:read', authToken, teamOrganizationId || undefined))) { 
                 throw new AuthorizationError('Insufficient permissions to view goals for this team.');
            }
        }
        
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const filters: any = {};
        if (userRoles.includes('admin') && req.query.organizationId) {
            filters.organizationId = req.query.organizationId as string;
        } else if (organizationId) {
             filters.organizationId = organizationId; 
        } else if (!userRoles.includes('admin')) {
            throw new AuthorizationError('Cannot determine organization scope.');
        }
        
        if (teamId) filters.teamId = teamId as string;
        if (seasonId) filters.seasonId = seasonId as string;
        if (status) filters.status = status as string;
        if (category) filters.category = category as string;

        const limitNum = parseInt(limit as string, 10) || 20;
        const pageNum = parseInt(page as string, 10) || 1;
        const offset = (pageNum - 1) * limitNum;

        const goals = await GoalRepository.findTeamGoals(filters, limitNum, offset);
        const total = await GoalRepository.countTeamGoals(filters);
        const totalPages = Math.ceil(total / limitNum);
        res.status(200).json({
            success: true,
            data: goals,
            meta: { pagination: { page: pageNum, limit: limitNum, total, pages: totalPages } },
        });
    } catch (error) {
        next(error); // Pass errors (NotFoundError, AuthorizationError, DatabaseError) to handler
    }
};

export const getTeamGoalById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const authToken = extractAuthToken(req);

    if (!userId) {
        return next(new AuthenticationError('User context missing.'));
    }

    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const goal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!goal) {
            throw new NotFoundError('Team goal not found or not accessible');
        }
        
        if (!(await checkTeamAccess(userId, goal.teamId, 'team-goal:read', authToken, goal.organizationId))) {
            throw new AuthorizationError('Insufficient permissions to view this team goal.');
        }

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

export const createTeamGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = req.body as CreateTeamGoalInput; 
    const createdByUserId = req.user?.id;
    const authToken = extractAuthToken(req);
    if (!createdByUserId || !authToken) {
         return next(new AuthenticationError('User context or token missing.'));
    }
    
    try {
        let teamOrganizationId: string | null = null;
        teamOrganizationId = await getTeamOrgId(validatedData.teamId, authToken); // Throws NotFoundError

        if (!(await checkTeamAccess(createdByUserId, validatedData.teamId, 'team-goal:create', authToken, teamOrganizationId || undefined))) {
             throw new AuthorizationError('Insufficient permissions to create a goal for this team.');
        }
        
        const organizationId = teamOrganizationId; // Use the fetched ID
        if (!organizationId) {
             // Should not happen if getTeamOrgId succeeded, but check anyway
             throw new InternalServerError('Could not determine organization ID for team goal creation.');
        }

        const goalToSave: Omit<TeamGoal, 'id' | 'createdAt' | 'updatedAt'> = {
            organizationId, 
            teamId: validatedData.teamId,
            description: validatedData.description,
            status: validatedData.status,
            createdByUserId,
            seasonId: validatedData.seasonId,
            category: validatedData.category,
            measure: validatedData.measure,
            targetValue: validatedData.targetValue,
            priority: validatedData.priority,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        };
        const newGoal = await GoalRepository.createTeamGoal(goalToSave);
        res.status(201).json({ success: true, data: newGoal });
    } catch (error) {
        next(error);
    }
};

export const updateTeamGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const validatedData = req.body as UpdateTeamGoalInput; 
    const userId = req.user?.id;
    const authToken = extractAuthToken(req);
    
    if (!userId) {
        return next(new AuthenticationError('User context missing.'));
    }

    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             throw new NotFoundError('Team goal not found or not accessible');
        }
        
        if (!(await checkTeamAccess(userId, existingGoal.teamId, 'team-goal:update', authToken, existingGoal.organizationId))) {
             throw new AuthorizationError('Insufficient permissions to update this team goal.');
        }

        const dataToUpdate: Partial<Omit<TeamGoal, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'teamId' | 'createdByUserId'> > = {};
        if (validatedData.description !== undefined) dataToUpdate.description = validatedData.description;
        if (validatedData.seasonId !== undefined) dataToUpdate.seasonId = validatedData.seasonId;
        if (validatedData.category !== undefined) dataToUpdate.category = validatedData.category;
        if (validatedData.measure !== undefined) dataToUpdate.measure = validatedData.measure;
        if (validatedData.targetValue !== undefined) dataToUpdate.targetValue = validatedData.targetValue;
        if (validatedData.priority !== undefined) dataToUpdate.priority = validatedData.priority;
        if (validatedData.status !== undefined) dataToUpdate.status = validatedData.status;
        if ('dueDate' in validatedData) {
             dataToUpdate.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : undefined;
        }

        if (Object.keys(dataToUpdate).length === 0) {
             // Throw validation error instead of 400 directly
             throw new ValidationError('No fields provided for update.');
        }
        
        const updatedGoal = await GoalRepository.updateTeamGoal(id, existingGoal.organizationId, dataToUpdate);
        res.status(200).json({ success: true, data: updatedGoal });
    } catch (error) {
        next(error);
    }
};

export const deleteTeamGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const userId = req.user?.id;
    const authToken = extractAuthToken(req);
    
     if (!userId) {
        return next(new AuthenticationError('User context missing.'));
    }
   
    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             throw new NotFoundError('Team goal not found or not accessible');
        }
        
        if (!(await checkTeamAccess(userId, existingGoal.teamId, 'team-goal:delete', authToken, existingGoal.organizationId))) {
             throw new AuthorizationError('Insufficient permissions to delete this team goal.');
        }

        const deleted = await GoalRepository.deleteTeamGoal(id, existingGoal.organizationId);
        if (!deleted) {
             // This indicates the goal wasn't found during the delete operation (race condition?)
             throw new NotFoundError('Failed to delete goal, resource might not exist.'); 
        }
        res.status(200).json({ success: true, message: 'Team goal deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- Player Goal Controllers ---

export const getPlayerGoals = async (req: Request, res: Response, next: NextFunction) => {
    const { playerId, teamId, seasonId, status, category, page = 1, limit = 20 } = req.query;
    const accessorUserId = req.user?.id;
    const authToken = extractAuthToken(req);
    if (!accessorUserId || !authToken) {
         return next(new AuthenticationError('User context or token missing.'));
    }
    
    try {
        const organizationId = req.user?.organizationId;
        const accessorRoles = req.user?.roles || []; 
        let effectivePlayerId = playerId as string | undefined;
        let effectiveTeamId = teamId as string | undefined;
        let canAccess = false;
        let resourceOrganizationId: string | null = null;
        let filterByChildIds: string[] | undefined = undefined;
        let filterByTeamIds: string[] | undefined = undefined;

        if (effectivePlayerId) {
            resourceOrganizationId = await getUserOrgId(effectivePlayerId, authToken);
        } else if (effectiveTeamId) {
            resourceOrganizationId = await getTeamOrgId(effectiveTeamId, authToken); // Throws NotFoundError
        }

        // Authorization checks
        if (effectivePlayerId) {
            canAccess = await checkPlayerAccess(accessorUserId, effectivePlayerId, 'player-goal:read', authToken, resourceOrganizationId || undefined);
            if (!canAccess) throw new AuthorizationError('Insufficient permissions to view goals for this player.');
            effectiveTeamId = undefined; 
        }
        else if (effectiveTeamId) {
            canAccess = await checkTeamAccess(accessorUserId, effectiveTeamId, 'team:readPlayerGoals', authToken, resourceOrganizationId || undefined); 
            if (!canAccess) throw new AuthorizationError('Insufficient permissions to view player goals for this team.');
        }
        else { // Default scoping based on role
            if (accessorRoles.includes('player')) {
                effectivePlayerId = accessorUserId;
                canAccess = true; 
            } else if (accessorRoles.includes('parent')) {
                 try {
                     const childrenResponse = await axios.get<{ data: Array<{ childId: string }> }>
                        (`${USER_SERVICE_BASE_URL}/users/${accessorUserId}/children`,
                            { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 3000 }
                        );
                     filterByChildIds = childrenResponse.data?.data?.map(c => c.childId) || [];
                     if (filterByChildIds.length === 0) {
                         // Return empty list, no need to throw error
                         return res.status(200).json({ success: true, data: [], meta: { pagination: { page: parseInt(page as string, 10) || 1, limit: parseInt(limit as string, 10) || 20, total: 0, pages: 0 } } });
                     }
                     canAccess = true;
                 } catch (error: any) {
                      // Log the error but throw a specific AppError
                      console.error('[getPlayerGoals] Error fetching parent\'s children:', error.message);
                      throw new InternalServerError('Failed to retrieve child information for filtering.', error);
                 }
            } else if (accessorRoles.includes('coach')) {
                 filterByTeamIds = req.user?.teamIds || [];
                 if (filterByTeamIds.length === 0) {
                     // Return empty list
                     return res.status(200).json({ success: true, data: [], meta: { pagination: { page: parseInt(page as string, 10) || 1, limit: parseInt(limit as string, 10) || 20, total: 0, pages: 0 } } });
                 }
                 canAccess = true;
                 console.warn("[getPlayerGoals] Coach scope filtering relies on GoalRepository handling filterByTeamIds.");
            } else if (accessorRoles.includes('admin') || accessorRoles.includes('club_admin')) {
                canAccess = true; 
            } else {
                 throw new AuthorizationError('Insufficient permissions to list player goals broadly.');
            }
        }
        
        if (!canAccess && !effectivePlayerId && !effectiveTeamId) { 
             throw new AuthorizationError('Access denied.');
        }

        // Filter setup
        const filters: any = {};
        const userRoles = accessorRoles;
        if (userRoles.includes('admin') && req.query.organizationId) {
            filters.organizationId = req.query.organizationId as string;
        } else if (organizationId) {
            filters.organizationId = organizationId;
        } else if (!userRoles.includes('admin')) {
             throw new AuthorizationError('Cannot determine organization scope.');
        }
        if (effectivePlayerId) filters.playerId = effectivePlayerId; 
        else if (filterByChildIds) filters.playerIds = filterByChildIds;
        if (effectiveTeamId) filters.teamId = effectiveTeamId; 
        else if (filterByTeamIds) filters.accessibleTeamIds = filterByTeamIds;
        if (seasonId) filters.seasonId = seasonId as string;
        if (status) filters.status = status as string;
        if (category) filters.category = category as string;
        
        // Pagination
        const limitNum = parseInt(limit as string, 10) || 20;
        const pageNum = parseInt(page as string, 10) || 1;
        const offset = (pageNum - 1) * limitNum;

        const { goals, total } = await GoalRepository.findPlayerGoals(filters, limitNum, offset);
        const totalPages = Math.ceil(total / limitNum);
        res.status(200).json({
            success: true,
            data: goals,
            meta: { pagination: { page: pageNum, limit: limitNum, total, pages: totalPages } },
        });
    } catch (error) {
        next(error);
    }
};

export const getPlayerGoalById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const accessorUserId = req.user?.id;
    const authToken = extractAuthToken(req); 

    if (!accessorUserId) {
        return next(new AuthenticationError('User context missing.'));
    }

    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const goal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!goal) {
             throw new NotFoundError('Player goal not found or not accessible');
        }
        
        if (!(await checkPlayerAccess(accessorUserId, goal.playerId, 'player-goal:read', authToken, goal.organizationId))) {
             throw new AuthorizationError('Insufficient permissions to view this player goal.');
        }

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

export const createPlayerGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = req.body as CreatePlayerGoalInput; 
    const createdByUserId = req.user?.id;
    const authToken = extractAuthToken(req);
    if (!createdByUserId || !authToken) {
         return next(new AuthenticationError('User context or token missing.'));
    }
    
    try {
        let targetPlayerOrganizationId: string | null = null;
        targetPlayerOrganizationId = await getUserOrgId(validatedData.playerId, authToken);
        if (!targetPlayerOrganizationId) {
             console.warn(`[createPlayerGoalHandler] Could not retrieve organizationId for player ${validatedData.playerId}. Proceeding with creator's organization.`);
        }
        
        const canAccessPlayer = await checkPlayerAccess(createdByUserId, validatedData.playerId, 'player-goal:create', authToken, targetPlayerOrganizationId || req.user?.organizationId); 
        if (!canAccessPlayer && createdByUserId !== validatedData.playerId) {
             throw new AuthorizationError('Insufficient permissions to create a goal for this player.');
        }
        
        const organizationId = targetPlayerOrganizationId || req.user?.organizationId;
        if (!organizationId) {
             throw new InternalServerError('Could not determine organization ID for player goal creation.');
        }

         const goalToSave: Omit<PlayerGoal, 'id' | 'createdAt' | 'updatedAt'> = {
            organizationId, 
            playerId: validatedData.playerId,
            description: validatedData.description,
            status: validatedData.status,
            createdByUserId,
            seasonId: validatedData.seasonId,
            category: validatedData.category,
            measure: validatedData.measure,
            targetValue: validatedData.targetValue,
            priority: validatedData.priority,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        };
        const newGoal = await GoalRepository.createPlayerGoal(goalToSave);
        res.status(201).json({ success: true, data: newGoal });
    } catch (error) {
        next(error);
    }
};

export const updatePlayerGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const validatedData = req.body as UpdatePlayerGoalInput; 
    const accessorUserId = req.user?.id;
    const authToken = extractAuthToken(req); 

    if (!accessorUserId) {
        return next(new AuthenticationError('User context missing.'));
    }

    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             throw new NotFoundError('Player goal not found or not accessible');
        }
        
        const canAccess = await checkPlayerAccess(accessorUserId, existingGoal.playerId, 'player-goal:update', authToken, existingGoal.organizationId);
        if (!canAccess && existingGoal.createdByUserId !== accessorUserId) { 
             throw new AuthorizationError('Insufficient permissions to update this player goal.');
        }

        const dataToUpdate: Partial<Omit<PlayerGoal, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'playerId' | 'createdByUserId'> > = {};
        if (validatedData.description !== undefined) dataToUpdate.description = validatedData.description;
        if (validatedData.seasonId !== undefined) dataToUpdate.seasonId = validatedData.seasonId;
        if (validatedData.category !== undefined) dataToUpdate.category = validatedData.category;
        if (validatedData.measure !== undefined) dataToUpdate.measure = validatedData.measure;
        if (validatedData.targetValue !== undefined) dataToUpdate.targetValue = validatedData.targetValue;
        if (validatedData.priority !== undefined) dataToUpdate.priority = validatedData.priority;
        if (validatedData.status !== undefined) dataToUpdate.status = validatedData.status;
        if ('dueDate' in validatedData) {
             dataToUpdate.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : undefined;
        }

        if (Object.keys(dataToUpdate).length === 0) {
            throw new ValidationError('No fields provided for update.');
        }

        const updatedGoal = await GoalRepository.updatePlayerGoal(id, existingGoal.organizationId, dataToUpdate);
        res.status(200).json({ success: true, data: updatedGoal });
    } catch (error) {
        next(error);
    }
};

export const deletePlayerGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const accessorUserId = req.user?.id;
    const authToken = extractAuthToken(req); 

     if (!accessorUserId) {
        return next(new AuthenticationError('User context missing.'));
    }

    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             throw new NotFoundError('Player goal not found or not accessible');
        }
         
        const canAccess = await checkPlayerAccess(accessorUserId, existingGoal.playerId, 'player-goal:delete', authToken, existingGoal.organizationId);
        if (!canAccess && existingGoal.createdByUserId !== accessorUserId) {
             throw new AuthorizationError('Insufficient permissions to delete this player goal.');
        }

        const deleted = await GoalRepository.deletePlayerGoal(id, existingGoal.organizationId);
        if (!deleted) {
             throw new NotFoundError('Failed to delete goal, resource might not exist.');
        }
        res.status(200).json({ success: true, message: 'Player goal deleted successfully' });
    } catch (error) {
        next(error);
    }
};
