import db from '../db';
import { TestDefinition, TestResult } from '../types/test';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

// --- Test Definition Functions ---

interface FindTestDefinitionsFilters {
    organizationId?: string;
    category?: string;
    isPublic?: boolean;
    searchTerm?: string;
}

export const findTestDefinitions = async (filters: FindTestDefinitionsFilters, limit: number, offset: number): Promise<TestDefinition[]> => {
    let queryText = 'SELECT * FROM test_definitions';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    // Filter by public or organization-specific
    if (filters.organizationId) {
        whereClauses.push(`(is_public = true OR organization_id = $${paramIndex++})`);
        queryParams.push(filters.organizationId);
    } else {
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
        const result: QueryResult<TestDefinition> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} test definitions`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find test definitions:', error);
        throw new Error('Database error while fetching test definitions.');
    }
};

export const countTestDefinitions = async (filters: FindTestDefinitionsFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM test_definitions';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    // Apply same filters as findTestDefinitions
     if (filters.organizationId) {
        whereClauses.push(`(is_public = true OR organization_id = $${paramIndex++})`);
        queryParams.push(filters.organizationId);
    } else {
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
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} test definitions`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count test definitions:', error);
        throw new Error('Database error while counting test definitions.');
    }
};

export const findTestDefinitionById = async (id: string, organizationId?: string): Promise<TestDefinition | null> => {
    let queryText = 'SELECT * FROM test_definitions WHERE id = $1';
    const queryParams: any[] = [id];
    let paramIndex = 2;
    if (organizationId) {
        queryText += ` AND (is_public = true OR organization_id = $${paramIndex++})`;
        queryParams.push(organizationId);
    } else {
        queryText += ` AND is_public = true`;
    }

    console.log('[DB Query] Finding test definition by ID:', queryText, queryParams);
     try {
        const result: QueryResult<TestDefinition> = await db.query(queryText, queryParams);
        if (result.rows.length === 0) return null;
        console.log(`[DB Success] Found test definition ${id}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find test definition ${id}:`, error);
        throw new Error('Database error while fetching test definition by ID.');
    }
};

export const createTestDefinition = async (data: Omit<TestDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestDefinition> => {
    const { 
        name, category, description, protocol, unit, scoreDirection, 
        organizationId, isPublic = false, createdByUserId 
    } = data;

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
        const result: QueryResult<TestDefinition> = await db.query(queryText, params);
        console.log('[DB Success] Test definition created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create test definition:', error);
        throw new Error('Database error while creating test definition.');
    }
};

export const updateTestDefinition = async (id: string, data: Partial<Omit<TestDefinition, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'createdByUserId'> >): Promise<TestDefinition | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateFields.push(`${dbColumn} = $${paramIndex++}`);
            updateParams.push(value);
        }
    });

    if (updateFields.length === 0) throw new Error("No fields provided for update.");

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE test_definitions SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating test definition:', queryText, updateParams);
    try {
        // TODO: Add check for organizationId/isPublic for authorization before update
        const result: QueryResult<TestDefinition> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) return null;
        console.log('[DB Success] Test definition updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update test definition ${id}:`, error);
        throw new Error('Database error while updating test definition.');
    }
};

