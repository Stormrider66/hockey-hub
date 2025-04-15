import db from '../db';
import { Exercise } from '../types/exercise';
import { QueryResult } from 'pg';

// TODO: Add validation for inputs

interface FindExercisesFilters {
    organizationId?: string;
    isPublic?: boolean;
    category?: string;
    searchTerm?: string;
}

export const findExercises = async (filters: FindExercisesFilters, limit: number, offset: number): Promise<Exercise[]> => {
    let queryText = 'SELECT * FROM exercises';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    // Apply filters
    // Only show public OR organization-specific exercises
    if (filters.organizationId) {
        whereClauses.push(`(is_public = true OR organization_id = $${paramIndex++})`);
        queryParams.push(filters.organizationId);
    } else {
        // If no org ID, only show public exercises
        whereClauses.push(`is_public = true`);
    }
    
    if (filters.category) {
        whereClauses.push(`category = $${paramIndex++}`);
        queryParams.push(filters.category);
    }
    if (filters.searchTerm) {
        whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    queryText += ` ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    console.log('[DB Query] Finding exercises:', queryText, queryParams);
    try {
        const result: QueryResult<Exercise> = await db.query(queryText, queryParams);
        console.log(`[DB Success] Found ${result.rows.length} exercises`);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find exercises:', error);
        throw new Error('Database error while fetching exercises.');
    }
};

export const countExercises = async (filters: FindExercisesFilters): Promise<number> => {
     let queryText = 'SELECT COUNT(*) FROM exercises';
    const queryParams: any[] = [];
    const whereClauses: string[] = [];
    let paramIndex = 1;

    // Apply same filters as findExercises
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
     if (filters.searchTerm) {
        whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }

    if (whereClauses.length > 0) {
        queryText += ' WHERE ' + whereClauses.join(' AND ');
    }

    console.log('[DB Query] Counting exercises:', queryText, queryParams);
    try {
        const result = await db.query(queryText, queryParams);
        const count = parseInt(result.rows[0].count, 10);
         console.log(`[DB Success] Counted ${count} exercises`);
        return count;
    } catch (error) {
        console.error('[DB Error] Failed to count exercises:', error);
        throw new Error('Database error while counting exercises.');
    }
};

export const findExerciseById = async (id: string, organizationId?: string): Promise<Exercise | null> => {
    let queryText = 'SELECT * FROM exercises WHERE id = $1';
    const queryParams: any[] = [id];
    let paramIndex = 2;

    // Ensure user can access non-public exercises only if they belong to the org
    if (organizationId) {
        queryText += ` AND (is_public = true OR organization_id = $${paramIndex++})`;
        queryParams.push(organizationId);
    }
    else {
        queryText += ` AND is_public = true`;
    }

    console.log('[DB Query] Finding exercise by ID:', queryText, queryParams);
    try {
        const result: QueryResult<Exercise> = await db.query(queryText, queryParams);
        if (result.rows.length === 0) {
            return null;
        }
        console.log(`[DB Success] Found exercise ${id}`);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to find exercise ${id}:`, error);
        throw new Error('Database error while fetching exercise by ID.');
    }
};

export const createExercise = async (data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise> => {
    const { 
        name, 
        description, 
        videoUrl, 
        muscleGroups, 
        equipmentRequired, 
        difficultyLevel, 
        category, 
        createdByUserId, 
        organizationId, 
        isPublic = false 
    } = data;

    const queryText = `
        INSERT INTO exercises (name, description, video_url, muscle_groups, equipment_required, difficulty_level, category, created_by_user_id, organization_id, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;
    const params = [
        name, 
        description || null, 
        videoUrl || null, 
        muscleGroups || null,
        equipmentRequired || null,
        difficultyLevel || null,
        category || null,
        createdByUserId || null, // Allow null if system creates public exercises?
        organizationId || null,
        isPublic
    ];

    console.log('[DB Query] Creating exercise:', queryText, params);
    try {
        const result: QueryResult<Exercise> = await db.query(queryText, params);
        console.log('[DB Success] Exercise created:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create exercise:', error);
        throw new Error('Database error while creating exercise.');
    }
};

export const updateExercise = async (id: string, data: Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'createdByUserId'>>): Promise<Exercise | null> => {
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
        // Map camelCase keys to snake_case DB columns
        const dbColumn = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updateFields.push(`${dbColumn} = $${paramIndex++}`);
        updateParams.push(value);
    });

    if (updateFields.length === 0) {
        throw new Error("No fields provided for update.");
    }

    updateFields.push(`updated_at = NOW()`);
    const queryText = `UPDATE exercises SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} RETURNING *`;
    updateParams.push(id);

    console.log('[DB Query] Updating exercise:', queryText, updateParams);
    try {
        const result: QueryResult<Exercise> = await db.query(queryText, updateParams);
        if (result.rows.length === 0) {
            return null; // Not found
        }
        console.log('[DB Success] Exercise updated:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[DB Error] Failed to update exercise ${id}:`, error);
        throw new Error('Database error while updating exercise.');
    }
};

export const deleteExercise = async (id: string): Promise<boolean> => {
    const queryText = 'DELETE FROM exercises WHERE id = $1';
    const params = [id];

    console.log('[DB Query] Deleting exercise:', queryText, params);
    try {
        const result = await db.query(queryText, params);
        const deleted = result.rowCount ? result.rowCount > 0 : false;
        console.log(`[DB Success] Exercise ${id} deletion attempt result: ${deleted}`);
        return deleted;
    } catch (error) {
        console.error(`[DB Error] Failed to delete exercise ${id}:`, error);
        throw new Error('Database error while deleting exercise.');
        // Consider checking for FK constraints if templates use exercises
    }
}; 