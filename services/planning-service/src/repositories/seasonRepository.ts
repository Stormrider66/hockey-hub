import db from '../db';
import { Season, SeasonPhase } from '../types/planning';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

interface FindSeasonsFilters {
    organizationId: string; // Required
    status?: string; // planning, active, completed, archived
}

export const findSeasons = async (filters: FindSeasonsFilters, limit: number, offset: number): Promise<Season[]> => {
    let queryText = 'SELECT * FROM seasons';
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['organization_id = $1'];
    let paramIndex = 2;

    if (filters.status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }
    // TODO: Add authorization checks? Maybe only show active/completed unless admin/coach?

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Order by start date, newest first
    queryText += ` ORDER BY start_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding seasons:', queryText, queryParams);
    try {
        const result: QueryResult<Season> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} seasons for org ${filters.organizationId}`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find seasons:', error);
        throw new Error('Database error while fetching seasons.');
    }
};

export const countSeasons = async (filters: FindSeasonsFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM seasons';
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['organization_id = $1'];
    let paramIndex = 2;

    if (filters.status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting seasons:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} seasons for org ${filters.organizationId}`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count seasons:', error);
        throw new Error('Database error while counting seasons.');
    }
};

export const findSeasonById = async (id: string, organizationId?: string): Promise<Season | null> => {
    // Ensure the season belongs to the requesting organization if provided
    let queryText = 'SELECT * FROM seasons WHERE id = $1';
    const params: any[] = [id];
    let paramIndex = 2;

    if (organizationId) {
        queryText += ` AND organization_id = $${paramIndex++}`;
        params.push(organizationId);
    }

    console.log('[DB Query] Finding season by ID:', queryText, params);
    try {
        const result: QueryResult<Season> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found season ${id}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find season ${id}:`, error);
        throw new Error('Database error while fetching season by ID.');
    }
};

export const createSeason = async (data: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>): Promise<Season> => {
    const { organizationId, name, startDate, endDate, status } = data;

    const queryText = `
        INSERT INTO seasons (organization_id, name, start_date, end_date, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const params = [organizationId, name, startDate, endDate, status];

    console.log('[DB Query] Creating season:', queryText, params);
    try {
        const result: QueryResult<Season> = await db.query(queryText, params);
        console.log('[DB Success] Season created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create season:', error);
        // Handle potential unique constraint violations if needed
        throw new Error('Database error while creating season.');
    }
};

export const updateSeason = async (id: string, organizationId: string, data: Partial<Omit<Season, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'> >): Promise<Season | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'organizationId') { // Exclude organizationId
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateFields.push(`${dbColumn} = $${paramIndex++}`);
            updateParams.push(value);
        }
    });

    if (updateFields.length === 0) {
        throw new Error("No valid fields provided for season update.");
    }

    updateFields.push(`updated_at = NOW()`);
    // Check organizationId for authorization scope
    const queryText = `UPDATE seasons SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
    updateParams.push(id, organizationId);

    console.log('[DB Query] Updating season:', queryText, updateParams);
    try {
        const result: QueryResult<Season> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized
        }
        console.log('[DB Success] Season updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update season ${id}:`, error);
        throw new Error('Database error while updating season.');
    }
};

export const deleteSeason = async (id: string, organizationId: string): Promise<boolean> => {
    // TODO: Consider implications of deleting a season (ON DELETE constraints for phases, goals etc.)
    // Maybe soft delete (set status to archived) is safer?
    // Hard delete shown here:
    const queryText = 'DELETE FROM seasons WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];

    console.log('[DB Query] Deleting season:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Season ${id} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete season ${id}:`, error);
        // Handle FK constraints if phases/goals reference this season
        throw new Error('Database error while deleting season.');
    }
};

// --- Season Phase Functions ---

/**
 * Finds all phases for a specific season, ordered by start date or a defined order field.
 */