export const deleteTestDefinition = async (id: string): Promise<boolean> => {
    // TODO: Add check for organizationId/isPublic for authorization before delete
    const queryText = 'DELETE FROM test_definitions WHERE id = $1';
    console.log('[DB Query] Deleting test definition:', queryText, [id]);
    try {
        const result = await db.query(queryText, [id]);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Test definition ${id} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete test definition ${id}:`, error);
        throw new Error('Database error while deleting test definition.');
    }
};

// --- Test Result Functions ---

interface FindTestResultsFilters {
    playerId?: string;
    testDefinitionId?: string;
    testBatchId?: string;
    teamId?: string; // For fetching results for a whole team
    dateFrom?: string;
    dateTo?: string;
}

export const findTestResults = async (filters: FindTestResultsFilters, limit: number, offset: number): Promise<TestResult[]> => {
    // Needs JOINs to filter potentially by team (via player_id -> user -> team)
    // Or pass playerIds directly based on team filter applied in controller
    let queryText = `
        SELECT tr.*, td.name as test_name, td.category as test_category 
        FROM test_results tr 
        JOIN test_definitions td ON tr.test_definition_id = td.id
    `; 
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    if (filters.playerId) { whereClauses.push(`tr.player_id = $${paramIndex++}`); queryParams.push(filters.playerId); }
    if (filters.testDefinitionId) { whereClauses.push(`tr.test_definition_id = $${paramIndex++}`); queryParams.push(filters.testDefinitionId); }
    if (filters.testBatchId) { whereClauses.push(`tr.test_batch_id = $${paramIndex++}`); queryParams.push(filters.testBatchId); }
    if (filters.dateFrom) { whereClauses.push(`tr.date_performed >= $${paramIndex++}`); queryParams.push(filters.dateFrom); }
    if (filters.dateTo) { whereClauses.push(`tr.date_performed <= $${paramIndex++}`); queryParams.push(filters.dateTo); }
    // TODO: Add filtering by teamId requires joining with user/team data or passing playerIds

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ` ORDER BY tr.date_performed DESC, td.name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding test results:', queryText, queryParams);
     try {
        const result: QueryResult<TestResult> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} test results`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find test results:', error);
        throw new Error('Database error while fetching test results.');
    }
};

export const countTestResults = async (filters: FindTestResultsFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM test_results tr'; // Alias needed if joining
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;
    // Apply same filters as findTestResults
    if (filters.playerId) { whereClauses.push(`tr.player_id = $${paramIndex++}`); queryParams.push(filters.playerId); }
    if (filters.testDefinitionId) { whereClauses.push(`tr.test_definition_id = $${paramIndex++}`); queryParams.push(filters.testDefinitionId); }
    if (filters.testBatchId) { whereClauses.push(`tr.test_batch_id = $${paramIndex++}`); queryParams.push(filters.testBatchId); }
    if (filters.dateFrom) { whereClauses.push(`tr.date_performed >= $${paramIndex++}`); queryParams.push(filters.dateFrom); }
    if (filters.dateTo) { whereClauses.push(`tr.date_performed <= $${paramIndex++}`); queryParams.push(filters.dateTo); }
    
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting test results:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} test results`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count test results:', error);
        throw new Error('Database error while counting test results.');
    }
}

export const findTestResultById = async (id: string): Promise<TestResult | null> => {
     const queryText = `
        SELECT tr.*, td.name as test_name, td.category as test_category 
        FROM test_results tr 
        JOIN test_definitions td ON tr.test_definition_id = td.id
        WHERE tr.id = $1
    `;
    console.log('[DB Query] Finding test result by ID:', queryText, [id]);
     try {
        const result: QueryResult<TestResult> = await db.query(queryText, [id]);
        if (result.rows.length === 0) return null;
        console.log(`[DB Success] Found test result ${id}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find test result ${id}:`, error);
        throw new Error('Database error while fetching test result by ID.');
    }
};

export const createTestResult = async (data: Omit<TestResult, 'id' | 'createdAt'>): Promise<TestResult> => {
    const { 
        playerId, testDefinitionId, testBatchId, value, unit, 
        datePerformed, administeredByUserId, notes 
    } = data;

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
        const result: QueryResult<TestResult> = await db.query(queryText, params);
        console.log('[DB Success] Test result created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create test result:', error);
        throw new Error('Database error while creating test result.');
    }
};

// Test results are often immutable, so update might not be needed or should be restricted.
export const updateTestResult = async (id: string, data: Partial<Pick<TestResult, 'value' | 'notes'> >): Promise<TestResult | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    if (data.value !== undefined) { updateFields.push(`value = $${paramIndex++}`); updateParams.push(data.value); }
    if (data.notes !== undefined) { updateFields.push(`notes = $${paramIndex++}`); updateParams.push(data.notes); }

    if (updateFields.length === 0) throw new Error("No fields provided for update.");

    // Only allow updating value and notes? No date or test type change.
    const queryText = `UPDATE test_results SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating test result:', queryText, updateParams);
     try {
        // TODO: Add authorization check
        const result: QueryResult<TestResult> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) return null;
        console.log('[DB Success] Test result updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update test result ${id}:`, error);
        throw new Error('Database error while updating test result.');
    }
};

export const deleteTestResult = async (id: string): Promise<boolean> => {
    const queryText = 'DELETE FROM test_results WHERE id = $1';
    console.log('[DB Query] Deleting test result:', queryText, [id]);
    try {
        // TODO: Add authorization check
        const result = await db.query(queryText, [id]);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Test result ${id} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete test result ${id}:`, error);
        throw new Error('Database error while deleting test result.');
    }
};

// --- Test Batch Functions ---
// TODO: Implement CRUD for TestBatches if needed via API 