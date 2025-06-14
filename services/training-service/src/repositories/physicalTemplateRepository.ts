import db from '../db';
import { PhysicalSessionTemplate } from '../types/training';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

interface FindTemplatesFilters {
    organizationId: string; // Required: Templates are org-specific unless public
    categoryId?: string;
    searchTerm?: string;
    isPublic?: boolean; // Filter for public templates specifically
}

/**
 * Finds physical session templates based on filters.
 */
export const findTemplates = async (filters: FindTemplatesFilters, limit: number, offset: number): Promise<PhysicalSessionTemplate[]> => {
    let queryText = 'SELECT t.*, c.name as category_name FROM physical_session_templates t LEFT JOIN physical_session_categories c ON t.category_id = c.id';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
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
        const result: QueryResult<PhysicalSessionTemplate> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} templates`);
        // Ensure sections is always an array
        return result.rows.map(row => ({ ...row, sections: row.sections || [] })); 
    } catch (error) {
        console.error('[DB Error] Failed to find templates:', error);
        throw new Error('Database error while fetching physical templates.');
    }
};

/**
 * Counts physical session templates based on filters.
 */
export const countTemplates = async (filters: FindTemplatesFilters): Promise<number> => {
    let queryText = 'SELECT COUNT(*) FROM physical_session_templates t';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
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
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
        console.log(`[DB Success] Counted ${count} templates`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count templates:', error);
        throw new Error('Database error while counting physical templates.');
    }
};

/**
 * Finds a specific template by ID.
 */
export const findTemplateById = async (id: string, organizationId: string): Promise<PhysicalSessionTemplate | null> => {
    const queryText = 'SELECT t.*, c.name as category_name FROM physical_session_templates t LEFT JOIN physical_session_categories c ON t.category_id = c.id WHERE t.id = $1 AND (t.is_public = true OR t.organization_id = $2)';
    const params = [id, organizationId];

    console.log('[DB Query] Finding physical template by ID:', queryText, params);
    try {
        const result: QueryResult<PhysicalSessionTemplate> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        const template = result.rows[0];
        template.sections = template.sections || []; // Ensure sections is an array
        console.log(`[DB Success] Found template ${id}`);
        return template;
    } catch (error) {
        console.error(`[DB Error] Failed to find template ${id}:`, error);
        throw new Error('Database error while fetching template by ID.');
    }
};

/**
 * Creates a new physical session template.
 */
export const createTemplate = async (data: Omit<PhysicalSessionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhysicalSessionTemplate> => {
    const { 
        name, 
        description, 
        categoryId, 
        createdByUserId, 
        organizationId, 
        sections, 
        estimatedDuration, 
        isPublic = false 
    } = data;

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
        const result: QueryResult<PhysicalSessionTemplate> = await db.query(queryText, params);
        const newTemplate = result.rows[0];
        newTemplate.sections = newTemplate.sections || []; // Ensure sections is an array
        console.log('[DB Success] Template created:', newTemplate);
        return newTemplate;
    } catch (error) {
        console.error('[DB Error] Failed to create template:', error);
        throw new Error('Database error while creating physical template.');
    }
};

/**
 * Updates an existing physical session template.
 */
export const updateTemplate = async (id: string, organizationId: string, data: Partial<Omit<PhysicalSessionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'createdByUserId'>>): Promise<PhysicalSessionTemplate | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
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
            } else {
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
        const result: QueryResult<PhysicalSessionTemplate> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized
        }
        const updatedTemplate = result.rows[0];
        updatedTemplate.sections = updatedTemplate.sections || []; // Ensure sections is an array
        console.log('[DB Success] Template updated:', updatedTemplate);
        return updatedTemplate;
    } catch (error) {
        console.error(`[DB Error] Failed to update template ${id}:`, error);
        throw new Error('Database error while updating physical template.');
    }
};

/**
 * Deletes a physical session template.
 */
export const deleteTemplate = async (id: string, organizationId: string): Promise<boolean> => {
    // Ensure only the owner org can delete non-public templates
    const queryText = 'DELETE FROM physical_session_templates WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];

    console.log('[DB Query] Deleting physical template:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        // Add null check
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Template ${id} deletion attempt result: ${deleted}`);
        // Note: FK constraint on scheduled_physical_sessions is ON DELETE SET NULL
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete template ${id}:`, error);
        throw new Error('Database error while deleting physical template.');
    }
}; 