export const findPhasesBySeasonId = async (seasonId: string, organizationId: string): Promise<SeasonPhase[]> => {
    // Ensure the season belongs to the organization for authorization
    const queryText = 'SELECT * FROM season_phases WHERE season_id = $1 AND organization_id = $2 ORDER BY start_date ASC';
    const params = [seasonId, organizationId];

    console.log('[DB Query] Finding phases for season:', queryText, params);
    try {
        const result: QueryResult<SeasonPhase> = await db.query(queryText, params);
        console.log(`[DB Success] Found ${result.rows.length} phases for season ${seasonId}`);
        return result.rows;
    } catch (error) {
        console.error(`[DB Error] Failed to find phases for season ${seasonId}:`, error);
        throw new Error('Database error while fetching season phases.');
    }
};

/**
 * Finds a specific phase by its ID.
 */
export const findPhaseById = async (phaseId: string, organizationId: string): Promise<SeasonPhase | null> => {
     // Join with seasons table to ensure the phase belongs to the correct organization
     const queryText = `
        SELECT p.* 
        FROM season_phases p
        JOIN seasons s ON p.season_id = s.id
        WHERE p.id = $1 AND s.organization_id = $2
    `;
    const params = [phaseId, organizationId];

    console.log('[DB Query] Finding phase by ID:', queryText, params);
    try {
        const result: QueryResult<SeasonPhase> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found phase ${phaseId}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find phase ${phaseId}:`, error);
        throw new Error('Database error while fetching phase by ID.');
    }

};

/**
 * Creates a new phase for a season.
 */
export const createPhase = async (data: Omit<SeasonPhase, 'id' | 'createdAt' | 'updatedAt'>): Promise<SeasonPhase> => {
    const { 
        seasonId, name, type, startDate, endDate, 
        focusPrimary, focusSecondary, description, order 
    } = data;

    const queryText = `
        INSERT INTO season_phases (season_id, name, type, start_date, end_date, focus_primary, focus_secondary, description, "order")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const params = [
        seasonId, name, type || null, startDate, endDate, 
        focusPrimary || null, focusSecondary || null, description || null, order || null
    ];

    console.log('[DB Query] Creating season phase:', queryText, params);
    try {
        // TODO: Consider adding a check here or in DB constraints to ensure phase dates are within season dates
        // TODO: Add check to ensure phase dates do not overlap with existing phases for the season
        const result: QueryResult<SeasonPhase> = await db.query(queryText, params);
        console.log('[DB Success] Phase created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create phase:', error);
        throw new Error('Database error while creating season phase.');
    }
};

/**
 * Updates an existing season phase.
 */
export const updatePhase = async (phaseId: string, data: Partial<Omit<SeasonPhase, 'id' | 'createdAt' | 'updatedAt' | 'seasonId'> >): Promise<SeasonPhase | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'seasonId') { 
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            // Handle reserved keyword "order"
            const finalDbColumn = dbColumn === 'order' ? '"order"' : dbColumn;
            updateFields.push(`${finalDbColumn} = $${paramIndex++}`);
            updateParams.push(value);
        }
    });

    if (updateFields.length === 0) {
        throw new Error("No valid fields provided for phase update.");
    }

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE season_phases SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(phaseId);

    console.log('[DB Query] Updating season phase:', queryText, updateParams);
    try {
        // TODO: Add authorization check (user can update phases in this season/org)
        // TODO: Add validation for date overlaps / within season bounds if dates are updated
        const result: QueryResult<SeasonPhase> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found
        }
        console.log('[DB Success] Phase updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update phase ${phaseId}:`, error);
        throw new Error('Database error while updating season phase.');
    }
};

/**
 * Deletes a season phase.
 */
export const deletePhase = async (phaseId: string): Promise<boolean> => {
     // TODO: Add authorization check 
    const queryText = 'DELETE FROM season_phases WHERE id = $1';
    const params = [phaseId];

    console.log('[DB Query] Deleting season phase:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Phase ${phaseId} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete phase ${phaseId}:`, error);
        throw new Error('Database error while deleting season phase.');
    }
};

// TODO: Add functions for Season Goals etc. 