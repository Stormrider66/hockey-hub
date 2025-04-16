/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import * as GoalRepository from '../repositories/goalRepository';
import { TeamGoal, PlayerGoal } from '../types/planning';
import { 
    CreateTeamGoalInput, UpdateTeamGoalInput, 
    CreatePlayerGoalInput, UpdatePlayerGoalInput 
} from '../validation/goalSchemas';
import { checkTeamAccess, checkPlayerAccess } from '../services/authzService';

// --- Team Goal Controllers ---

export const getTeamGoals = async (req: Request, res: Response, next: NextFunction) => {
    const { teamId, seasonId, status, category, page = 1, limit = 20 } = req.query;
    const organizationId = req.user?.organizationId; 
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    if (!userId || (!organizationId && !userRoles.includes('admin'))) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing or insufficient permissions.' });
    }
    
    if (teamId && !(await checkTeamAccess(userId, userRoles, organizationId, teamId as string))) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view goals for this team.' });
    }
    // Define default scope: Admins see all (unless org filtered), club_admins/coaches see their org.
    // Further filtering by team handled in query or below.

    const filters: any = {};
    if (userRoles.includes('admin') && req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
    } else if (organizationId) {
         filters.organizationId = organizationId; // Non-admin users are scoped to their org
    } else if (!userRoles.includes('admin')) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Cannot determine organization scope.'});
    }
    
    if (teamId) filters.teamId = teamId as string;
    // If not admin/club_admin and no specific teamId requested, maybe filter by user's teams?
    // else if (!userRoles.includes('admin') && !userRoles.includes('club_admin')) {
    //     const userTeams = req.user?.teamIds || []; 
    //     if (userTeams.length === 0) return res.status(200).json({ success: true, data: [], meta: { pagination: { ... } } }); // No teams, no goals
    //     filters.teamId = userTeams; // Modify repository to handle IN clause
    // }
    
    if (seasonId) filters.seasonId = seasonId as string;
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    
    const limitNum = parseInt(limit as string, 10) || 20;
    const pageNum = parseInt(page as string, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    try {
        const goals = await GoalRepository.findTeamGoals(filters, limitNum, offset);
        const total = await GoalRepository.countTeamGoals(filters);
        res.status(200).json({ 
            success: true, data: goals,
            meta: { pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } }
         });
    } catch (error) {
        next(error);
    }
};

export const getTeamGoalById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];

    if (!userId || (!organizationId && !userRoles.includes('admin'))) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing or insufficient permissions.' });
    }

    try {
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const goal = await GoalRepository.findTeamGoalById(id, orgIdToCheck);
        if (!goal) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found or not accessible' });
        }
        if (!(await checkTeamAccess(userId, userRoles, organizationId, goal.teamId))) {
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view this team goal.' });
        }

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

export const createTeamGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = req.body as CreateTeamGoalInput; 
    const organizationId = req.user?.organizationId;
    const createdByUserId = req.user?.id;
    const userRoles = req.user?.roles || [];
    // Roles check already done by middleware requireRole(['admin', 'club_admin', 'coach'])
    if (!organizationId || !createdByUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User context missing.' });
    }
    
    if (!(await checkTeamAccess(createdByUserId, userRoles, organizationId, validatedData.teamId))) {
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to create a goal for this team.' });
    }

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
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];
    // Role check done by middleware
    if (!organizationId || !userId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }

    try {
        const existingGoal = await GoalRepository.findTeamGoalById(id, organizationId);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found or not accessible' });
        }
        if (!(await checkTeamAccess(userId, userRoles, organizationId, existingGoal.teamId))) {
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
        if (validatedData.dueDate !== undefined) {
            dataToUpdate.dueDate = new Date(validatedData.dueDate);
        }

        if (Object.keys(dataToUpdate).length === 0) {
             return res.status(200).json({ success: true, data: existingGoal, message: "No update data provided, returning current state." });
        }

        const updatedGoal = await GoalRepository.updateTeamGoal(id, organizationId, dataToUpdate);
        if (!updatedGoal) { 
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found during update (race condition?)' });
        }
        res.status(200).json({ success: true, data: updatedGoal });
    } catch (error) {
        next(error);
    }
};

