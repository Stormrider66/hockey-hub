import { Request, Response, NextFunction } from 'express';
import db from '../db';
import { ResourceType, Resource } from '../types/resource';
import { QueryResult } from 'pg';

// TODO: Add proper error handling, validation, and authorization

// --- Resource Type Handlers ---

export const getAllResourceTypes = async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId } = req.query; // Example filter
    // TODO: Filter by user's org ID from token

    let queryText = 'SELECT * FROM resource_types';
    const queryParams = [];
    if (organizationId) {
        queryText += ' WHERE organization_id = $1';
        queryParams.push(organizationId as string);
    }
    queryText += ' ORDER BY name ASC';

    console.log('[DB Query] Fetching resource types:', queryText, queryParams);
    try {
        const result: QueryResult<ResourceType> = await db.query(queryText, queryParams);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[Error] Failed to fetch resource types:', err);
        next(err);
    }
};

export const getResourceTypeById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Validate ID format
    // TODO: Check authorization

    try {
        const queryText = 'SELECT * FROM resource_types WHERE id = $1';
        console.log('[DB Query] Fetching resource type by ID:', queryText, [id]);
        const result: QueryResult<ResourceType> = await db.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`[Error] Failed to fetch resource type ${id}:`, err);
        next(err);
    }
};

