import { Request, Response, NextFunction } from 'express';
import { Location } from '../entities/Location';
import {
  findAll as repoFindAll,
  findById as repoFindById,
  createLocation as repoCreate,
  updateLocation as repoUpdate,
  deleteLocation as repoDelete,
} from '../repositories/locationRepository';

// TODO: Add proper error handling, validation, and authorization

/**
 * Get all locations, potentially filtered.
 */
export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { organizationId } = req.query;
        const locations = await repoFindAll({ organizationId: organizationId as string | undefined });
        return res.status(200).json({ success: true, data: locations });
    } catch (err) {
        console.error('[Error] Failed to fetch locations:', err);
        return next(err);
    }
};

/**
 * Get a single location by ID.
 */
export const getLocationById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }

    try {
        const location = await repoFindById(id);
        if (!location) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        return res.status(200).json({ success: true, data: location });
    } catch (err) {
        console.error(`[Error] Failed to fetch location ${id}:`, err);
        return next(err);
    }
};

/**
 * Create a new location.
 */
export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }

    const {
        name,
        description,
        street,
        city,
        postalCode,
        country,
        stateProvince,
        latitude,
        longitude,
    } = req.body as any; // Assumed validated by Zod middleware

    try {
        const newLocation = await repoCreate({
            organizationId,
            name,
            description,
            street,
            city,
            postalCode,
            country,
            stateProvince,
            latitude,
            longitude,
        });
        console.log('[Success] Location created:', newLocation);
        return res.status(201).json({ success: true, data: newLocation });
    } catch (err) {
        console.error('[Error] Failed to create location:', err);
        return next(err);
    }
};

/**
 * Update an existing location.
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }

    const dto: Partial<Location> = { ...req.body };

    if (Object.keys(dto).length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }

    try {
        const updated = await repoUpdate(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        console.log('[Success] Location updated:', updated);
        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error(`[Error] Failed to update location ${id}:`, err);
        return next(err);
    }
};

/**
 * Delete a location.
 */
export const deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }

    try {
        const deleted = await repoDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        console.log(`[Success] Location deleted: ${id}`);
        return res.status(200).json({ success: true, message: 'Location deleted successfully' });
    } catch (err) {
        if ((err as any).code === '23503') {
            console.error(`[Error] Attempted to delete location ${id} which is still in use.`);
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete location because it is still referenced by events or resources.' });
        }
        console.error(`[Error] Failed to delete location ${id}:`, err);
        return next(err);
    }
}; 