export const deleteTeamGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    const userRoles = req.user?.roles || [];
    // Role check done by middleware
     if (!organizationId || !userId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }
   
    try {
        const existingGoal = await GoalRepository.findTeamGoalById(id, organizationId);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found or not accessible' });
        }
        if (!(await checkTeamAccess(userId, userRoles, organizationId, existingGoal.teamId))) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to delete this team goal.' });
        }

        const deleted = await GoalRepository.deleteTeamGoal(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Team goal not found (delete failed)' });
        }
        res.status(200).json({ success: true, message: 'Team goal deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- Player Goal Controllers ---

export const getPlayerGoals = async (req: Request, res: Response, next: NextFunction) => {
    const { playerId, teamId, seasonId, status, category, page = 1, limit = 20 } = req.query;
    const organizationId = req.user?.organizationId; 
    const accessorUserId = req.user?.id;
    const accessorRoles = req.user?.roles || []; 

    if (!organizationId || !accessorUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }
    
    // Authorization Checks
    let effectivePlayerId = playerId as string | undefined;
    let effectiveTeamId = teamId as string | undefined;

    // Scenario 1: Specific player requested
    if (effectivePlayerId) {
        if (!(await checkPlayerAccess(accessorUserId, accessorRoles, organizationId, effectivePlayerId))) {
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view goals for this player.' });
        }
        effectiveTeamId = undefined; // Ignore team filter if specific player is requested and allowed
    }
    // Scenario 2: Team requested (but not specific player)
    else if (effectiveTeamId) {
        if (!(await checkTeamAccess(accessorUserId, accessorRoles, organizationId, effectiveTeamId))) {
            return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view goals for this team.' });
        }
    }
    // Scenario 3: No specific player or team requested
    else {
        // - Admin/Club Admin: Can see all in their org (filters.organizationId is set below)
        // - Coach: Should only see players on their teams (Modify filters or repo query)
        // - Player: Should only see their own goals
        // - Parent: Should only see their child's goals
        if (accessorRoles.includes('player')) {
            effectivePlayerId = accessorUserId; // Default to self
        } else if (accessorRoles.includes('parent')) {
             // TODO: Fetch linked children, return 403 if none or set effectivePlayerId if one?
             console.warn("[getPlayerGoals] Parent scope not implemented.");
             return res.status(501).json({ message: "Parent goal view not implemented"});
        } else if (accessorRoles.includes('coach')){
            // TODO: Fetch coach's teams, modify filter/repo query to use teamIds
            console.warn("[getPlayerGoals] Coach default scope (own teams) not implemented.");
             // For now, let it fetch all in org, needs refinement
        }
        // Admins/ClubAdmins implicitly see all within their org scope set below
    }

    const filters: any = {};
    if (accessorRoles.includes('admin') && req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
    } else {
        filters.organizationId = organizationId;
    }
    
    if (effectivePlayerId) filters.playerId = effectivePlayerId;
    if (effectiveTeamId) filters.teamId = effectiveTeamId; // Repo needs to handle join
    if (seasonId) filters.seasonId = seasonId as string;
    if (status) filters.status = status as string;
    if (category) filters.category = category as string;
    
    const limitNum = parseInt(limit as string, 10) || 20;
    const pageNum = parseInt(page as string, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    try {
        const goals = await GoalRepository.findPlayerGoals(filters, limitNum, offset);
        const total = await GoalRepository.countPlayerGoals(filters);
        res.status(200).json({ 
            success: true, data: goals,
            meta: { pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } }
         });
    } catch (error) {
        next(error);
    }
};

export const getPlayerGoalById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const organizationId = req.user?.organizationId;
    const accessorUserId = req.user?.id;
    const accessorRoles = req.user?.roles || [];

    if (!organizationId || !accessorUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }

    try {
        const orgIdToCheck = accessorRoles.includes('admin') ? undefined : organizationId;
        const goal = await GoalRepository.findPlayerGoalById(id, orgIdToCheck);
        if (!goal) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found or not accessible' });
        }
        if (!(await checkPlayerAccess(accessorUserId, accessorRoles, organizationId, goal.playerId))) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to view this player goal.' });
        }

        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        next(error);
    }
};

export const createPlayerGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = req.body as CreatePlayerGoalInput; 
    const organizationId = req.user?.organizationId;
    const createdByUserId = req.user?.id;
    const userRoles = req.user?.roles || [];
    // Role check done by middleware
    if (!organizationId || !createdByUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User context missing.' });
    }
    // Authorization: Can user create goal for target player?
    // User can create for self, coach for team player?, admin for anyone in org
    const canAccessPlayer = await checkPlayerAccess(createdByUserId, userRoles, organizationId, validatedData.playerId);
    // Allow self-creation OR if user has access via role (coach/admin/parent)
    if (createdByUserId !== validatedData.playerId && !canAccessPlayer) { 
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to create a goal for this player.' });
    }
    // TODO: Add specific check if coach can create goal for players on their team

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
    const organizationId = req.user?.organizationId;
    const accessorUserId = req.user?.id;
    const accessorRoles = req.user?.roles || [];

    if (!organizationId || !accessorUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }

    try {
        const existingGoal = await GoalRepository.findPlayerGoalById(id, organizationId);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found or not accessible' });
        }
        // Authorization check: Can user update this player's goal?
        // Checks if user can access the player OR if they created the goal themselves.
        if (!(await checkPlayerAccess(accessorUserId, accessorRoles, organizationId, existingGoal.playerId)) && existingGoal.createdByUserId !== accessorUserId ) {
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
        if (validatedData.dueDate !== undefined) {
            dataToUpdate.dueDate = new Date(validatedData.dueDate);
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(200).json({ success: true, data: existingGoal, message: "No update data provided, returning current state." });
        }

        const updatedGoal = await GoalRepository.updatePlayerGoal(id, organizationId, dataToUpdate);
        if (!updatedGoal) { 
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found during update' });
        }
        res.status(200).json({ success: true, data: updatedGoal });
    } catch (error) {
        next(error);
    }
};

export const deletePlayerGoalHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const organizationId = req.user?.organizationId;
    const accessorUserId = req.user?.id;
    const accessorRoles = req.user?.roles || [];

     if (!organizationId || !accessorUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }

    try {
        const existingGoal = await GoalRepository.findPlayerGoalById(id, organizationId);
        if (!existingGoal) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found or not accessible' });
        }
         // Authorization check: Can user delete this player's goal?
        if (!(await checkPlayerAccess(accessorUserId, accessorRoles, organizationId, existingGoal.playerId)) && existingGoal.createdByUserId !== accessorUserId) {
             return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Insufficient permissions to delete this player goal.' });
        }

        const deleted = await GoalRepository.deletePlayerGoal(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Player goal not found (delete failed)' });
        }
        res.status(200).json({ success: true, message: 'Player goal deleted successfully' });
    } catch (error) {
        next(error);
    }
};
