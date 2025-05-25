/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import * as SeasonRepository from '../repositories/seasonRepository';
import { Season, SeasonPhase } from '../types/planning';
// Re-add necessary Zod input types
import { CreateSeasonInput, UpdateSeasonInput } from '../validation/seasonSchemas'; 
// import { checkTeamAccess, checkPlayerAccess } from '../services/authzService'; // Assuming helpers are here - REMOVED UNUSED IMPORT
// Import custom errors
import { NotFoundError, AuthorizationError } from '../errors/serviceErrors';
// Add import for phase input types
import { CreateSeasonPhaseInput, UpdateSeasonPhaseInput } from '../validation/seasonSchemas';

// TODO: Add validation, authorization, error handling

export const getSeasons = async (req: Request, res: Response, next: NextFunction) => {
    // const seasonService = new SeasonService(); // Example if using a service class
    const { status, page = 1, limit = 20 } = req.query;
    const organizationId = req.user?.organizationId; // Use authenticated user's orgId
    const userRoles = req.user?.roles || [];

    if (!organizationId && !userRoles.includes('admin')) {
        // Use AuthorizationError
        return next(new AuthorizationError('Organization context missing or insufficient permissions.')); 
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
         return next(new AuthorizationError('Cannot determine organization scope.'));
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
        // Assume repository throws DatabaseError or similar
        next(error);
    }
};

export const getSeasonById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // Validated by middleware
    const organizationId = req.user?.organizationId;
    const userRoles = req.user?.roles || [];

    if (!organizationId && !userRoles.includes('admin')) { 
        // Use AuthorizationError
        return next(new AuthorizationError('Organization context missing or insufficient permissions.'));
    }

    try {
        // Admin can view any season (orgIdToCheck is undefined), others are restricted by their orgId
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const season = await SeasonRepository.findSeasonById(id, orgIdToCheck);

        if (!season) {
            // Throw NotFoundError
            throw new NotFoundError('Season not found or not accessible'); 
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
        // Technically auth middleware should catch this, but belt-and-suspenders
        return next(new AuthorizationError('User context missing.')); 
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
        // Check for specific DB errors like unique constraint violation?
        next(error); // Pass DatabaseError etc. to handler
    }
};

export const updateSeasonHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; 
    const validatedData = req.body as UpdateSeasonInput;
    const organizationId = req.user?.organizationId;
    // Authorization check: Ensure user belongs to the organization of the season being updated
    if (!organizationId) {
        return next(new AuthorizationError('Organization context missing.'));
    }

    const dataToUpdate: Partial<Omit<Season, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'> > = {};
    if (validatedData.name !== undefined) dataToUpdate.name = validatedData.name;
    if (validatedData.startDate !== undefined) dataToUpdate.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) dataToUpdate.endDate = new Date(validatedData.endDate);
    if (validatedData.status !== undefined) dataToUpdate.status = validatedData.status;

    if (Object.keys(dataToUpdate).length === 0) {
        const currentSeason = await SeasonRepository.findSeasonById(id, organizationId);
         if (!currentSeason) {
             // Use NotFoundError
             throw new NotFoundError('Season not found or not accessible while checking for update data.');
         }
         return res.status(200).json({ success: true, data: currentSeason, message: "No update data provided, returning current state." });
    }

    try {
        // Repository function now checks organizationId before updating
        const updatedSeason = await SeasonRepository.updateSeason(id, organizationId, dataToUpdate);
        if (!updatedSeason) {
             // Throw NotFoundError if repo confirms not found/accessible
             throw new NotFoundError('Season not found or not accessible during update.'); 
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
        return next(new AuthorizationError('Organization context missing.'));
    }

    try {
        // Repository function now checks organizationId before deleting
        const deleted = await SeasonRepository.deleteSeason(id, organizationId);
        if (!deleted) {
            // Throw NotFoundError if repo confirms not found/accessible
            throw new NotFoundError('Season not found or not accessible during delete.'); 
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
        return next(new AuthorizationError('User or Organization context missing or insufficient permissions.'));
    }

    try {
        // Verify access to the parent season first
        const orgIdToCheck = userRoles.includes('admin') ? undefined : organizationId;
        const season = await SeasonRepository.findSeasonById(seasonId, orgIdToCheck);
        if (!season) {
            // Use NotFoundError
            throw new NotFoundError('Parent season not found or not accessible');
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
     const data = req.body as CreateSeasonPhaseInput;
     const organizationId = req.user?.organizationId;
     const userId = req.user?.id;

     if (!userId || !organizationId) { 
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
     }
     // Zod schema already checks required fields and date order

    try {
        // Authorization: Verify user can manage the parent season
        const season = await SeasonRepository.findSeasonById(seasonId, organizationId);
        if (!season) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Season not found or not accessible for adding phases' });
        }
        // TODO: Add finer-grained auth check if needed (e.g., coach permission)

        // Date range validation (within season)
        const newPhaseStart = new Date(data.startDate);
        const newPhaseEnd = new Date(data.endDate);
        if (newPhaseStart < new Date(season.startDate) || newPhaseEnd > new Date(season.endDate)) {
             return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Phase dates must be within the season start and end dates' });
        }
        
        // --- Overlap Validation --- 
        const existingPhases = await SeasonRepository.findPhasesBySeasonId(seasonId, organizationId);
        const overlaps = existingPhases.some(existing => {
            const existingStart = new Date(existing.startDate);
            const existingEnd = new Date(existing.endDate);
            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            return newPhaseStart < existingEnd && newPhaseEnd > existingStart;
        });

        if (overlaps) {
            return res.status(409).json({ error: true, code: 'CONFLICT', message: 'Phase dates overlap with an existing phase in this season.'});
        }
        // --- End Overlap Validation ---

        const phaseToSave: Omit<SeasonPhase, 'id' | 'createdAt' | 'updatedAt'> = {
            seasonId,
            organizationId: season.organizationId, // Use organizationId from the fetched season
            name: data.name,
            type: data.type,
            startDate: newPhaseStart,
            endDate: newPhaseEnd,
            focusPrimary: data.focusPrimary,
            focusSecondary: data.focusSecondary,
            description: data.description,
            order: data.order
        };

        // Ensure the type matches the allowed enum in SeasonPhase type
        const allowedTypes: Array<SeasonPhase['type']> = ['pre_season', 'regular_season', 'playoffs', 'off_season', undefined];
        if (!allowedTypes.includes(phaseToSave.type)) {
             return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: `Invalid phase type provided. Allowed types are: ${allowedTypes.filter(t => t).join(', ')}` });
        }

        const newPhase = await SeasonRepository.createPhase(phaseToSave);
        res.status(201).json({ success: true, data: newPhase });
    } catch (error) {
        next(error);
    }
};

