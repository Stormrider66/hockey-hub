import db from '../db';
import { TeamGoal, PlayerGoal } from '../types/planning';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

// --- Team Goal Functions ---

interface FindTeamGoalsFilters {
    organizationId: string; // Required
    teamId?: string;
    seasonId?: string;
    status?: string;
    category?: string;
}

export const findTeamGoals = async (filters: FindTeamGoalsFilters, limit: number, offset: number): Promise<TeamGoal[]> => {
    let queryText = 'SELECT * FROM team_goals';
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['organization_id = $1'];
    let paramIndex = 2;

    if (filters.teamId) { whereClauses.push(`team_id = $${paramIndex++}`); queryParams.push(filters.teamId); }
    if (filters.seasonId) { whereClauses.push(`season_id = $${paramIndex++}`); queryParams.push(filters.seasonId); }
    if (filters.status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.category) { whereClauses.push(`category = $${paramIndex++}`); queryParams.push(filters.category); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding team goals:', queryText, queryParams);
    try {
        const result: QueryResult<TeamGoal> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} team goals`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find team goals:', error);
        throw new Error('Database error while fetching team goals.');
    }
};

export const countTeamGoals = async (filters: FindTeamGoalsFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM team_goals';
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['organization_id = $1'];
    let paramIndex = 2;

    if (filters.teamId) { whereClauses.push(`team_id = $${paramIndex++}`); queryParams.push(filters.teamId); }
    if (filters.seasonId) { whereClauses.push(`season_id = $${paramIndex++}`); queryParams.push(filters.seasonId); }
    if (filters.status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.category) { whereClauses.push(`category = $${paramIndex++}`); queryParams.push(filters.category); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting team goals:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} team goals`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count team goals:', error);
        throw new Error('Database error while counting team goals.');
    }
};

export const findTeamGoalById = async (id: string, organizationId?: string): Promise<TeamGoal | null> => {
    let queryText = 'SELECT * FROM team_goals WHERE id = $1';
    const params: any[] = [id];
    let paramIndex = 2;
    if (organizationId) {
        queryText += ` AND organization_id = $${paramIndex++}`;
        params.push(organizationId);
    }
    console.log('[DB Query] Finding team goal by ID:', queryText, params);
    try {
        const result: QueryResult<TeamGoal> = await db.query(queryText, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error(`[DB Error] Failed to find team goal ${id}:`, error);
        throw new Error('Database error while fetching team goal by ID.');
    }
};

export const createTeamGoal = async (data: Omit<TeamGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamGoal> => {
    const {
        organizationId, seasonId, teamId, description, category, measure, 
        targetValue, priority, status, dueDate, createdByUserId
    } = data;

    const queryText = `
        INSERT INTO team_goals (
            organization_id, season_id, team_id, description, category, measure, 
            target_value, priority, status, due_date, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `;
    const params = [
        organizationId, seasonId || null, teamId, description, category || null, measure || null,
        targetValue !== undefined ? String(targetValue) : null, // Ensure targetValue is string or null
        priority || null, status, dueDate || null, createdByUserId
    ];

    console.log('[DB Query] Creating team goal:', queryText, params);
    try {
        const result: QueryResult<TeamGoal> = await db.query(queryText, params);
        console.log('[DB Success] Team goal created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create team goal:', error);
        throw new Error('Database error while creating team goal.');
    }
};

export const updateTeamGoal = async (id: string, organizationId: string, data: Partial<Omit<TeamGoal, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'teamId' | 'createdByUserId'> >): Promise<TeamGoal | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && !['teamId', 'organizationId', 'createdByUserId'].includes(key)) {
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateFields.push(`${dbColumn} = $${paramIndex++}`);
            updateParams.push(key === 'targetValue' ? String(value) : value);
        }
    });

    if (updateFields.length === 0) throw new Error("No valid fields provided for team goal update.");

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE team_goals SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
    updateParams.push(id, organizationId);

    console.log('[DB Query] Updating team goal:', queryText, updateParams);
    try {
        const result: QueryResult<TeamGoal> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) return null;
        console.log('[DB Success] Team goal updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update team goal ${id}:`, error);
        throw new Error('Database error while updating team goal.');
    }
};

export const deleteTeamGoal = async (id: string, organizationId: string): Promise<boolean> => {
    const queryText = 'DELETE FROM team_goals WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Deleting team goal:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Team goal ${id} deletion result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete team goal ${id}:`, error);
        throw new Error('Database error while deleting team goal.');
    }
};

// --- Player Goal Functions ---

interface FindPlayerGoalsFilters {
    organizationId: string; // Required
    playerId?: string;
    teamId?: string;       
    seasonId?: string;
    status?: string;
    category?: string;
    playerIds?: string[];      // For parent scope 
    accessibleTeamIds?: string[]; // For coach scope
}

