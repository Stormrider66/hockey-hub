import db from '../db';
import { DevelopmentPlan } from '../types/planning';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

interface FindDevelopmentPlansFilters {
    organizationId: string; // Required
    playerId?: string;
    teamId?: string; // Requires join or getting playerIds first
    seasonId?: string;
    status?: string; // draft, active, completed, archived
}

export const findDevelopmentPlans = async (filters: FindDevelopmentPlansFilters, limit: number, offset: number): Promise<DevelopmentPlan[]> => {
    let queryText = 'SELECT dp.* FROM development_plans dp'; // Alias dp needed if joining
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['dp.organization_id = $1'];
    let paramIndex = 2;

    // Handle teamId filter by joining users table (player -> team relationship)
    if (filters.teamId) {
        queryText += ' JOIN users u ON dp.player_id = u.id';
        whereClauses.push(`u.team_id = $${paramIndex++}`);
        queryParams.push(filters.teamId);
    }

    if (filters.playerId) { whereClauses.push(`dp.player_id = $${paramIndex++}`); queryParams.push(filters.playerId); }
    if (filters.seasonId) { whereClauses.push(`dp.season_id = $${paramIndex++}`); queryParams.push(filters.seasonId); }
    if (filters.status) { whereClauses.push(`dp.status = $${paramIndex++}`); queryParams.push(filters.status); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ` ORDER BY dp.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding development plans:', queryText, queryParams);
    try {
        const result: QueryResult<DevelopmentPlan> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} development plans`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find development plans:', error);
        throw new Error('Database error while fetching development plans.');
    }
};

export const countDevelopmentPlans = async (filters: FindDevelopmentPlansFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM development_plans dp'; // Alias dp needed if joining
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['dp.organization_id = $1'];
    let paramIndex = 2;

    // Handle teamId filter by joining users table (player -> team relationship)
    if (filters.teamId) {
        queryText += ' JOIN users u ON dp.player_id = u.id';
        whereClauses.push(`u.team_id = $${paramIndex++}`);
        queryParams.push(filters.teamId);
    }

    if (filters.playerId) { whereClauses.push(`dp.player_id = $${paramIndex++}`); queryParams.push(filters.playerId); }
    if (filters.seasonId) { whereClauses.push(`dp.season_id = $${paramIndex++}`); queryParams.push(filters.seasonId); }
    if (filters.status) { whereClauses.push(`dp.status = $${paramIndex++}`); queryParams.push(filters.status); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting development plans:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} development plans`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count development plans:', error);
        throw new Error('Database error while counting development plans.');
    }
};

export const findDevelopmentPlanById = async (id: string, organizationId?: string): Promise<DevelopmentPlan | null> => {
    let queryText = 'SELECT * FROM development_plans WHERE id = $1';
    const params: any[] = [id];
    let paramIndex = 2;
    if (organizationId) {
        queryText += ` AND organization_id = $${paramIndex++}`;
        params.push(organizationId);
    }
    console.log('[DB Query] Finding development plan by ID:', queryText, params);
    try {
        const result: QueryResult<DevelopmentPlan> = await db.query(queryText, params);
        // TODO: Fetch associated items (DevelopmentPlanItem) separately or join?
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error(`[DB Error] Failed to find development plan ${id}:`, error);
        throw new Error('Database error while fetching development plan by ID.');
    }
};

export const createDevelopmentPlan = async (data: Omit<DevelopmentPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DevelopmentPlan> => {
    const {
        playerId, seasonId, organizationId, title, status, 
        createdByUserId, reviewSchedule, overallComment
    } = data;

    const queryText = `
        INSERT INTO development_plans (
            player_id, season_id, organization_id, title, status, 
            created_by_user_id, review_schedule, overall_comment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const params = [
        playerId, seasonId, organizationId, title, status,
        createdByUserId, reviewSchedule || null, overallComment || null
    ];

    console.log('[DB Query] Creating development plan:', queryText, params);
    try {
        const result: QueryResult<DevelopmentPlan> = await db.query(queryText, params);
        console.log('[DB Success] Development plan created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create development plan:', error);
        throw new Error('Database error while creating development plan.');
    }
};

export const updateDevelopmentPlan = async (id: string, organizationId: string, data: Partial<Omit<DevelopmentPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'playerId' | 'seasonId' | 'createdByUserId'> >): Promise<DevelopmentPlan | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && !['playerId', 'seasonId', 'organizationId', 'createdByUserId'].includes(key)) {
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateFields.push(`${dbColumn} = $${paramIndex++}`);
            updateParams.push(value);
        }
    });

    if (updateFields.length === 0) throw new Error("No valid fields provided for development plan update.");

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE development_plans SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
    updateParams.push(id, organizationId);

    console.log('[DB Query] Updating development plan:', queryText, updateParams);
    try {
        const result: QueryResult<DevelopmentPlan> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) return null;
        console.log('[DB Success] Development plan updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update development plan ${id}:`, error);
        throw new Error('Database error while updating development plan.');
    }
};

export const deleteDevelopmentPlan = async (id: string, organizationId: string): Promise<boolean> => {
    // Hard delete - ensure child items (DevelopmentPlanItem) have ON DELETE CASCADE
    const queryText = 'DELETE FROM development_plans WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Deleting development plan:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Development plan ${id} deletion result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete development plan ${id}:`, error);
        throw new Error('Database error while deleting development plan.');
    }
};

// --- Development Plan Item Functions (Placeholder) ---
// TODO: Add functions for managing items within a plan 