export const updateSeasonPhase = async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId, phaseId } = req.params;
    const data = req.body as UpdateSeasonPhaseInput;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id; 
    
     if (!userId || !organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User or Organization context missing.' });
    }
    // Zod schema already checks date order if both are provided
    
    delete (data as any).seasonId; delete (data as any).id; delete (data as any).createdAt; delete (data as any).updatedAt; delete (data as any).organizationId;

    try {
         // Verify the phase exists and belongs to the user's org first
        const existingPhase = await SeasonRepository.findPhaseById(phaseId, organizationId);
        if (!existingPhase || existingPhase.seasonId !== seasonId) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Phase not found or does not belong to the specified season/organization.' });
        }
        // TODO: Add finer-grained auth check if needed

        if (Object.keys(data).length === 0) {
             return res.status(200).json({ success: true, data: existingPhase, message: "No update data provided." });
        }

        // --- Overlap Validation (if dates are changing) --- 
        const checkOverlap = data.startDate || data.endDate;
        if (checkOverlap) {
            const newPhaseStart = data.startDate ? new Date(data.startDate) : new Date(existingPhase.startDate);
            const newPhaseEnd = data.endDate ? new Date(data.endDate) : new Date(existingPhase.endDate);

            // Ensure dates are within the parent season (Fetch season if necessary)
            const season = await SeasonRepository.findSeasonById(seasonId, organizationId);
            if (!season) {
                 return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Parent season not found for validation.' });
            }
            if (newPhaseStart < new Date(season.startDate) || newPhaseEnd > new Date(season.endDate)) {
                 return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Phase dates must be within the season start and end dates' });
            }

            const otherPhases = (await SeasonRepository.findPhasesBySeasonId(seasonId, organizationId))
                                    .filter(p => p.id !== phaseId); // Exclude the current phase
                                    
            const overlaps = otherPhases.some(other => {
                const otherStart = new Date(other.startDate);
                const otherEnd = new Date(other.endDate);
                return newPhaseStart < otherEnd && newPhaseEnd > otherStart;
            });

            if (overlaps) {
                return res.status(409).json({ error: true, code: 'CONFLICT', message: 'Updated phase dates overlap with another existing phase in this season.'});
            }
        }
        // --- End Overlap Validation ---

        // Prepare data for repository, converting dates
        const dataForRepo: Partial<Omit<SeasonPhase, 'id' | 'createdAt' | 'updatedAt' | 'seasonId' | 'organizationId'> > = {};
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                 if (key === 'startDate' || key === 'endDate') {
                     (dataForRepo as any)[key] = new Date(value as string);
                 } else if (key === 'type') {
                     const allowedTypes: Array<SeasonPhase['type']> = ['pre_season', 'regular_season', 'playoffs', 'off_season', undefined];
                     if (!allowedTypes.includes(value as SeasonPhase['type'])) {
                         // Throw validation error or handle as needed - should be caught by Zod ideally
                         console.warn(`Invalid phase type passed to update: ${value}`);
                         // Potentially skip this field update or return error
                     } else {
                         (dataForRepo as any)[key] = value;
                     }
                 } else {
                     (dataForRepo as any)[key] = value;
                 }
            }
        });
        
        if (Object.keys(dataForRepo).length === 0) {
             return res.status(400).json({ error: true, code: 'BAD_REQUEST', message: 'No valid fields provided for update after processing.' });
        }
        
        // Pass the processed data with Date objects
        const updatedPhase = await SeasonRepository.updatePhase(phaseId, dataForRepo);
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