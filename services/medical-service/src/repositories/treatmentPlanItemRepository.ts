import db from '../db';
import { QueryResult } from 'pg';

// Represents a row in the treatment_plan_items table
export interface TreatmentPlanItemRow {
  id: string;
  treatment_plan_id: string;
  description: string;
  frequency: string;
  duration: string;
  sets: number | null;
  reps: number | null;
  progression_criteria: string | null;
  exercise_id: string | null;
  sequence: number;
  created_at: Date;
  updated_at: Date;
}

export const findItemsByPlanId = async (planId: string): Promise<TreatmentPlanItemRow[]> => {
  const query = 'SELECT * FROM treatment_plan_items WHERE treatment_plan_id = $1 ORDER BY sequence';
  const params = [planId];
  try {
    const result: QueryResult<TreatmentPlanItemRow> = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('[DB Error] Failed to find treatment plan items for plan', planId, error);
    throw new Error('Database error while fetching treatment plan items.');
  }
};

export const createTreatmentPlanItem = async (item: {
  planId: string;
  description: string;
  frequency: string;
  duration: string;
  sets?: number;
  reps?: number;
  progressionCriteria?: string;
  exerciseId?: string;
  sequence: number;
}): Promise<TreatmentPlanItemRow> => {
  const { planId, description, frequency, duration, sets, reps, progressionCriteria, exerciseId, sequence } = item;
  const query = `
    INSERT INTO treatment_plan_items (
      treatment_plan_id, description, frequency, duration,
      sets, reps, progression_criteria, exercise_id, sequence
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `;
  const params = [planId, description, frequency, duration, sets || null, reps || null, progressionCriteria || null, exerciseId || null, sequence];
  try {
    const result: QueryResult<TreatmentPlanItemRow> = await db.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('[DB Error] Failed to create treatment plan item', error);
    throw new Error('Database error while creating treatment plan item.');
  }
};

export const updateTreatmentPlanItem = async (
  id: string,
  data: Partial<{
    description: string;
    frequency: string;
    duration: string;
    sets?: number;
    reps?: number;
    progressionCriteria?: string;
    exerciseId?: string;
    sequence: number;
  }>
): Promise<TreatmentPlanItemRow | null> => {
  const fields: string[] = [];
  const params: any[] = [];
  let index = 1;
  if (data.description) { fields.push(`description = $${index++}`); params.push(data.description); }
  if (data.frequency) { fields.push(`frequency = $${index++}`); params.push(data.frequency); }
  if (data.duration) { fields.push(`duration = $${index++}`); params.push(data.duration); }
  if (data.sets !== undefined) { fields.push(`sets = $${index++}`); params.push(data.sets); }
  if (data.reps !== undefined) { fields.push(`reps = $${index++}`); params.push(data.reps); }
  if (data.progressionCriteria !== undefined) { fields.push(`progression_criteria = $${index++}`); params.push(data.progressionCriteria); }
  if (data.exerciseId !== undefined) { fields.push(`exercise_id = $${index++}`); params.push(data.exerciseId); }
  if (data.sequence !== undefined) { fields.push(`sequence = $${index++}`); params.push(data.sequence); }
  if (fields.length === 0) {
    throw new Error('No fields provided for treatment plan item update.');
  }
  fields.push('updated_at = NOW()');
  const query = `
    UPDATE treatment_plan_items SET ${fields.join(', ')} WHERE id = $${index++} RETURNING *;
  `;
  params.push(id);
  try {
    const result: QueryResult<TreatmentPlanItemRow> = await db.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('[DB Error] Failed to update treatment plan item', id, error);
    throw new Error('Database error while updating treatment plan item.');
  }
};

export const deleteTreatmentPlanItem = async (id: string): Promise<boolean> => {
  try {
    const result = await db.query('DELETE FROM treatment_plan_items WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[DB Error] Failed to delete treatment plan item', id, error);
    throw new Error('Database error while deleting treatment plan item.');
  }
}; 