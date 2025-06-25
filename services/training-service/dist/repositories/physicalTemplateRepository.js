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
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.findTemplateById = exports.countTemplates = exports.findTemplates = void 0;
const db_1 = __importDefault(require("../db"));
/**
 * Finds physical session templates based on filters.
 */
const findTemplates = (filters, limit, offset) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT t.*, c.name as category_name FROM physical_session_templates t LEFT JOIN physical_session_categories c ON t.category_id = c.id';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    // Base filter: Public or belonging to the specified organization
    whereClauses.push(`(t.is_public = true OR t.organization_id = $${paramIndex++})`);
    queryParams.push(filters.organizationId);
    if (filters.categoryId) {
        whereClauses.push(`t.category_id = $${paramIndex++}`);
        queryParams.push(filters.categoryId);
    }
    if (filters.isPublic !== undefined) {
        whereClauses.push(`t.is_public = $${paramIndex++}`);
        queryParams.push(filters.isPublic);
    }
    if (filters.searchTerm) {
        whereClauses.push(`(t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    queryText += ` ORDER BY t.name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);
    console.log('[DB Query] Finding physical templates:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} templates`);
        // Ensure sections is always an array
        return result.rows.map(row => (Object.assign(Object.assign({}, row), { sections: row.sections || [] })));
    }
    catch (error) {
        console.error('[DB Error] Failed to find templates:', error);
        throw new Error('Database error while fetching physical templates.');
    }
});
exports.findTemplates = findTemplates;
/**
 * Counts physical session templates based on filters.
 */
const countTemplates = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let queryText = 'SELECT COUNT(*) FROM physical_session_templates t';
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;
    whereClauses.push(`(t.is_public = true OR t.organization_id = $${paramIndex++})`);
    queryParams.push(filters.organizationId);
    if (filters.categoryId) {
        whereClauses.push(`t.category_id = $${paramIndex++}`);
        queryParams.push(filters.categoryId);
    }
    if (filters.isPublic !== undefined) {
        whereClauses.push(`t.is_public = $${paramIndex++}`);
        queryParams.push(filters.isPublic);
    }
    if (filters.searchTerm) {
        whereClauses.push(`(t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }
    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }
    console.log('[DB Query] Counting physical templates:', queryText, queryParams);
    try {
        const result = yield db_1.default.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} templates`);
        return count;
    }
    catch (error) {
        console.error('[DB Error] Failed to count templates:', error);
        throw new Error('Database error while counting physical templates.');
    }
});
exports.countTemplates = countTemplates;
/**
 * Finds a specific template by ID.
 */
const findTemplateById = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    const queryText = 'SELECT t.*, c.name as category_name FROM physical_session_templates t LEFT JOIN physical_session_categories c ON t.category_id = c.id WHERE t.id = $1 AND (t.is_public = true OR t.organization_id = $2)';
    const params = [id, organizationId];
    console.log('[DB Query] Finding physical template by ID:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        const template = result.rows[0];
        template.sections = template.sections || []; // Ensure sections is an array
        console.log(`[DB Success] Found template ${id}`);
        return template;
    }
    catch (error) {
        console.error(`[DB Error] Failed to find template ${id}:`, error);
        throw new Error('Database error while fetching template by ID.');
    }
});
exports.findTemplateById = findTemplateById;
/**
 * Creates a new physical session template.
 */
const createTemplate = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, categoryId, createdByUserId, organizationId, sections, estimatedDuration, isPublic = false } = data;
    // Basic validation for sections structure (can be expanded)
    if (!Array.isArray(sections)) {
        throw new Error('Sections must be an array.');
    }
    const queryText = `
        INSERT INTO physical_session_templates 
            (name, description, category_id, created_by_user_id, organization_id, sections, estimated_duration, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const params = [
        name,
        description || null,
        categoryId,
        createdByUserId,
        organizationId,
        JSON.stringify(sections), // Stringify JSONB data
        estimatedDuration || null,
        isPublic
    ];
    console.log('[DB Query] Creating physical template:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        const newTemplate = result.rows[0];
        newTemplate.sections = newTemplate.sections || []; // Ensure sections is an array
        console.log('[DB Success] Template created:', newTemplate);
        return newTemplate;
    }
    catch (error) {
        console.error('[DB Error] Failed to create template:', error);
        throw new Error('Database error while creating physical template.');
    }
});
exports.createTemplate = createTemplate;
/**
 * Updates an existing physical session template.
 */
const updateTemplate = (id, organizationId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) { // Only include defined fields in the update
            const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            // Handle JSONB field specifically
            if (dbColumn === 'sections') {
                if (!Array.isArray(value)) {
                    throw new Error('Sections must be an array for update.');
                }
                updateFields.push(`${dbColumn} = $${paramIndex++}`);
                updateParams.push(JSON.stringify(value));
            }
            else {
                updateFields.push(`${dbColumn} = $${paramIndex++}`);
                updateParams.push(value);
            }
        }
    });
    if (updateFields.length === 0) {
        throw new Error("No fields provided for update.");
    }
    updateFields.push(`updated_at = NOW()`);
    // Ensure only the owner org can update non-public templates
    const queryText = `UPDATE physical_session_templates SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++} RETURNING *`;
    updateParams.push(id, organizationId);
    console.log('[DB Query] Updating physical template:', queryText, updateParams);
    try {
        const result = yield db_1.default.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized
        }
        const updatedTemplate = result.rows[0];
        updatedTemplate.sections = updatedTemplate.sections || []; // Ensure sections is an array
        console.log('[DB Success] Template updated:', updatedTemplate);
        return updatedTemplate;
    }
    catch (error) {
        console.error(`[DB Error] Failed to update template ${id}:`, error);
        throw new Error('Database error while updating physical template.');
    }
});
exports.updateTemplate = updateTemplate;
/**
 * Deletes a physical session template.
 */
const deleteTemplate = (id, organizationId) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure only the owner org can delete non-public templates
    const queryText = 'DELETE FROM physical_session_templates WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];
    console.log('[DB Query] Deleting physical template:', queryText, params);
    try {
        const result = yield db_1.default.query(queryText, params);
        // Add null check
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Template ${id} deletion attempt result: ${deleted}`);
        // Note: FK constraint on scheduled_physical_sessions is ON DELETE SET NULL
        return deleted;
    }
    catch (error) {
        console.error(`[DB Error] Failed to delete template ${id}:`, error);
        throw new Error('Database error while deleting physical template.');
    }
});
exports.deleteTemplate = deleteTemplate;
