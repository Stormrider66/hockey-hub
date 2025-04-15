import db from '../db';
import { PhysicalSessionCategory } from '../types/training';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

/**
 * Finds physical session categories for a specific organization.
 */
export const findCategoriesByOrgId = async (organizationId: string): Promise<PhysicalSessionCategory[]> => {
    const queryText = 'SELECT * FROM physical_session_categories WHERE organization_id = $1 ORDER BY name ASC';
    const params = [organizationId];

    console.log('[DB Query] Finding physical categories by org ID:', queryText, params);
    try {
        const result: QueryResult<PhysicalSessionCategory> = await db.query(queryText, params);
        console.log(`[DB Success] Found ${result.rows.length} categories for org ${organizationId}`);
        return result.rows;
    } catch (error) {
        console.error(`[DB Error] Failed to find categories for org ${organizationId}:`, error);
        throw new Error('Database error while fetching physical categories.');
    }
};

/**
 * Finds a specific physical session category by its ID.
 * Ensures the category belongs to the specified organization.
 */
export const findCategoryById = async (id: string, organizationId: string): Promise<PhysicalSessionCategory | null> => {
    const queryText = 'SELECT * FROM physical_session_categories WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];

    console.log('[DB Query] Finding physical category by ID:', queryText, params);
    try {
        const result: QueryResult<PhysicalSessionCategory> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found category ${id}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find category ${id}:`, error);
        throw new Error('Database error while fetching category by ID.');
    }
};

/**
 * Creates a new physical session category.
 */
export const createCategory = async (data: Omit<PhysicalSessionCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhysicalSessionCategory> => {
    const { name, createdByUserId, organizationId } = data;

    const queryText = `
        INSERT INTO physical_session_categories (name, created_by_user_id, organization_id)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const params = [name, createdByUserId, organizationId];

    console.log('[DB Query] Creating physical category:', queryText, params);
    try {
        const result: QueryResult<PhysicalSessionCategory> = await db.query(queryText, params);
        console.log('[DB Success] Category created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create category:', error);
        // Handle potential unique constraint violation on name+orgId if needed
        throw new Error('Database error while creating category.');
    }
};

/**
 * Updates an existing physical session category.
 */
export const updateCategory = async (id: string, organizationId: string, data: Partial<Pick<PhysicalSessionCategory, 'name'>>): Promise<PhysicalSessionCategory | null> => {
    const { name } = data;
    if (!name) {
         throw new Error("Missing required field for update: name.");
    }
    
    const queryText = `
        UPDATE physical_session_categories 
        SET name = $1, updated_at = NOW()
        WHERE id = $2 AND organization_id = $3
        RETURNING *
    `;
    const params = [name, id, organizationId];

    console.log('[DB Query] Updating physical category:', queryText, params);
    try {
        const result: QueryResult<PhysicalSessionCategory> = await db.query(queryText, params);
        if (result.rows.length === 0) {
            return null; // Not found or not authorized for this org
        }
        console.log('[DB Success] Category updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update category ${id}:`, error);
        throw new Error('Database error while updating category.');
    }
};

/**
 * Deletes a physical session category.
 */
export const deleteCategory = async (id: string, organizationId: string): Promise<boolean> => {
    const queryText = 'DELETE FROM physical_session_categories WHERE id = $1 AND organization_id = $2';
    const params = [id, organizationId];

    console.log('[DB Query] Deleting physical category:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Category ${id} deletion attempt result: ${deleted}`);
        // Note: ON DELETE SET NULL is used for templates linking to categories.
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete category ${id}:`, error);
        throw new Error('Database error while deleting category.');
    }
}; 