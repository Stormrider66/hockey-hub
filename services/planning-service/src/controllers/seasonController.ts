/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import * as SeasonRepository from '../repositories/seasonRepository';
import { Season, SeasonPhase } from '../types/planning';
// Re-add necessary Zod input types
import { CreateSeasonInput, UpdateSeasonInput } from '../validation/seasonSchemas'; 
import { checkTeamAccess, checkPlayerAccess } from '../services/authzService'; // Assuming helpers are here

// TODO: Add validation, authorization, error handling

export const getSeasons = async (req: Request, res: Response, next: NextFunction) => {
    const { status, page = 1, limit = 20 } = req.query;
    const organizationId = req.user?.organizationId; // Use authenticated user's orgId
    const userRoles = req.user?.roles || [];

    if (!organizationId && !userRoles.includes('admin')) { // Admins might not have an orgId
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing or insufficient permissions.' });
    }
    
    // Prepare filters - Admins see all, others see their own org
    const filters: any = {}; // Use 'any' temporarily or create specific filter type
    if (userRoles.includes('admin') && req.query.organizationId) {
        // Allow admin to filter by specific org if provided
        filters.organizationId = req.query.organizationId as string;
    } else if (organizationId) {
        filters.organizationId = organizationId;
    } else if (!userRoles.includes('admin')) {
         // Non-admin without organizationId - shouldn't happen if auth is correct
         return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Cannot determine organization scope.'});
    }
    // Else: Admin viewing all orgs (no organizationId filter)

    if (status) filters.status = status as string;

    const limitNum = parseInt(limit as string, 10) || 20;
    const pageNum = parseInt(page as string, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    try {
        const seasons = await SeasonRepository.findSeasons(filters, limitNum, offset);
        const total = await SeasonRepository.countSeasons(filters);
         res.status(200).json({ 
            success: true, 
            data: seasons,
            meta: {
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
         });
    } catch (error) {
        next(error);
    }
};

export const getSeasonById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // Validated by middleware
    const organizationId = req.user?.organizationId;
    const userRoles = req.user?.roles || [];

    if (!organizationId && !userRoles.includes('admin')) { 
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing or insufficient permissions.' });
    }

    try {
        // Admin can view any season (orgIdToCheck is undefined), others are restricted by their orgId
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const season = await SeasonRepository.findSeasonById(id, orgIdToCheck);

        if (!season) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Season not found or not accessible' });
        }
        res.status(200).json({ success: true, data: season });
    } catch (error) {
        next(error);
    }
};

export const createSeasonHandler = async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = req.body as CreateSeasonInput; 
    const organizationId = req.user?.organizationId;
    const createdByUserId = req.user?.id;
    // Authorization already handled by requireRole middleware for admin/club_admin
    if (!organizationId || !createdByUserId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User context missing.' });
    }

    try {
        const seasonToSave: Omit<Season, 'id' | 'createdAt' | 'updatedAt'> = {
            organizationId,
            name: validatedData.name,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
            status: validatedData.status,
        };
        const newSeason = await SeasonRepository.createSeason(seasonToSave);
        res.status(201).json({ success: true, data: newSeason });
    } catch (error) {
        next(error);
    }
};

export const updateSeasonHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const validatedData = req.body as UpdateSeasonInput;
    const organizationId = req.user?.organizationId;
    // Authorization check: Ensure user belongs to the organization of the season being updated
    if (!organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }

    const dataToUpdate: Partial<Omit<Season, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'> > = {};
    if (validatedData.name !== undefined) dataToUpdate.name = validatedData.name;
    if (validatedData.startDate !== undefined) dataToUpdate.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) dataToUpdate.endDate = new Date(validatedData.endDate);
    if (validatedData.status !== undefined) dataToUpdate.status = validatedData.status;

    if (Object.keys(dataToUpdate).length === 0) {
        const currentSeason = await SeasonRepository.findSeasonById(id, organizationId);
         if (!currentSeason) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Season not found or not accessible' });
         }
         return res.status(200).json({ success: true, data: currentSeason, message: "No update data provided, returning current state." });
    }

    try {
        // Repository function now checks organizationId before updating
        const updatedSeason = await SeasonRepository.updateSeason(id, organizationId, dataToUpdate);
        if (!updatedSeason) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Season not found or not accessible' });
        }
        res.status(200).json({ success: true, data: updatedSeason });
    } catch (error) {
        next(error);
    }
};