export const createResourceType = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Get organizationId from token
    const organizationId = 'placeholder-org-id';
    const { name, description } = req.body as Partial<ResourceType>;

    if (!name) {
        return res.status(400).json({ error: true, message: 'Missing required field: name' });
    }

    try {
        const queryText = `
            INSERT INTO resource_types (organization_id, name, description)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const params = [organizationId, name, description || null];
        console.log('[DB Query] Creating resource type:', queryText, params);
        const result: QueryResult<ResourceType> = await db.query(queryText, params);

        console.log('[Success] Resource type created:', result.rows[0]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[Error] Failed to create resource type:', err);
        next(err);
    }
};

export const updateResourceType = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description } = req.body as Partial<ResourceType>;
    // TODO: Validate ID format & authorization

    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); updateParams.push(name); }
    if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateParams.push(description); }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE resource_types SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating resource type:', queryText, updateParams);
    try {
        const result: QueryResult<ResourceType> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        console.log('[Success] Resource type updated:', result.rows[0]);
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`[Error] Failed to update resource type ${id}:`, err);
        next(err);
    }
};

export const deleteResourceType = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Validate ID format & authorization
    // TODO: Check if type is in use by resources (FK constraint: ON DELETE RESTRICT)

    try {
        const queryText = 'DELETE FROM resource_types WHERE id = $1 RETURNING id';
        console.log('[DB Query] Deleting resource type:', queryText, [id]);
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        console.log(`[Success] Resource type deleted: ${id}`);
        res.status(200).json({ success: true, message: 'Resource type deleted successfully' });
    } catch (err) {
        if ((err as any).code === '23503') { // FK violation
             return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete resource type because it is still in use by resources.'});
        }
        console.error(`[Error] Failed to delete resource type ${id}:`, err);
        next(err);
    }
};

// --- Resource Handlers ---

export const getAllResources = async (req: Request, res: Response, next: NextFunction) => {
    const { organizationId, locationId, resourceTypeId } = req.query;
    // TODO: Filter by user's org ID from token

    let queryText = 'SELECT r.*, rt.name as resource_type_name, l.name as location_name FROM resources r LEFT JOIN resource_types rt ON r.resource_type_id = rt.id LEFT JOIN locations l ON r.location_id = l.id';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;

    if (organizationId) { whereClauses.push(`r.organization_id = $${paramIndex++}`); queryParams.push(organizationId as string); }
    if (locationId) { whereClauses.push(`r.location_id = $${paramIndex++}`); queryParams.push(locationId as string); }
    if (resourceTypeId) { whereClauses.push(`r.resource_type_id = $${paramIndex++}`); queryParams.push(resourceTypeId as string); }
    whereClauses.push(`r.is_active = true`); // Default to only active resources

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ' ORDER BY r.name ASC';

    console.log('[DB Query] Fetching resources:', queryText, queryParams);
    try {
        const result: QueryResult<Resource> = await db.query(queryText, queryParams);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error('[Error] Failed to fetch resources:', err);
        next(err);
    }
};

export const getResourceById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Validate ID format & authorization

    try {
        const queryText = 'SELECT r.*, rt.name as resource_type_name, l.name as location_name FROM resources r LEFT JOIN resource_types rt ON r.resource_type_id = rt.id LEFT JOIN locations l ON r.location_id = l.id WHERE r.id = $1';
        console.log('[DB Query] Fetching resource by ID:', queryText, [id]);
        const result: QueryResult<Resource> = await db.query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`[Error] Failed to fetch resource ${id}:`, err);
        next(err);
    }
};

export const createResource = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Get organizationId from token
    const organizationId = 'placeholder-org-id';
    const { name, description, resourceTypeId, locationId, capacity, isActive = true } = req.body as Partial<Resource & { isActive?: boolean }>;

    if (!name || !resourceTypeId || !locationId) {
        return res.status(400).json({ error: true, message: 'Missing required fields: name, resourceTypeId, locationId' });
    }
    // TODO: Validate existence of resourceTypeId and locationId

    try {
        const queryText = `
            INSERT INTO resources (organization_id, name, description, resource_type_id, location_id, capacity, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const params = [organizationId, name, description || null, resourceTypeId, locationId, capacity || null, isActive];
        console.log('[DB Query] Creating resource:', queryText, params);
        const result: QueryResult<Resource> = await db.query(queryText, params);

        console.log('[Success] Resource created:', result.rows[0]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[Error] Failed to create resource:', err);
        next(err);
    }
};

export const updateResource = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, resourceTypeId, locationId, capacity, isActive } = req.body as Partial<Resource & { isActive?: boolean }>;
    // TODO: Validate ID format & authorization

    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); updateParams.push(name); }
    if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); updateParams.push(description); }
    if (resourceTypeId !== undefined) { updateFields.push(`resource_type_id = $${paramIndex++}`); updateParams.push(resourceTypeId); }
    if (locationId !== undefined) { updateFields.push(`location_id = $${paramIndex++}`); updateParams.push(locationId); }
    if (capacity !== undefined) { updateFields.push(`capacity = $${paramIndex++}`); updateParams.push(capacity); }
    if (isActive !== undefined) { updateFields.push(`is_active = $${paramIndex++}`); updateParams.push(isActive); }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE resources SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating resource:', queryText, updateParams);
    try {
        const result: QueryResult<Resource> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        console.log('[Success] Resource updated:', result.rows[0]);
        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`[Error] Failed to update resource ${id}:`, err);
        next(err);
    }
};

export const deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Validate ID format & authorization
    // TODO: Check if resource is in use by events (FK constraint: ON DELETE CASCADE set on event_resources)

    try {
        const queryText = 'DELETE FROM resources WHERE id = $1 RETURNING id';
        console.log('[DB Query] Deleting resource:', queryText, [id]);
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        console.log(`[Success] Resource deleted: ${id}`);
        res.status(200).json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
         if ((err as any).code === '23503') { // Should not happen if ON DELETE CASCADE is used correctly on event_resources
             console.error(`[Error] Attempted to delete resource ${id} which is still in use.`);
             return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete resource because it is still referenced (check FK constraints).'});
        }
        console.error(`[Error] Failed to delete resource ${id}:`, err);
        next(err);
    }
};

// Placeholder for getResourceAvailability - Implement later
export const getResourceAvailability = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { start, end } = req.query;
    // TODO: Implement conflict checking logic
    // Basic usage to satisfy linter for now:
    console.log(`Checking availability for resource ${id} between ${start} and ${end}`); 
    res.status(501).json({ message: `GET /resources/${id}/availability Not Implemented Yet`, query: req.query });
}; 