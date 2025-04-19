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
        console.error(`Error fetching org ID for team ${teamId}:`, error.message);
        // Re-throw or handle specific errors like 404 if needed
        return null; 
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
        console.error(`Error fetching org ID for user ${userId}:`, error.message);
        return null;
    }
};

// --- Team Goal Controllers ---

export const getTeamGoals = async (req: Request, res: Response, next: NextFunction) => {
    const { teamId, seasonId, status, category, page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;
    const authToken = extractAuthToken(req);
    if (!userId || !authToken) {
         return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context or token missing.' });
    }
    
    let teamOrganizationId: string | null = null;
    if (teamId) {
        teamOrganizationId = await getTeamOrgId(teamId as string, authToken);
        if (!teamOrganizationId) {
             return res.status(404).json({ error: true, code: 'TEAM_ORG_NOT_FOUND', message: 'Team organization details not found or failed to fetch.' });
        }
        if (!(await checkTeamAccess(userId, teamId as string, 'team-goal:read', authToken, teamOrganizationId))) { 
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view goals for this team.' });
        }
    }
    
    // Scoping based on user role (handled by the repository or service layer ideally)
    const organizationId = req.user?.organizationId;
    const userRoles = req.user?.roles || [];
    const filters: any = {};
    if (userRoles.includes('admin') && req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
    } else if (organizationId) {
         filters.organizationId = organizationId; 
    } else if (!userRoles.includes('admin')) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Cannot determine organization scope.'});
    }
    
    if (teamId) filters.teamId = teamId as string;
    if (seasonId) filters.seasonId = seasonId as string;
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;

    const limitNum = parseInt(limit as string, 10) || 20;
    const pageNum = parseInt(page as string, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    try {
        // Fetch goals and total count separately
        const goals = await GoalRepository.findTeamGoals(filters, limitNum, offset);
        const total = await GoalRepository.countTeamGoals(filters); // Use count function
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

export const getTeamGoalById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const authToken = extractAuthToken(req);

    if (!userId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context missing.' });
    }

    try {
        // Fetch goal first (assuming repo handles basic org scoping if needed)
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const goal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!goal) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found or not accessible' });
        }
        
        // Pass the goal's organizationId
        if (!(await checkTeamAccess(userId, goal.teamId, 'team-goal:read', authToken, goal.organizationId))) {
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view this team goal.' });
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
         return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context or token missing.' });
    }
    
    let teamOrganizationId: string | null = null;
    teamOrganizationId = await getTeamOrgId(validatedData.teamId, authToken);
    if (!teamOrganizationId) {
        return res.status(404).json({ error: true, code: 'TEAM_ORG_NOT_FOUND', message: 'Target team organization details not found or failed to fetch.' });
    }

    if (!(await checkTeamAccess(createdByUserId, validatedData.teamId, 'team-goal:create', authToken, teamOrganizationId))) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to create a goal for this team.' });
    }
    
    const organizationId = teamOrganizationId; // Use the fetched ID

    try {
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
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context missing.' });
    }

    try {
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found or not accessible' });
        }
        
        if (!(await checkTeamAccess(userId, existingGoal.teamId, 'team-goal:update', authToken, existingGoal.organizationId))) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to update this team goal.' });
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
            return res.status(400).json({ error: true, code: 'BAD_REQUEST', message: 'No fields provided for update.' });
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
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context missing.' });
    }
   
    try {
        // Fetch goal first to get teamId for auth check
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found or not accessible' });
        }
        
        // Pass the goal's organizationId
        if (!(await checkTeamAccess(userId, existingGoal.teamId, 'team-goal:delete', authToken, existingGoal.organizationId))) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to delete this team goal.' });
        }

        const deleted = await GoalRepository.deleteTeamGoal(id, existingGoal.organizationId);
        if (!deleted) {
             // Logger usage removed
             return res.status(500).json({ error: true, code: 'INTERNAL_ERROR', message: 'Failed to delete goal after check.' });
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
         return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context or token missing.' });
    }
    
    const organizationId = req.user?.organizationId;
    const accessorRoles = req.user?.roles || []; 
    let effectivePlayerId = playerId as string | undefined;
    let effectiveTeamId = teamId as string | undefined;
    let canAccess = false;
    let resourceOrganizationId: string | null = null; // Use null for consistency
    let filterByChildIds: string[] | undefined = undefined; // For parent scope
    let filterByTeamIds: string[] | undefined = undefined; // For coach scope

    // Fetch the organization ID of the resource being accessed if needed for club_admin checks
    if (effectivePlayerId) {
        resourceOrganizationId = await getUserOrgId(effectivePlayerId, authToken);
        // We might not *need* to fail if orgId is null, depends on User Service canPerformAction logic
        // Let the checkPlayerAccess call handle potential denial if org context is required but missing
        if (!resourceOrganizationId) {
            console.warn(`[getPlayerGoals] Could not retrieve organizationId for player ${effectivePlayerId}`);
        } 
    } else if (effectiveTeamId) {
        resourceOrganizationId = await getTeamOrgId(effectiveTeamId, authToken);
        if (!resourceOrganizationId) {
             return res.status(404).json({ error: true, code: 'TEAM_ORG_NOT_FOUND', message: 'Team organization details not found or failed to fetch.' });
        }
    }

    // Scenario 1: Specific player requested
    if (effectivePlayerId) {
        canAccess = await checkPlayerAccess(accessorUserId, effectivePlayerId, 'player-goal:read', authToken, resourceOrganizationId || undefined); // Pass undefined if null 
        if (!canAccess) {
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view goals for this player.' });
        }
        effectiveTeamId = undefined; 
    }
    // Scenario 2: Team requested
    else if (effectiveTeamId) {
        canAccess = await checkTeamAccess(accessorUserId, effectiveTeamId, 'team:readPlayerGoals', authToken, resourceOrganizationId || undefined); 
        if (!canAccess) {
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view player goals for this team.' });
        }
    }
    // Scenario 3: No specific player or team requested - Role-based default scope
    else {
        if (accessorRoles.includes('player')) {
            effectivePlayerId = accessorUserId;
            canAccess = true; 
        } else if (accessorRoles.includes('parent')) {
             try {
                 // Fetch linked children from User Service
                 const childrenResponse = await axios.get<{ data: Array<{ childId: string }> }>
                    (`${USER_SERVICE_BASE_URL}/users/${accessorUserId}/children`,
                        { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 3000 }
                    );
                 filterByChildIds = childrenResponse.data?.data?.map(c => c.childId) || [];
                 if (filterByChildIds.length === 0) {
                     // Parent has no children, return empty list
                     return res.status(200).json({
                         success: true,
                         data: [],
                         meta: { pagination: { page: parseInt(page as string, 10) || 1, limit: parseInt(limit as string, 10) || 20, total: 0, pages: 0 } },
                     });
                 }
                 canAccess = true; // Parent can access if they have children
             } catch (error: any) {
                 console.error('[getPlayerGoals] Error fetching parent\'s children:', error.message);
                 const statusCode = error.response?.status || 500;
                 const msg = error.response?.data?.message || 'Failed to retrieve child information for filtering.';
                 return res.status(statusCode).json({ error: true, code: 'PARENT_CHILD_FETCH_ERROR', message: msg });
             }
        } else if (accessorRoles.includes('coach')) {
             // Use teamIds from the user context (JWT payload)
             filterByTeamIds = req.user?.teamIds || [];
             if (filterByTeamIds.length === 0) {
                 // Coach not assigned to any teams, return empty list
                 return res.status(200).json({
                     success: true,
                     data: [],
                     meta: { pagination: { page: parseInt(page as string, 10) || 1, limit: parseInt(limit as string, 10) || 20, total: 0, pages: 0 } },
                 });
             }
             canAccess = true; // Coach can access goals for their teams
             // Repository needs to handle filtering by teamIds
             console.warn("[getPlayerGoals] Coach scope filtering relies on GoalRepository handling filterByTeamIds.");
        } else if (accessorRoles.includes('admin') || accessorRoles.includes('club_admin')) {
            // Admins/Club Admins can view based on org scope (handled below)
            canAccess = true; 
        } else {
            // Other roles cannot list goals broadly
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to list player goals broadly.' });
        }
    }
    
    if (!canAccess && !effectivePlayerId && !effectiveTeamId) { 
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Access denied.' });
    }

    // --- Setup Filters for Repository --- 
    const filters: any = {};
    const userRoles = accessorRoles;
    // Organization scoping
    if (userRoles.includes('admin') && req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
    } else if (organizationId) {
        filters.organizationId = organizationId;
    } else if (!userRoles.includes('admin')) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Cannot determine organization scope.'});
    }
    
    // Apply specific filters OR default scope filters
    if (effectivePlayerId) filters.playerId = effectivePlayerId; 
    else if (filterByChildIds) filters.playerIds = filterByChildIds; // Pass array for IN clause
    
    if (effectiveTeamId) filters.teamId = effectiveTeamId; 
    else if (filterByTeamIds) filters.accessibleTeamIds = filterByTeamIds; // Pass array for team check

    // Apply standard query filters
    if (seasonId) filters.seasonId = seasonId as string;
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;

    // Pagination
    const limitNum = parseInt(limit as string, 10) || 20;
    const pageNum = parseInt(page as string, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    try {
        // Use the combined function that returns both goals and total
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
    const authToken = extractAuthToken(req); // Extract token

    if (!accessorUserId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context missing.' });
    }

    try {
        // Fetch goal first
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const goal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!goal) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found or not accessible' });
        }
        
        // Pass the goal's organizationId
        if (!(await checkPlayerAccess(accessorUserId, goal.playerId, 'player-goal:read', authToken, goal.organizationId))) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view this player goal.' });
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
         return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context or token missing.' });
    }
    
    let targetPlayerOrganizationId: string | null = null;
    targetPlayerOrganizationId = await getUserOrgId(validatedData.playerId, authToken);
    // We might allow creating goals for players without org if user is admin?
    // For now, let authzService handle the logic based on the provided org ID (or lack thereof)
    if (!targetPlayerOrganizationId) {
         console.warn(`[createPlayerGoalHandler] Could not retrieve organizationId for player ${validatedData.playerId}`);
    }
    
    // Pass the fetched org ID (or undefined if null) to the access check
    const canAccessPlayer = await checkPlayerAccess(createdByUserId, validatedData.playerId, 'player-goal:create', authToken, targetPlayerOrganizationId || undefined); 
    if (!canAccessPlayer && createdByUserId !== validatedData.playerId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to create a goal for this player.' });
    }
    
    // Use the target player's org ID if fetched, otherwise creator's org ID
    const organizationId = targetPlayerOrganizationId || req.user?.organizationId;
    if (!organizationId) {
        console.warn('Could not determine organization ID for player goal creation');
         return res.status(400).json({ error: true, code: 'BAD_REQUEST', message: 'Cannot determine organization for goal.' });
    }

    try {
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
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context missing.' });
    }

    try {
        // Fetch goal first
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found or not accessible' });
        }
        
        // Pass the goal's organizationId
        const canAccess = await checkPlayerAccess(accessorUserId, existingGoal.playerId, 'player-goal:update', authToken, existingGoal.organizationId);
        if (!canAccess && existingGoal.createdByUserId !== accessorUserId) { 
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to update this player goal.' });
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
            return res.status(400).json({ error: true, code: 'BAD_REQUEST', message: 'No fields provided for update.' });
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
    const authToken = extractAuthToken(req); // Extract token

     if (!accessorUserId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'User context missing.' });
    }

    try {
        // Fetch goal first
        const organizationId = req.user?.organizationId;
        const userRoles = req.user?.roles || [];
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const existingGoal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found or not accessible' });
        }
         
        // Pass the goal's organizationId
        const canAccess = await checkPlayerAccess(accessorUserId, existingGoal.playerId, 'player-goal:delete', authToken, existingGoal.organizationId);
        if (!canAccess && existingGoal.createdByUserId !== accessorUserId) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to delete this player goal.' });
        }

        const deleted = await GoalRepository.deletePlayerGoal(id, existingGoal.organizationId);
        if (!deleted) {
            // Logger usage removed
            return res.status(500).json({ error: true, code: 'INTERNAL_ERROR', message: 'Failed to delete goal after check.' });
        }
        res.status(200).json({ success: true, message: 'Player goal deleted successfully' });
    } catch (error) {
        next(error);
    }
};