export const findPlayerGoals = async (filters: FindPlayerGoalsFilters, limit: number, offset: number): Promise<{ goals: PlayerGoal[], total: number }> => {
    let selectClause = 'SELECT pg.* ';
    // Include user info if needed for filtering or display?
    // selectClause += ', u.first_name as player_first_name, u.last_name as player_last_name, u.team_id as player_team_id ';
    let fromClause = 'FROM player_goals pg';
    const queryParams: any[] = [filters.organizationId];
    const whereClauses: string[] = ['pg.organization_id = $1'];
    let paramIndex = 2;
    
    // Join with users table if filtering by team(s)
    if (filters.teamId || filters.accessibleTeamIds) {
        // WARNING: Assumes access to a 'users' table/view with team_id in this service's DB.
        console.warn('[findPlayerGoals] Filtering by teamId or accessibleTeamIds assumes user/team data is accessible/replicated.');
        fromClause += ' JOIN users u ON pg.player_id = u.id'; 
    }

    if (filters.playerId) { 
        whereClauses.push(`pg.player_id = $${paramIndex++}`); 
        queryParams.push(filters.playerId); 
    } else if (filters.playerIds && filters.playerIds.length > 0) { 
        whereClauses.push(`pg.player_id = ANY($${paramIndex++}::uuid[])`); 
        queryParams.push(filters.playerIds);
    }

    // IMPORTANT: Ensure teamId and accessibleTeamIds are mutually exclusive in controller
    if (filters.teamId) { 
        // Assumes users table has team_id column
        whereClauses.push(`u.team_id = $${paramIndex++}`); 
        queryParams.push(filters.teamId); 
    } else if (filters.accessibleTeamIds && filters.accessibleTeamIds.length > 0) {
        // Assumes users table has team_id column
        whereClauses.push(`u.team_id = ANY($${paramIndex++}::uuid[])`);
        queryParams.push(filters.accessibleTeamIds);
    }
    
    if (filters.seasonId) { whereClauses.push(`pg.season_id = $${paramIndex++}`); queryParams.push(filters.seasonId); }
    if (filters.status) { whereClauses.push(`pg.status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.category) { whereClauses.push(`pg.category = $${paramIndex++}`); queryParams.push(filters.category); }

    // --- Count Query --- 
    let countQueryText = `SELECT COUNT(pg.id) ${fromClause}`;
    if (whereClauses.length > 0) {
        countQueryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    console.log('[DB Query] Counting player goals:', countQueryText, queryParams);
    let total = 0;
    try {
        const countResult = await db.query(countQueryText, queryParams);
        total = parseInt(countResult.rows[0].count, 10);
        console.log(`[DB Success] Counted ${total} player goals`);
    } catch (error) {
        console.error('[DB Error] Failed to count player goals:', error);
        throw new Error('Database error while counting player goals.');
    }

    // --- Data Query --- 
    let queryText = `${selectClause} ${fromClause}`;
     if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ` ORDER BY pg.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    // Add limit and offset params AFTER potential filter params
    const dataQueryParams = [...queryParams, limit, offset]; 

    console.log('[DB Query] Finding player goals:', queryText, dataQueryParams);
    try {
        const result: QueryResult<PlayerGoal> = await db.query(queryText, dataQueryParams);
        console.log(`[DB Success] Found ${result.rows.length} player goals for page`);
        return { goals: result.rows, total };
    } catch (error) {
        console.error('[DB Error] Failed to find player goals:', error);
        throw new Error('Database error while fetching player goals.');
    }
};

export const findPlayerGoalById = async (id: string, organizationId?: string): Promise<PlayerGoal | null> => {
    let queryText = 'SELECT * FROM player_goals WHERE id = $1';
    const params: any[] = [id];
    let paramIndex = 2;
    if (organizationId) {
        queryText += ` AND organization_id = $${paramIndex++}`;
        params.push(organizationId);
    }
    console.log('[DB Query] Finding player goal by ID:', queryText, params);
    try {
        const result: QueryResult<PlayerGoal> = await db.query(queryText, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error(`[DB Error] Failed to find player goal ${id}:`, error);
        throw new Error('Database error while fetching player goal by ID.');
    }
};

export const createPlayerGoal = async (data: Omit<PlayerGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlayerGoal> => {
     const {
        organizationId, seasonId, playerId, description, category, measure, 
        targetValue, priority, status, dueDate, createdByUserId
    } = data;

    const queryText = `
        INSERT INTO player_goals (
            organization_id, season_id, player_id, description, category, measure, 
            target_value, priority, status, due_date, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `;
    const params = [
        organizationId, seasonId || null, playerId, description, category || null, measure || null,
        targetValue !== undefined ? String(targetValue) : null,
        priority || null, status, dueDate || null, createdByUserId
    ];

    console.log('[DB Query] Creating player goal:', queryText, params);
    try {
        const result: QueryResult<PlayerGoal> = await db.query(queryText, params);
        console.log('[DB Success] Player goal created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create player goal:', error);
        throw new Error('Database error while creating player goal.');
    }
};

export const updatePlayerGoal = async (id: string, organizationId: string, data: Partial<Omit<PlayerGoal, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'playerId' | 'createdByUserId'> >): Promise<PlayerGoal | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
         if (value !== undefined && !['playerId', 'organizationId', 'createdByUserId'].includes(key)) {
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateFields.push(`${dbColumn} = $${paramIndex++}`);
            updateParams.push(key === 'targetValue' ? String(value) : value);
        }
    });

    if (updateFields.length === 0) throw new Error("No valid fields provided for player goal update.");

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE player_goals SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
    updateParams.push(id, organizationId);

    console.log('[DB Query] Updating player goal:', queryText, updateParams);
    try {
        const result: QueryResult<PlayerGoal> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) return null;
        console.log('[DB Success] Player goal updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update player goal ${id}:`, error);
        throw new Error('Database error while updating player goal.');
    }
};

export const deletePlayerGoal = async (id: string, organizationId: string): Promise<boolean> => {
    const queryText = 'DELETE FROM player_goals WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Deleting player goal:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Player goal ${id} deletion result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete player goal ${id}:`, error);
        throw new Error('Database error while deleting player goal.');
    }
}; 