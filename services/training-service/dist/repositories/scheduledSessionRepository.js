"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScheduledSession = exports.updateScheduledSession = exports.createScheduledSession = exports.findScheduledSessionById = exports.countScheduledSessions = exports.findScheduledSessions = void 0;
const db_1 = __importDefault(require("../db"));
const findScheduledSessions = (filters, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT * FROM scheduled_physical_sessions';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    if (filters.assignedToUserId) {
        whereClauses.push(`assigned_to_user_id = $${paramIndex++}`);
        queryParams.push(filters.assignedToUserId);
    }
    if (filters.assignedToTeamId) {
        whereClauses.push(`assigned_to_team_id = $${paramIndex++}`);
        queryParams.push(filters.assignedToTeamId);
    }
    if (filters.status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }
    if (filters.dateFrom) {
        whereClauses.push(`scheduled_date >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClauses.push(`scheduled_date <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ` ORDER BY scheduled_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);
    console.log('[DB Query] Finding scheduled sessions:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} scheduled sessions`);
        // Ensure JSONB fields are parsed/handled correctly (pg library usually does this)
        return result.rows.map(row => (Object.assign(Object.assign({}, row), { resolvedSections: row.resolvedSections || [], completionData: row.completionData || null })));
    }
    catch (error) {
        console.error('[DB Error] Failed to find scheduled sessions:', error);
        throw new Error('Database error while fetching scheduled sessions.');
    }
});
exports.findScheduledSessions = findScheduledSessions;
const countScheduledSessions = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT COUNT(*) FROM scheduled_physical_sessions';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    // Apply same filters as findScheduledSessions
    if (filters.assignedToUserId) {
        whereClauses.push(`assigned_to_user_id = $${paramIndex++}`);
        queryParams.push(filters.assignedToUserId);
    }
    if (filters.assignedToTeamId) {
        whereClauses.push(`assigned_to_team_id = $${paramIndex++}`);
        queryParams.push(filters.assignedToTeamId);
    }
    if (filters.status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }
    if (filters.dateFrom) {
        whereClauses.push(`scheduled_date >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClauses.push(`scheduled_date <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    console.log('[DB Query] Counting scheduled sessions:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} scheduled sessions`);
        return count;
    }
    catch (error) {
        console.error('[DB Error] Failed to count scheduled sessions:', error);
        throw new Error('Database error while counting scheduled sessions.');
    }
});
exports.countScheduledSessions = countScheduledSessions;
const findScheduledSessionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'SELECT * FROM scheduled_physical_sessions WHERE id = $1';
    const params = [id];
    console.log('[DB Query] Finding scheduled session by ID:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        const session = result.rows[0];
        session.resolvedSections = session.resolvedSections || [];
        session.completionData = session.completionData || null;
        console.log(`[DB Success] Found scheduled session ${id}`);
        return session;
    }
    catch (error) {
        console.error(`[DB Error] Failed to find scheduled session ${id}:`, error);
        throw new Error('Database error while fetching scheduled session by ID.');
    }
});
exports.findScheduledSessionById = findScheduledSessionById;
const createScheduledSession = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { templateId, assignedToUserId, assignedToTeamId, scheduledDate, calendarEventId, resolvedSections // Pre-resolved sections passed in
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
        const result = yield db_1.default.query(queryText, params);
        const newSession = result.rows[0];
        newSession.resolvedSections = newSession.resolvedSections || [];
        newSession.completionData = newSession.completionData || null;
        console.log('[DB Success] Scheduled session created:', newSession);
        return newSession;
    }
    catch (error) {
        console.error('[DB Error] Failed to create scheduled session:', error);
        throw new Error('Database error while creating scheduled session.');
    }
});
exports.createScheduledSession = createScheduledSession;
// Update usually involves status changes or adding completion data
const updateScheduledSession = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;
    if (data.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        updateParams.push(data.status);
    }
    if (data.scheduledDate !== undefined) {
        updateFields.push(`scheduled_date = $${paramIndex++}`);
        updateParams.push(data.scheduledDate);
    }
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
        const result = yield db_1.default.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found
        }
        const updatedSession = result.rows[0];
        updatedSession.resolvedSections = updatedSession.resolvedSections || [];
        updatedSession.completionData = updatedSession.completionData || null;
        console.log('[DB Success] Scheduled session updated:', updatedSession);
        return updatedSession;
    }
    catch (error) {
        console.error(`[DB Error] Failed to update scheduled session ${id}:`, error);
        throw new Error('Database error while updating scheduled session.');
    }
});
exports.updateScheduledSession = updateScheduledSession;
const deleteScheduledSession = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'DELETE FROM scheduled_physical_sessions WHERE id = $1';
    const params = [id];
    console.log('[DB Query] Deleting scheduled session:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Scheduled session ${id} deletion attempt result: ${deleted}`);
        return deleted;
    }
    catch (error) {
        console.error(`[DB Error] Failed to delete scheduled session ${id}:`, error);
        throw new Error('Database error while deleting scheduled session.');
    }
});
exports.deleteScheduledSession = deleteScheduledSession;
