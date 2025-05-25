import { Request, Response, NextFunction } from 'express';
import * as InjuryRepository from '../repositories/injuryRepository';
import { Injury } from '../types/medical';
import * as TreatmentRepository from '../repositories/treatmentRepository';

// TODO: Add validation, authorization, error handling

export const getInjuries = async (req: Request, res: Response, next: NextFunction) => {
    const { playerId, teamId, status, bodyPart, injuryType, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const organizationId = (req as any).user?.organizationId; // Assumed from auth

    if (!organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }
    // TODO: Add role-based filtering (e.g., coach only sees own team, player only sees own)

    const filters = {
        organizationId,
        playerId: playerId as string | undefined,
        teamId: teamId as string | undefined,
        status: status as string | undefined,
        bodyPart: bodyPart as string | undefined,
        injuryType: injuryType as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
    };
    const limitNum = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limitNum;

    try {
        const injuries = await InjuryRepository.findInjuries(filters, limitNum, offset);
        const total = await InjuryRepository.countInjuries(filters);
         res.status(200).json({ 
            success: true, 
            data: injuries,
            meta: {
                pagination: {
                    page: parseInt(page as string, 10),
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

export const getInjuryById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const organizationId = (req as any).user?.organizationId;
    // TODO: Validate ID & Authorization check
    if (!organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }

    try {
        const injury = await InjuryRepository.findInjuryById(id, organizationId);
        if (!injury) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Injury not found or not accessible' });
        }
        // TODO: Fetch related updates and treatments?
        res.status(200).json({ success: true, data: injury });
    } catch (error) {
        next(error);
    }
};

export const createInjuryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body as Partial<Injury>; 
    const organizationId = (req as any).user?.organizationId;
    const reportedByUserId = (req as any).user?.id;

    // TODO: Add validation
    if (!data.playerId || !organizationId || !data.dateOccurred || !data.bodyPart || !data.injuryType) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: playerId, dateOccurred, bodyPart, injuryType' });
    }

    try {
        const injuryToSave: Omit<Injury, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Injury['status'] } = {
            ...data,
            organizationId, // From authenticated user
            reportedByUserId, // From authenticated user
            playerId: data.playerId,
            dateOccurred: new Date(data.dateOccurred),
            dateReported: data.dateReported ? new Date(data.dateReported) : new Date(),
            bodyPart: data.bodyPart,
            injuryType: data.injuryType,
            status: data.status || 'active'
        };
        const newInjury = await InjuryRepository.createInjury(injuryToSave);
        // TODO: Potentially create PlayerAvailabilityStatus record here?
        res.status(201).json({ success: true, data: newInjury });
    } catch (error) {
        next(error);
    }
};

export const updateInjuryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body as Partial<Injury>;
    const organizationId = (req as any).user?.organizationId;
    // TODO: Validate ID & Authorization check
    if (!organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }

    // Prevent changing key identifiers
    delete data.id;
    delete data.playerId;
    delete data.organizationId;
    delete data.reportedByUserId;
    delete data.createdAt;
    delete data.updatedAt;

    try {
        const updatedInjury = await InjuryRepository.updateInjury(id, organizationId, data);
        if (!updatedInjury) {
             return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Injury not found or not accessible' });
        }
         // TODO: Potentially update PlayerAvailabilityStatus if injury status changes?
        res.status(200).json({ success: true, data: updatedInjury });
    } catch (error) {
        next(error);
    }
};

export const deleteInjuryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const organizationId = (req as any).user?.organizationId;
    // TODO: Validate ID & Authorization check
     if (!organizationId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'Organization context missing.' });
    }

    try {
        const deleted = await InjuryRepository.deleteInjury(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Injury not found or not accessible' });
        }
        res.status(200).json({ success: true, message: 'Injury deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// --- Injury Update Controllers (Placeholder) ---
export const getInjuryUpdates = async (req: Request, res: Response, _next: NextFunction) => {
    const { injuryId } = req.params; // Assuming route like /api/v1/injuries/:injuryId/updates
    // TODO: Implement fetching updates for injuryId
    res.status(501).json({ message: `GET /injuries/${injuryId}/updates Not Implemented Yet`});
};

export const addInjuryUpdate = async (req: Request, res: Response, _next: NextFunction) => {
    const { injuryId } = req.params;
    // TODO: Implement adding an update
    res.status(501).json({ message: `POST /injuries/${injuryId}/updates Not Implemented Yet`});
};

// --- Treatment Controllers (Placeholder) ---
export const getInjuryTreatments = async (req: Request, res: Response, next: NextFunction) => {
    const { injuryId } = req.params;
    try {
        const treatments = await TreatmentRepository.findTreatmentsByInjuryId(injuryId);
        res.status(200).json({ success: true, data: treatments });
    } catch (error) {
        next(error);
    }
};

export const addInjuryTreatment = async (req: Request, res: Response, next: NextFunction) => {
    const { injuryId } = req.params;
    const userId = (req as any).user?.id;
    const data = req.body as {
        date: string;
        treatmentType: string;
        notes?: string;
        durationMinutes?: number;
    };
    if (!userId) {
        return res.status(403).json({ error: true, code: 'FORBIDDEN', message: 'User context missing.' });
    }
    if (!data.date || !data.treatmentType) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: date, treatmentType' });
    }
    try {
        const newTreatment = await TreatmentRepository.createTreatment({
            injuryId,
            date: new Date(data.date),
            treatmentType: data.treatmentType,
            notes: data.notes,
            durationMinutes: data.durationMinutes,
            performedByUserId: userId
        });
        res.status(201).json({ success: true, data: newTreatment });
    } catch (error) {
        next(error);
    }
};

export const updateTreatmentHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = req.body as Partial<{
        date: string;
        treatmentType: string;
        notes?: string;
        durationMinutes?: number;
    }>;
    try {
        const updated = await TreatmentRepository.updateTreatment(id, {
            date: data.date ? new Date(data.date) : undefined,
            treatmentType: data.treatmentType,
            notes: data.notes,
            durationMinutes: data.durationMinutes
        });
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment not found' });
        }
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

export const deleteTreatmentHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const deleted = await TreatmentRepository.deleteTreatment(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Treatment not found' });
        }
        res.status(200).json({ success: true, message: 'Treatment deleted successfully' });
    } catch (error) {
        next(error);
    }
}; 