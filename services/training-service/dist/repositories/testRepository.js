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
exports.deleteTestResult = exports.updateTestResult = exports.createTestResult = exports.findTestResultById = exports.countTestResults = exports.findTestResults = exports.deleteTestDefinition = exports.updateTestDefinition = exports.createTestDefinition = exports.findTestDefinitionById = exports.countTestDefinitions = exports.findTestDefinitions = void 0;
const db_1 = __importDefault(require("../db"));
const findTestDefinitions = (filters, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT * FROM test_definitions';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    // Filter by public or organization-specific
    if (filters.organizationId) {
        whereClauses.push(`(is_public = true OR organization_id = $${paramIndex++})`);
        queryParams.push(filters.organizationId);
    }
    else {
        whereClauses.push(`is_public = true`);
    }
    if (filters.category) {
        whereClauses.push(`category = $${paramIndex++}`);
        queryParams.push(filters.category);
    }
    if (filters.isPublic !== undefined) {
        whereClauses.push(`is_public = $${paramIndex++}`);
        queryParams.push(filters.isPublic);
    }
    if (filters.searchTerm) {
        whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ` ORDER BY category ASC, name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);
    console.log('[DB Query] Finding test definitions:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} test definitions`);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find test definitions:', error);
        throw new Error('Database error while fetching test definitions.');
    }
});
exports.findTestDefinitions = findTestDefinitions;
const countTestDefinitions = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT COUNT(*) FROM test_definitions';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    // Apply same filters as findTestDefinitions
    if (filters.organizationId) {
        whereClauses.push(`(is_public = true OR organization_id = $${paramIndex++})`);
        queryParams.push(filters.organizationId);
    }
    else {
        whereClauses.push(`is_public = true`);
    }
    if (filters.category) {
        whereClauses.push(`category = $${paramIndex++}`);
        queryParams.push(filters.category);
    }
    if (filters.isPublic !== undefined) {
        whereClauses.push(`is_public = $${paramIndex++}`);
        queryParams.push(filters.isPublic);
    }
    if (filters.searchTerm) {
        whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    console.log('[DB Query] Counting test definitions:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} test definitions`);
        return count;
    }
    catch (error) {
        console.error('[DB Error] Failed to count test definitions:', error);
        throw new Error('Database error while counting test definitions.');
    }
});
exports.countTestDefinitions = countTestDefinitions;
const findTestDefinitionById = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT * FROM test_definitions WHERE id = $1';
    const queryParams = [id];
    let paramIndex = 2;
    if (organizationId) {
        queryText += ` AND (is_public = true OR organization_id = $${paramIndex++})`;
        queryParams.push(organizationId);
    }
    else {
        queryText += ` AND is_public = true`;
    }
    console.log('[DB Query] Finding test definition by ID:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        if (result.rows.length === 0)
            return null;
        console.log(`[DB Success] Found test definition ${id}`);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to find test definition ${id}:`, error);
        throw new Error('Database error while fetching test definition by ID.');
    }
});
exports.findTestDefinitionById = findTestDefinitionById;
const createTestDefinition = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, category, description, protocol, unit, scoreDirection, organizationId, isPublic = false, createdByUserId } = data;
    const queryText = `
        INSERT INTO test_definitions (name, category, description, protocol, unit, score_direction, organization_id, is_public, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const params = [
        name, category, description || null, protocol || null, unit, scoreDirection,
        organizationId || null, isPublic, createdByUserId || null
    ];
    console.log('[DB Query] Creating test definition:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        console.log('[DB Success] Test definition created:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create test definition:', error);
        throw new Error('Database error while creating test definition.');
    }
});
exports.createTestDefinition = createTestDefinition;
const updateTestDefinition = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateFields.push(`${dbColumn} = $${paramIndex++}`);
            updateParams.push(value);
        }
    });
    if (updateFields.length === 0)
        throw new Error("No fields provided for update.");
    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE test_definitions SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);
    console.log('[DB Query] Updating test definition:', queryText, updateParams);
    try {
        // TODO: Add check for organizationId/isPublic for authorization before update
        const result = yield db_1.default.query(queryText, updateParams);
        if (result.rows.length === 0)
            return null;
        console.log('[DB Success] Test definition updated:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to update test definition ${id}:`, error);
        throw new Error('Database error while updating test definition.');
    }
});
exports.updateTestDefinition = updateTestDefinition;
const deleteTestDefinition = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Add check for organizationId/isPublic for authorization before delete
    const queryText = 'DELETE FROM test_definitions WHERE id = $1';
    console.log('[DB Query] Deleting test definition:', queryText, [id]);
    try {
        const result = yield db_1.default.query(queryText, [id]);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Test definition ${id} deletion attempt result: ${deleted}`);
        return deleted;
    }
    catch (error) {
        console.error(`[DB Error] Failed to delete test definition ${id}:`, error);
        throw new Error('Database error while deleting test definition.');
    }
});
exports.deleteTestDefinition = deleteTestDefinition;
const findTestResults = (filters, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
    // Needs JOINs to filter potentially by team (via player_id -> user -> team)
    // Or pass playerIds directly based on team filter applied in controller
    let queryText = `
        SELECT tr.*, td.name as test_name, td.category as test_category 
        FROM test_results tr 
        JOIN test_definitions td ON tr.test_definition_id = td.id
    `;
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    if (filters.playerId) {
        whereClauses.push(`tr.player_id = $${paramIndex++}`);
        queryParams.push(filters.playerId);
    }
    if (filters.testDefinitionId) {
        whereClauses.push(`tr.test_definition_id = $${paramIndex++}`);
        queryParams.push(filters.testDefinitionId);
    }
    if (filters.testBatchId) {
        whereClauses.push(`tr.test_batch_id = $${paramIndex++}`);
        queryParams.push(filters.testBatchId);
    }
    if (filters.dateFrom) {
        whereClauses.push(`tr.date_performed >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClauses.push(`tr.date_performed <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
    }
    // TODO: Add filtering by teamId requires joining with user/team data or passing playerIds
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ` ORDER BY tr.date_performed DESC, td.name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);
    console.log('[DB Query] Finding test results:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} test results`);
        return result.rows;
    }
    catch (error) {
        console.error('[DB Error] Failed to find test results:', error);
        throw new Error('Database error while fetching test results.');
    }
});
exports.findTestResults = findTestResults;
const countTestResults = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT COUNT(*) FROM test_results tr'; // Alias needed if joining
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    // Apply same filters as findTestResults
    if (filters.playerId) {
        whereClauses.push(`tr.player_id = $${paramIndex++}`);
        queryParams.push(filters.playerId);
    }
    if (filters.testDefinitionId) {
        whereClauses.push(`tr.test_definition_id = $${paramIndex++}`);
        queryParams.push(filters.testDefinitionId);
    }
    if (filters.testBatchId) {
        whereClauses.push(`tr.test_batch_id = $${paramIndex++}`);
        queryParams.push(filters.testBatchId);
    }
    if (filters.dateFrom) {
        whereClauses.push(`tr.date_performed >= $${paramIndex++}`);
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClauses.push(`tr.date_performed <= $${paramIndex++}`);
        queryParams.push(filters.dateTo);
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    console.log('[DB Query] Counting test results:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} test results`);
        return count;
    }
    catch (error) {
        console.error('[DB Error] Failed to count test results:', error);
        throw new Error('Database error while counting test results.');
    }
});
exports.countTestResults = countTestResults;
const findTestResultById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = `
        SELECT tr.*, td.name as test_name, td.category as test_category 
        FROM test_results tr 
        JOIN test_definitions td ON tr.test_definition_id = td.id
        WHERE tr.id = $1
    `;
    console.log('[DB Query] Finding test result by ID:', queryText, [id]);
    try {
        const result = yield db_1.default.query(queryText, [id]);
        if (result.rows.length === 0)
            return null;
        console.log(`[DB Success] Found test result ${id}`);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to find test result ${id}:`, error);
        throw new Error('Database error while fetching test result by ID.');
    }
});
exports.findTestResultById = findTestResultById;
const createTestResult = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { playerId, testDefinitionId, testBatchId, value, unit, datePerformed, administeredByUserId, notes } = data;
    // TODO: Fetch unit from testDefinitionId to ensure consistency?
    const queryText = `
        INSERT INTO test_results (player_id, test_definition_id, test_batch_id, value, unit, date_performed, administered_by_user_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const params = [
        playerId, testDefinitionId, testBatchId || null, value, unit, datePerformed,
        administeredByUserId || null, notes || null
    ];
    console.log('[DB Query] Creating test result:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        console.log('[DB Success] Test result created:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error('[DB Error] Failed to create test result:', error);
        throw new Error('Database error while creating test result.');
    }
});
exports.createTestResult = createTestResult;
// Test results are often immutable, so update might not be needed or should be restricted.
const updateTestResult = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;
    if (data.value !== undefined) {
        updateFields.push(`value = $${paramIndex++}`);
        updateParams.push(data.value);
    }
    if (data.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        updateParams.push(data.notes);
    }
    if (updateFields.length === 0)
        throw new Error("No fields provided for update.");
    // Only allow updating value and notes? No date or test type change.
    const queryText = `UPDATE test_results SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);
    console.log('[DB Query] Updating test result:', queryText, updateParams);
    try {
        // TODO: Add authorization check
        const result = yield db_1.default.query(queryText, updateParams);
        if (result.rows.length === 0)
            return null;
        console.log('[DB Success] Test result updated:', result.rows[0]);
        return result.rows[0];
    }
    catch (error) {
        console.error(`[DB Error] Failed to update test result ${id}:`, error);
        throw new Error('Database error while updating test result.');
    }
});
exports.updateTestResult = updateTestResult;
const deleteTestResult = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'DELETE FROM test_results WHERE id = $1';
    console.log('[DB Query] Deleting test result:', queryText, [id]);
    try {
        // TODO: Add authorization check
        const result = yield db_1.default.query(queryText, [id]);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Test result ${id} deletion attempt result: ${deleted}`);
        return deleted;
    }
    catch (error) {
        console.error(`[DB Error] Failed to delete test result ${id}:`, error);
        throw new Error('Database error while deleting test result.');
    }
});
exports.deleteTestResult = deleteTestResult;
// --- Test Batch Functions ---
// TODO: Implement CRUD for TestBatches if needed via API 
