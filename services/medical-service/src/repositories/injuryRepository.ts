import db from '../db';
import { Injury } from '../types/medical';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

interface FindInjuriesFilters {
    organizationId: string; // Assume filtering by org is mandatory unless admin
    playerId?: string;
    teamId?: string;
    status?: string; // active, recovering, recovered, archived
    bodyPart?: string;
    injuryType?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const findAll = async (): Promise<Injury[]> => {
    const queryText = 'SELECT * FROM injuries ORDER BY date_occurred DESC';
    
    console.log('[DB Query] Finding all injuries:', queryText);
    try {
        const result: QueryResult<Injury> = await db.query(queryText, []);
        console.log(`[DB Success] Found ${result.rows.length} total injuries`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find all injuries:', error);
        throw new Error('Database error while fetching all injuries.');
    }
};

export const findInjuries = async (filters: FindInjuriesFilters, limit: number, offset: number): Promise<Injury[]> => {
    let queryText = 'SELECT * FROM injuries';
    const queryParams: any[] = [filters.organizationId]; // Start with orgId
    const whereClauses: string[] = ['organization_id = $1'];
    let paramIndex = 2;

    if (filters.playerId) { whereClauses.push(`player_id = $${paramIndex++}`); queryParams.push(filters.playerId); }
    if (filters.teamId) { whereClauses.push(`team_id = $${paramIndex++}`); queryParams.push(filters.teamId); }
    if (filters.status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.bodyPart) { whereClauses.push(`body_part ILIKE $${paramIndex++}`); queryParams.push(`%${filters.bodyPart}%`); }
    if (filters.injuryType) { whereClauses.push(`injury_type ILIKE $${paramIndex++}`); queryParams.push(`%${filters.injuryType}%`); }
    if (filters.dateFrom) { whereClauses.push(`date_occurred >= $${paramIndex++}`); queryParams.push(filters.dateFrom); }
    if (filters.dateTo) { whereClauses.push(`date_occurred <= $${paramIndex++}`); queryParams.push(filters.dateTo); }
    // TODO: Add authorization checks based on user role (e.g., coach sees own team, rehab sees assigned players)

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ` ORDER BY date_occurred DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding injuries:', queryText, queryParams);
    try {
        const result: QueryResult<Injury> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} injuries`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find injuries:', error);
        throw new Error('Database error while fetching injuries.');
    }
};

export const countInjuries = async (filters: FindInjuriesFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM injuries';
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['organization_id = $1'];
    let paramIndex = 2;

    // Apply same filters as findInjuries
    if (filters.playerId) { whereClauses.push(`player_id = $${paramIndex++}`); queryParams.push(filters.playerId); }
    if (filters.teamId) { whereClauses.push(`team_id = $${paramIndex++}`); queryParams.push(filters.teamId); }
    if (filters.status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.bodyPart) { whereClauses.push(`body_part ILIKE $${paramIndex++}`); queryParams.push(`%${filters.bodyPart}%`); }
    if (filters.injuryType) { whereClauses.push(`injury_type ILIKE $${paramIndex++}`); queryParams.push(`%${filters.injuryType}%`); }
    if (filters.dateFrom) { whereClauses.push(`date_occurred >= $${paramIndex++}`); queryParams.push(filters.dateFrom); }
    if (filters.dateTo) { whereClauses.push(`date_occurred <= $${paramIndex++}`); queryParams.push(filters.dateTo); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting injuries:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} injuries`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count injuries:', error);
        throw new Error('Database error while counting injuries.');
    }
};

export const findInjuryById = async (id: string, organizationId: string): Promise<Injury | null> => {
    // TODO: Add authorization logic based on user role
    const queryText = 'SELECT * FROM injuries WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];

    console.log('[DB Query] Finding injury by ID:', queryText, params);
    try {
        const result: QueryResult<Injury> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found injury ${id}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find injury ${id}:`, error);
        throw new Error('Database error while fetching injury by ID.');
    }
};

export const createInjury = async (data: Omit<Injury, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Injury['status'] }): Promise<Injury> => {
    const {
        playerId, teamId, organizationId, dateOccurred, dateReported, 
        bodyPart, injuryType, mechanism, severity, description, diagnosis, 
        estimatedReturnDate, reportedByUserId, status = 'active' // Default status
    } = data;

    const queryText = `
        INSERT INTO injuries (
            player_id, team_id, organization_id, date_occurred, date_reported, 
            body_part, injury_type, mechanism, severity, description, diagnosis, 
            estimated_return_date, reported_by_user_id, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
    `;
    const params = [
        playerId, teamId || null, organizationId, dateOccurred, dateReported || new Date(),
        bodyPart, injuryType, mechanism || null, severity || 'unknown', description || null, diagnosis || null,
        estimatedReturnDate || null, reportedByUserId || null, status
    ];

    console.log('[DB Query] Creating injury:', queryText, params);
    try {
        const result: QueryResult<Injury> = await db.query(queryText, params);
        console.log('[DB Success] Injury created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create injury:', error);
        throw new Error('Database error while creating injury.');
    }
};

export const updateInjury = async (id: string, organizationId: string, data: Partial<Omit<Injury, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'playerId' | 'reportedByUserId'> >): Promise<Injury | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            // Ensure read-only fields are not updated accidentally
            if (!['player_id', 'organization_id', 'reported_by_user_id'].includes(dbColumn)) {
                updateFields.push(`${dbColumn} = $${paramIndex++}`);
                updateParams.push(value);
            }
        }
    });

    if (updateFields.length === 0) {
        throw new Error("No valid fields provided for injury update.");
    }

    updateFields.push(`updated_at = NOW()`);
    // Check organizationId for authorization scope
    const queryText = `UPDATE injuries SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
    updateParams.push(id, organizationId);

    console.log('[DB Query] Updating injury:', queryText, updateParams);
    try {
        const result: QueryResult<Injury> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized
        }
        console.log('[DB Success] Injury updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update injury ${id}:`, error);
        throw new Error('Database error while updating injury.');
    }
};

export const deleteInjury = async (id: string, organizationId: string): Promise<boolean> => {
    // Use soft delete (e.g., set status to 'archived') or hard delete?
    // Hard delete shown here, ensure FKs (injury_updates, treatments etc.) handle this (ON DELETE CASCADE)
    // TODO: Check authorization
    const queryText = 'DELETE FROM injuries WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];

    console.log('[DB Query] Deleting injury:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Injury ${id} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete injury ${id}:`, error);
        // Handle FK constraint errors if cascades aren't set up
        throw new Error('Database error while deleting injury.');
    }
};

// TODO: Add functions for Injury Updates, Treatments etc. 