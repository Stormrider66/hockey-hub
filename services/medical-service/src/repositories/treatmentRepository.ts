import db from '../db';
import { Treatment } from '../types/medical';
import { QueryResult } from 'pg';

export const findTreatmentsByInjuryId = async (injuryId: string): Promise<Treatment[]> => {
    const query = 'SELECT * FROM treatments WHERE injury_id = $1 ORDER BY date DESC';
    const params = [injuryId];
    try {
        const result: QueryResult<Treatment> = await db.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('[DB Error] Failed to find treatments for injury', injuryId, error);
        throw new Error('Database error while fetching treatments.');
    }
};

export const createTreatment = async (treatment: {
    injuryId: string;
    date: Date;
    treatmentType: string;
    notes?: string;
    durationMinutes?: number;
    performedByUserId: string;
}): Promise<Treatment> => {
    const { injuryId, date, treatmentType, notes, durationMinutes, performedByUserId } = treatment;
    const query = `
        INSERT INTO treatments (injury_id, date, treatment_type, notes, duration, performed_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const params = [injuryId, date, treatmentType, notes || null, durationMinutes || null, performedByUserId];
    try {
        const result: QueryResult<Treatment> = await db.query(query, params);
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to create treatment', error);
        throw new Error('Database error while creating treatment.');
    }
};

export const updateTreatment = async (
    id: string,
    data: Partial<{
        date: Date;
        treatmentType: string;
        notes?: string;
        durationMinutes?: number;
    }>
): Promise<Treatment | null> => {
    const fields: string[] = [];
    const params: any[] = [];
    let index = 1;
    if (data.date) {
        fields.push(`date = $${index++}`);
        params.push(data.date);
    }
    if (data.treatmentType) {
        fields.push(`treatment_type = $${index++}`);
        params.push(data.treatmentType);
    }
    if (data.notes !== undefined) {
        fields.push(`notes = $${index++}`);
        params.push(data.notes);
    }
    if (data.durationMinutes !== undefined) {
        fields.push(`duration = $${index++}`);
        params.push(data.durationMinutes);
    }
    if (fields.length === 0) {
        throw new Error('No fields provided for treatment update.');
    }
    fields.push('updated_at = NOW()');
    const query = `
        UPDATE treatments SET ${fields.join(', ')} WHERE id = $${index++} RETURNING *;
    `;
    params.push(id);
    try {
        const result: QueryResult<Treatment> = await db.query(query, params);
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0];
    } catch (error) {
        console.error('[DB Error] Failed to update treatment', id, error);
        throw new Error('Database error while updating treatment.');
    }
};

export const deleteTreatment = async (id: string): Promise<boolean> => {
    try {
        const result = await db.query('DELETE FROM treatments WHERE id = $1', [id]);
        return (result.rowCount || 0) > 0;
    } catch (error) {
        console.error('[DB Error] Failed to delete treatment', id, error);
        throw new Error('Database error while deleting treatment.');
    }
}; 