export const deleteSeasonHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    // Authorization check: Ensure user belongs to the organization of the season being deleted
     if (!organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }

    try {
        // Repository function now checks organizationId before deleting
        const deleted = await SeasonRepository.deleteSeason(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Season not found or not accessible' });
        }
        res.status(200).json({ success: true, message: 'Season deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// TODO: Add controllers for Season Phases
export const getSeasonPhases = async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId } = req.params;
    const organizationId = req.user?.organizationId;
    const userRoles = req.user?.roles || [];
    const userId = req.user?.id;

    if (!userId || (!organizationId && !userRoles.includes('admin'))) { 
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing or insufficient permissions.' });
    }

    try {
        // Verify access to the parent season first
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const season = await SeasonRepository.findSeasonById(seasonId, orgIdToCheck);
        if (!season) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Parent season not found or not accessible' });
        }
        // TODO: Potentially add finer-grained check: Can user VIEW phases for this season? 
        // (e.g., Player might see phases but not edit them)

        const phases = await SeasonRepository.findPhasesBySeasonId(seasonId, season.organizationId);
        res.status(200).json({ success: true, data: phases });
    } catch (error) {
        next(error);
    }
};

export const addSeasonPhase = async (req: Request, res: Response, next: NextFunction) => {
     const { seasonId } = req.params;
     const data = req.body as Partial<SeasonPhase>; 
     const organizationId = req.user?.organizationId;
     const userId = req.user?.id;

     if (!userId || !organizationId) { 
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
     }
     // Basic validation
     if (!data.name || !data.startDate || !data.endDate) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields for phase: name, startDate, endDate' });
     }
      if (new Date(data.endDate) < new Date(data.startDate)) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Phase end date cannot be before start date' });
    }

    try {
        // Authorization: Verify user can manage the parent season
        const season = await SeasonRepository.findSeasonById(seasonId, organizationId);
        if (!season) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Season not found or not accessible for adding phases' });
        }
        // Check if coach belongs to a team associated with this season (Requires modification to checkTeamAccess or new helper)
        // For now, rely on the route middleware role check (admin/club_admin/coach)
        // if (userRoles.includes('coach') && !(await checkSeasonTeamAccess(userId, seasonId))) {
        //     return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Coach does not have access to manage this season.' });
        // }

        // Date range validation
        if (new Date(data.startDate!) < new Date(season.startDate) || new Date(data.endDate!) > new Date(season.endDate)) {
             return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Phase dates must be within the season start and end dates' });
        }
        // TODO: Add validation for overlapping phases within the season

        const phaseToSave: Omit<SeasonPhase, 'id' | 'createdAt' | 'updatedAt'> = {
            seasonId,
            organizationId: season.organizationId, // Use organizationId from the fetched season
            name: data.name!,
            type: data.type,
            startDate: new Date(data.startDate!),
            endDate: new Date(data.endDate!),
            focusPrimary: data.focusPrimary,
            focusSecondary: data.focusSecondary,
            description: data.description,
            order: data.order
        };

        const newPhase = await SeasonRepository.createPhase(phaseToSave);
        res.status(201).json({ success: true, data: newPhase });
    } catch (error) {
        next(error);
    }
};

export const updateSeasonPhase = async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId, phaseId } = req.params;
    const data = req.body as Partial<SeasonPhase>;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id; 
    
     if (!userId || !organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }
    if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Phase end date cannot be before start date' });
    }
    
    delete data.seasonId; delete data.id; delete data.createdAt; delete data.updatedAt; delete data.organizationId;

    try {
         // Verify the phase exists and belongs to the user's org first
        const existingPhase = await SeasonRepository.findPhaseById(phaseId, organizationId);
        if (!existingPhase || existingPhase.seasonId !== seasonId) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Phase not found or does not belong to the specified season/organization.' });
        }
        // Authorization check: Can user manage this season?
        // if (userRoles.includes('coach') && !(await checkSeasonTeamAccess(userId, seasonId))) {
        //     return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Coach does not have access to manage this season.' });
        // }
        // TODO: Add validation for overlapping phases if dates change

        if (Object.keys(data).length === 0) {
             return res.status(200).json({ success: true, data: existingPhase, message: "No update data provided." });
        }

        const updatedPhase = await SeasonRepository.updatePhase(phaseId, data);
        if (!updatedPhase) {
             // This might happen if the phase was deleted between fetch and update
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Phase not found (update failed)' });
        }
        res.status(200).json({ success: true, data: updatedPhase });
    } catch (error) {
        next(error);
    }
};

export const deleteSeasonPhase = async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId, phaseId } = req.params;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id; 

     if (!userId || !organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }

    try {
        // Verify the phase exists and belongs to the user's org first
        const existingPhase = await SeasonRepository.findPhaseById(phaseId, organizationId);
        if (!existingPhase || existingPhase.seasonId !== seasonId) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Phase not found or does not belong to the specified season/organization.' });
        }
        // Authorization check: Can user manage this season?
        // if (userRoles.includes('coach') && !(await checkSeasonTeamAccess(userId, seasonId))) {
        //     return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Coach does not have access to manage this season.' });
        // }

        const deleted = await SeasonRepository.deletePhase(phaseId);
        if (!deleted) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Phase not found (delete failed)' });
        }
        res.status(200).json({ success: true, message: 'Season phase deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// ... controllers for other phase endpoints ... 