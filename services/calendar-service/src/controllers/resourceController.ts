import { Request, Response, NextFunction } from 'express';
import { ResourceType } from '../entities/ResourceType';
import { Resource } from '../entities/Resource';
import {
  findAll as rtFindAll,
  findById as rtFindById,
  createResourceType as rtCreate,
  updateResourceType as rtUpdate,
  deleteResourceType as rtDelete,
} from '../repositories/resourceTypeRepository';

import {
  findAll as resFindAll,
  findById as resFindById,
  createResource as resCreate,
  updateResource as resUpdate,
  deleteResource as resDelete,
} from '../repositories/resourceRepository';

// TODO: Add proper error handling, validation, and authorization

// --- Resource Type Handlers ---

export const getAllResourceTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.query;
        const types = await rtFindAll({ organizationId: organizationId as string | undefined });
        return res.status(200).json({ success: true, data: types });
    } catch (err) {
        console.error('[Error] Failed to fetch resource types:', err);
        return next(err);
    }
};

export const getResourceTypeById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource type ID format' });
    }

    try {
        const type = await rtFindById(id);
        if (!type) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        return res.status(200).json({ success: true, data: type });
    } catch (err) {
        console.error(`[Error] Failed to fetch resource type ${id}:`, err);
        return next(err);
    }
};

export const createResourceType = async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }
    const { name, description } = req.body as Partial<ResourceType>;

    if (!name) {
        return res.status(400).json({ error: true, message: 'Missing required field: name' });
    }

    try {
        const newType = await rtCreate({ organizationId, name, description });
        return res.status(201).json({ success: true, data: newType });
    } catch (err) {
        console.error('[Error] Failed to create resource type:', err);
        return next(err);
    }
};

export const updateResourceType = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource type ID format' });
    }

    const dto: Partial<ResourceType> = { ...req.body };
    if (Object.keys(dto).length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }

    try {
        const updated = await rtUpdate(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error(`[Error] Failed to update resource type ${id}:`, err);
        return next(err);
    }
};

export const deleteResourceType = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource type ID format' });
    }

    try {
        const deleted = await rtDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        return res.status(200).json({ success: true, message: 'Resource type deleted successfully' });
    } catch (err) {
        if ((err as any).code === '23503') {
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete resource type because it is still in use by resources.' });
        }
        console.error(`[Error] Failed to delete resource type ${id}:`, err);
        return next(err);
    }
};

// --- Resource Handlers ---

export const getAllResources = async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId: orgId, locationId, resourceTypeId } = req.query;
    // TODO: Filter by user's org ID from token

    try {
        const resources = await resFindAll({
            organizationId: orgId as string | undefined,
            locationId: locationId as string | undefined,
            resourceTypeId: resourceTypeId as string | undefined,
        });
        return res.status(200).json({ success: true, data: resources });
    } catch (err) {
        console.error('[Error] Failed to fetch resources:', err);
        return next(err);
    }
};

export const getResourceById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }

    try {
        const resource = await resFindById(id);
        if (!resource) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        return res.status(200).json({ success: true, data: resource });
    } catch (err) {
        console.error(`[Error] Failed to fetch resource ${id}:`, err);
        return next(err);
    }
};

export const createResource = async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }

    const { name, description, resourceTypeId, locationId, capacity, isBookable = true } = req.body as Partial<Resource> & { isBookable?: boolean } & { locationId?: string };

    if (!name || !resourceTypeId || !locationId) {
        return res.status(400).json({ error: true, message: 'Missing required fields: name, resourceTypeId, locationId' });
    }

    try {
        const newResource = await resCreate({
            organizationId,
            name,
            description,
            resourceTypeId,
            locationId,
            capacity,
            isBookable,
        });
        return res.status(201).json({ success: true, data: newResource });
    } catch (err) {
        console.error('[Error] Failed to create resource:', err);
        return next(err);
    }
};

export const updateResource = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }

    const dto: Partial<Resource> & { locationId?: string; isBookable?: boolean } = { ...req.body };

    if (Object.keys(dto).length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }

    try {
        const updated = await resUpdate(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error(`[Error] Failed to update resource ${id}:`, err);
        return next(err);
    }
};

