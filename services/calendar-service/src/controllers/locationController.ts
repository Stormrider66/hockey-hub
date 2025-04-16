import { Request, Response, NextFunction } from 'express';
import db from '../db';
import { Location } from '../types/location';
import { QueryResult } from 'pg';

// TODO: Add proper error handling, validation, and authorization

/**
 * Get all locations, potentially filtered.
 */
export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.query; // Example filter

    // TODO: Get user's organizationId from token for filtering if not admin

    let queryText = 'SELECT * FROM locations';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;

    if (organizationId) {
        whereClauses.push(`organization_id = $${paramIndex++}`);
        queryParams.push(organizationId as string);
    }
    // TODO: Add more filters if needed (e.g., search by name)

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ' ORDER BY name ASC'; // Default ordering

    console.log('[DB Query] Fetching locations:', queryText, queryParams);

    try {
        const result: QueryResult<Location> = await db.query(queryText, queryParams);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[Error] Failed to fetch locations:', err);
        next(err);
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
        const queryText = 'SELECT * FROM locations WHERE id = $1';
        console.log('[DB Query] Fetching location by ID:', queryText, [id]);
        const result: QueryResult<Location> = await db.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }

        // TODO: Add logic to fetch associated resources if needed

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`[Error] Failed to fetch location ${id}:`, err);
        next(err);
    }
};

/**
 * Create a new location.
 */
export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Get organizationId from authenticated user token (req.user)
    const organizationId = 'placeholder-org-id'; // Replace with actual ID

    const { name, address, description } = req.body as Partial<Location>;

    if (!name) {
        return res.status(400).json({ error: true, message: 'Missing required field: name' });
    }

    try {
        const queryText = `
            INSERT INTO locations (organization_id, name, address, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const params = [organizationId, name, address || null, description || null];
        console.log('[DB Query] Creating location:', queryText, params);
        const result: QueryResult<Location> = await db.query(queryText, params);

        console.log('[Success] Location created:', result.rows[0]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[Error] Failed to create location:', err);
        next(err);
    }
};

/**
 * Update an existing location.
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, address, description } = req.body as Partial<Location>;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }
    // TODO: Add authorization - can this user update this location?

    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); updateParams.push(name); }
    if (address !== undefined) { updateFields.push(`address = $${paramIndex++}`); updateParams.push(address); }
    if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateParams.push(description); }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE locations SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating location:', queryText, updateParams);

    try {
        const result: QueryResult<Location> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        console.log('[Success] Location updated:', result.rows[0]);
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`[Error] Failed to update location ${id}:`, err);
        next(err);
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
    // TODO: Add authorization - can this user delete this location?
    // TODO: Consider impact on events/resources using this location (FK constraint: ON DELETE SET NULL)

    try {
        const queryText = 'DELETE FROM locations WHERE id = $1 RETURNING id';
        console.log('[DB Query] Deleting location:', queryText, [id]);
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }

        console.log(`[Success] Location deleted: ${id}`);
        res.status(200).json({ success: true, message: 'Location deleted successfully' });
    } catch (err) {
        // Catch potential foreign key constraint errors if resources/events still link here
        if ((err as any).code === '23503') { // Foreign key violation error code in PostgreSQL
             console.error(`[Error] Attempted to delete location ${id} which is still in use.`);
             return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete location because it is still referenced by events or resources.'});
        }
        console.error(`[Error] Failed to delete location ${id}:`, err);
        next(err);
    }
}; 