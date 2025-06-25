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
exports.createInjuryUpdate = exports.findInjuryUpdatesByInjuryId = exports.deleteInjury = exports.updateInjury = exports.createInjury = exports.findInjuryById = exports.countInjuries = exports.findInjuries = exports.findAll = void 0;
const db_1 = __importDefault(require("../db"));
const findAll = () => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'SELECT * FROM injuries ORDER BY date_occurred DESC';
    console.log('[DB Query] Finding all injuries:', queryText);
    try {
        const result = yield db_1.default.query(queryText, []);
        console.log(`[DB Success] Found ${result.rows.length} total injuries`);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find all injuries:', error);
        throw new Error('Database error while fetching all injuries.');
    }
});
exports.findAll = findAll;
const findInjuries = (filters, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT * FROM injuries';
    const queryParams = [filters.organizationId]; // Start with orgId
    const whereClauses = ['organization_id = $1'];
    let paramIndex = 2;
    if (filters.playerId) {
        whereClauses.push(`player_id = $${paramIndex++}`);
        queryParams.push(filters.playerId);
    }
    if (filters.teamId) {
        whereClauses.push(`team_id = $${paramIndex++}`);
        queryParams.push(filters.teamId);
    }
    if (filters.status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }
    if (filters.bodyPart) {
        whereClauses.push(`body_part ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.bodyPart}%`);
    }
    if (filters.injuryType) {
        whereClauses.push(`injury_type ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.injuryType}%`);
    }
    if (filters.dateFrom) {
        whereClauses.push(`date_occurred >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClauses.push(`date_occurred <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
    }
    // TODO: Add authorization checks based on user role (e.g., coach sees own team, rehab sees assigned players)
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ` ORDER BY date_occurred DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);
    console.log('[DB Query] Finding injuries:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} injuries`);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find injuries:', error);
        throw new Error('Database error while fetching injuries.');
    }
});
exports.findInjuries = findInjuries;
const countInjuries = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT COUNT(*) FROM injuries';
    const queryParams = [filters.organizationId];
    const whereClauses = ['organization_id = $1'];
    let paramIndex = 2;
    // Apply same filters as findInjuries
    if (filters.playerId) {
        whereClauses.push(`player_id = $${paramIndex++}`);
        queryParams.push(filters.playerId);
    }
    if (filters.teamId) {
        whereClauses.push(`team_id = $${paramIndex++}`);
        queryParams.push(filters.teamId);
    }
    if (filters.status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }
    if (filters.bodyPart) {
        whereClauses.push(`body_part ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.bodyPart}%`);
    }
    if (filters.injuryType) {
        whereClauses.push(`injury_type ILIKE $${paramIndex++}`);
        queryParams.push(`%${filters.injuryType}%`);
    }
    if (filters.dateFrom) {
        whereClauses.push(`date_occurred >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClauses.push(`date_occurred <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    console.log('[DB Query] Counting injuries:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} injuries`);
        return count;
    }
    catch (error) {
        console.error('[DB Error] Failed to count injuries:', error);
        throw new Error('Database error while counting injuries.');
    }
});
exports.countInjuries = countInjuries;
const findInjuryById = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Add authorization logic based on user role
    const queryText = 'SELECT * FROM injuries WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Finding injury by ID:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found injury ${id}`);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to find injury ${id}:`, error);
        throw new Error('Database error while fetching injury by ID.');
    }
});
exports.findInjuryById = findInjuryById;
const createInjury = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId, teamId, organizationId, dateOccurred, dateReported, bodyPart, injuryType, mechanism, severity, description, diagnosis, estimatedReturnDate, reportedByUserId, status = 'active' // Default status
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
        const result = yield db_1.default.query(queryText, params);
        console.log('[DB Success] Injury created:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create injury:', error);
        throw new Error('Database error while creating injury.');
    }
});
exports.createInjury = createInjury;
const updateInjury = (id, organizationId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateFields = [];
    const updateParams = [];
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
        const result = yield db_1.default.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized
        }
        console.log('[DB Success] Injury updated:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to update injury ${id}:`, error);
        throw new Error('Database error while updating injury.');
    }
});
exports.updateInjury = updateInjury;
const deleteInjury = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Use soft delete (e.g., set status to 'archived') or hard delete?
    // Hard delete shown here, ensure FKs (injury_updates, treatments etc.) handle this (ON DELETE CASCADE)
    // TODO: Check authorization
    const queryText = 'DELETE FROM injuries WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Deleting injury:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Injury ${id} deletion attempt result: ${deleted}`);
        return deleted;
    }
    catch (error) {
        console.error(`[DB Error] Failed to delete injury ${id}:`, error);
        // Handle FK constraint errors if cascades aren't set up
        throw new Error('Database error while deleting injury.');
    }
});
exports.deleteInjury = deleteInjury;
// Injury Updates functions
const findInjuryUpdatesByInjuryId = (injuryId) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = `
        SELECT 
            iu.*,
            u.first_name || ' ' || u.last_name as created_by_name
        FROM injury_updates iu
        LEFT JOIN users u ON iu.created_by_user_id = u.id
        WHERE iu.injury_id = $1 
        ORDER BY iu.date DESC, iu.created_at DESC
    `;
    const params = [injuryId];
    console.log('[DB Query] Finding injury updates:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        console.log(`[DB Success] Found ${result.rows.length} injury updates`);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find injury updates:', error);
        throw new Error('Database error while fetching injury updates.');
    }
});
exports.findInjuryUpdatesByInjuryId = findInjuryUpdatesByInjuryId;
const createInjuryUpdate = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { injuryId, date, note, subjectiveAssessment, objectiveAssessment, createdByUserId } = data;
    const queryText = `
        INSERT INTO injury_updates (
            injury_id, date, note, subjective_assessment, objective_assessment, created_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const params = [injuryId, date, note, subjectiveAssessment || null, objectiveAssessment || null, createdByUserId];
    console.log('[DB Query] Creating injury update:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        console.log('[DB Success] Injury update created:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create injury update:', error);
        throw new Error('Database error while creating injury update.');
    }
});
exports.createInjuryUpdate = createInjuryUpdate;
