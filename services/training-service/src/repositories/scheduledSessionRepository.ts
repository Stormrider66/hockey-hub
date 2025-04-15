import db from '../db';
import { ScheduledPhysicalSession } from '../types/training';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

interface FindScheduledSessionsFilters {
    assignedToUserId?: string;
    assignedToTeamId?: string;
    status?: string; // scheduled, active, completed, canceled
    dateFrom?: string;
    dateTo?: string;
}

export const findScheduledSessions = async (filters: FindScheduledSessionsFilters, limit: number, offset: number): Promise<ScheduledPhysicalSession[]> => {
    let queryText = 'SELECT * FROM scheduled_physical_sessions';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    if (filters.assignedToUserId) { whereClauses.push(`assigned_to_user_id = $${paramIndex++}`); queryParams.push(filters.assignedToUserId); }
    if (filters.assignedToTeamId) { whereClauses.push(`assigned_to_team_id = $${paramIndex++}`); queryParams.push(filters.assignedToTeamId); }
    if (filters.status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.dateFrom) { whereClauses.push(`scheduled_date >= $${paramIndex++}`); queryParams.push(filters.dateFrom); }
    if (filters.dateTo) { whereClauses.push(`scheduled_date <= $${paramIndex++}`); queryParams.push(filters.dateTo); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ` ORDER BY scheduled_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding scheduled sessions:', queryText, queryParams);
    try {
        const result: QueryResult<ScheduledPhysicalSession> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} scheduled sessions`);
        // Ensure JSONB fields are parsed/handled correctly (pg library usually does this)
        return result.rows.map(row => ({ ...row, resolvedSections: row.resolvedSections || [], completionData: row.completionData || null }));
    } catch (error) {
        console.error('[DB Error] Failed to find scheduled sessions:', error);
        throw new Error('Database error while fetching scheduled sessions.');
    }
};

export const countScheduledSessions = async (filters: FindScheduledSessionsFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM scheduled_physical_sessions';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    // Apply same filters as findScheduledSessions
    if (filters.assignedToUserId) { whereClauses.push(`assigned_to_user_id = $${paramIndex++}`); queryParams.push(filters.assignedToUserId); }
    if (filters.assignedToTeamId) { whereClauses.push(`assigned_to_team_id = $${paramIndex++}`); queryParams.push(filters.assignedToTeamId); }
    if (filters.status) { whereClauses.push(`status = $${paramIndex++}`); queryParams.push(filters.status); }
    if (filters.dateFrom) { whereClauses.push(`scheduled_date >= $${paramIndex++}`); queryParams.push(filters.dateFrom); }
    if (filters.dateTo) { whereClauses.push(`scheduled_date <= $${paramIndex++}`); queryParams.push(filters.dateTo); }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting scheduled sessions:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} scheduled sessions`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count scheduled sessions:', error);
        throw new Error('Database error while counting scheduled sessions.');
    }
};

export const findScheduledSessionById = async (id: string): Promise<ScheduledPhysicalSession | null> => {
    const queryText = 'SELECT * FROM scheduled_physical_sessions WHERE id = $1';
    const params = [id];

    console.log('[DB Query] Finding scheduled session by ID:', queryText, params);
    try {
        const result: QueryResult<ScheduledPhysicalSession> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        const session = result.rows[0];
        session.resolvedSections = session.resolvedSections || [];
        session.completionData = session.completionData || null;
        console.log(`[DB Success] Found scheduled session ${id}`);
        return session;
    } catch (error) {
        console.error(`[DB Error] Failed to find scheduled session ${id}:`, error);
        throw new Error('Database error while fetching scheduled session by ID.');
    }
};

export const createScheduledSession = async (data: Omit<ScheduledPhysicalSession, 'id' | 'status' | 'completionData' | 'createdAt' | 'updatedAt'>): Promise<ScheduledPhysicalSession> => {
    const {
        templateId,
        assignedToUserId,
        assignedToTeamId,
        scheduledDate,
        calendarEventId,
        resolvedSections // Pre-resolved sections passed in
    } = data;

    if (!assignedToUserId && !assignedToTeamId) {
        throw new Error('Must assign session to either a user or a team.');
    }
    if (!resolvedSections) {
        // Need logic here or in service layer to fetch template and resolve sections
        throw new Error('Resolved sections must be provided for scheduled session creation.');
    }

    const queryText = `
        INSERT INTO scheduled_physical_sessions 
            (template_id, assigned_to_user_id, assigned_to_team_id, scheduled_date, calendar_event_id, status, resolved_sections)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const params = [
        templateId || null,
        assignedToUserId || null,
        assignedToTeamId || null,
        scheduledDate,
        calendarEventId || null,
        'scheduled', // Default status
        JSON.stringify(resolvedSections)
    ];

    console.log('[DB Query] Creating scheduled session:', queryText, params);
    try {
        const result: QueryResult<ScheduledPhysicalSession> = await db.query(queryText, params);
        const newSession = result.rows[0];
        newSession.resolvedSections = newSession.resolvedSections || [];
        newSession.completionData = newSession.completionData || null;
        console.log('[DB Success] Scheduled session created:', newSession);
        return newSession;
    } catch (error) {
        console.error('[DB Error] Failed to create scheduled session:', error);
        throw new Error('Database error while creating scheduled session.');
    }
};

// Update usually involves status changes or adding completion data
export const updateScheduledSession = async (id: string, data: Partial<Pick<ScheduledPhysicalSession, 'status' | 'completionData' | 'scheduledDate'>>): Promise<ScheduledPhysicalSession | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) { updateFields.push(`status = $${paramIndex++}`); updateParams.push(data.status); }
    if (data.scheduledDate !== undefined) { updateFields.push(`scheduled_date = $${paramIndex++}`); updateParams.push(data.scheduledDate); }
    // Ensure completionData is stringified JSON if present
    if (data.completionData !== undefined) { 
        updateFields.push(`completion_data = $${paramIndex++}`); 
        updateParams.push(JSON.stringify(data.completionData)); 
    }
    
    if (updateFields.length === 0) {
        throw new Error("No fields provided for update.");
    }

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE scheduled_physical_sessions SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating scheduled session:', queryText, updateParams);
    try {
        const result: QueryResult<ScheduledPhysicalSession> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found
        }
        const updatedSession = result.rows[0];
        updatedSession.resolvedSections = updatedSession.resolvedSections || [];
        updatedSession.completionData = updatedSession.completionData || null;
        console.log('[DB Success] Scheduled session updated:', updatedSession);
        return updatedSession;
    } catch (error) {
        console.error(`[DB Error] Failed to update scheduled session ${id}:`, error);
        throw new Error('Database error while updating scheduled session.');
    }
};

export const deleteScheduledSession = async (id: string): Promise<boolean> => {
    const queryText = 'DELETE FROM scheduled_physical_sessions WHERE id = $1';
    const params = [id];

    console.log('[DB Query] Deleting scheduled session:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Scheduled session ${id} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete scheduled session ${id}:`, error);
        throw new Error('Database error while deleting scheduled session.');
    }
}; 