export const deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }

    try {
        const deleted = await resDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        return res.status(200).json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
        if ((err as any).code === '23503') {
            console.error(`[Error] Attempted to delete resource ${id} which is still in use.`);
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete resource because it is still referenced (check FK constraints).' });
        }
        console.error(`[Error] Failed to delete resource ${id}:`, err);
        return next(err);
    }
};

// Placeholder for getResourceAvailability - Implement later
export const getResourceAvailability = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { start, end } = req.query as { start?: string; end?: string };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }

    if (!start || !end) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'start and end query parameters are required' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid date format for start or end' });
    }
    if (endDate <= startDate) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'end must be after start' });
    }

    // Check resource exists and is bookable
    const resource = await resFindById(id);
    if (!resource || !resource.isBookable) {
        return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found or not bookable' });
    }

    // Find conflicting events using conflictDetection util
    const { findConflictingEvents } = await import('../utils/conflictDetection');
    const conflicts = await findConflictingEvents({
        startTime: start,
        endTime: end,
        resourceIds: [id],
    });

    const available = conflicts.length === 0;
    res.status(200).json({ success: true, data: { available, conflicts } });
};

/**
 * Bulk availability checker for multiple resources within a time window.
 * Query params:
 *   ids  – comma-separated list of resource UUIDs (required)
 *   start, end – ISO strings (required)
 *   granularityMinutes – optional positive integer; if provided, the response includes slot availability.
 */
export const getResourcesAvailability = async (req: Request, res: Response, _next: NextFunction) => {
    const { ids, start, end, granularityMinutes } = req.query as {
        ids?: string;
        start?: string;
        end?: string;
        granularityMinutes?: string;
    };

    if (!ids || !start || !end) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'ids, start and end query parameters are required' });
    }

    const resourceIds = ids.split(',').map(id => id.trim()).filter(Boolean);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (resourceIds.some(id => !uuidRegex.test(id))) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format in ids list' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid start/end values' });
    }

    // Verify all resources exist & are bookable
    const resources = await Promise.all(resourceIds.map(rid => resFindById(rid)));
    const missing: string[] = [];
    const validResources: Resource[] = [];
    resources.forEach((resItem, idx) => {
        if (!resItem || !resItem.isBookable) {
            missing.push(resourceIds[idx]);
        } else {
            validResources.push(resItem);
        }
    });
    if (missing.length > 0) {
        return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Some resources not found or not bookable', details: { missing } });
    }

    // Conflicts
    const { findConflictingEvents } = await import('../utils/conflictDetection');
    const conflicts = await findConflictingEvents({
        startTime: start,
        endTime: end,
        resourceIds,
    });

    const busyByResource: Record<string, any[]> = {};
    resourceIds.forEach(id => (busyByResource[id] = []));
    conflicts.forEach(c => {
        busyByResource[c.conflict_identifier].push(c);
    });

    const summary = resourceIds.map(id => ({ id, available: busyByResource[id].length === 0 }));

    // Slot calculation if granularityMinutes provided
    let slots: Array<{ start: string; end: string; unavailableResourceIds: string[] }> | undefined;
    if (granularityMinutes) {
        const step = parseInt(granularityMinutes, 10);
        if (isNaN(step) || step <= 0) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'granularityMinutes must be a positive integer' });
        }

        slots = [];
        for (let t = startDate.getTime(); t < endDate.getTime(); t += step * 60000) {
            const slotStart = new Date(t);
            const slotEnd = new Date(Math.min(t + step * 60000, endDate.getTime()));

            const unavailable: string[] = [];
            resourceIds.forEach(rid => {
                const hasOverlap = busyByResource[rid].some(evt => {
                    return new Date(evt.start_time).getTime() < slotEnd.getTime() && new Date(evt.end_time).getTime() > slotStart.getTime();
                });
                if (hasOverlap) unavailable.push(rid);
            });

            slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), unavailableResourceIds: unavailable });
        }
    }

    res.status(200).json({ success: true, data: { resources: summary, slots } });
}; 