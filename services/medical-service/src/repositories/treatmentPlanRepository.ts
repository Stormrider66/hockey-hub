import db from '../db';
import { QueryResult } from 'pg';

// Represents a row in the treatment_plans table
export interface TreatmentPlanRow {
  id: string;
  injury_id: string;
  phase: string;
  description: string;
  expected_duration: number;
  goals: string;
  precautions: string | null;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export const findPlansByInjuryId = async (injuryId: string): Promise<TreatmentPlanRow[]> => {
  const query = 'SELECT * FROM treatment_plans WHERE injury_id = $1 ORDER BY created_at DESC';
  const params = [injuryId];
  try {
    const result: QueryResult<TreatmentPlanRow> = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('[DB Error] Failed to find treatment plans for injury', injuryId, error);
    throw new Error('Database error while fetching treatment plans.');
  }
};

export const createTreatmentPlan = async (plan: {
  injuryId: string;
  phase: string;
  description: string;
  expectedDuration: number;
  goals: string;
  precautions?: string;
  createdByUserId: string;
}): Promise<TreatmentPlanRow> => {
  const { injuryId, phase, description, expectedDuration, goals, precautions, createdByUserId } = plan;
  const query = `
    INSERT INTO treatment_plans (
      injury_id, phase, description, expected_duration,
      goals, precautions, created_by_user_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const params = [injuryId, phase, description, expectedDuration, goals, precautions || null, createdByUserId];
  try {
    const result: QueryResult<TreatmentPlanRow> = await db.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('[DB Error] Failed to create treatment plan', error);
    throw new Error('Database error while creating treatment plan.');
  }
};

export const updateTreatmentPlan = async (
  id: string,
  data: Partial<{
    phase: string;
    description: string;
    expectedDuration: number;
    goals: string;
    precautions?: string;
  }>
): Promise<TreatmentPlanRow | null> => {
  const fields: string[] = [];
  const params: any[] = [];
  let index = 1;
  if (data.phase) {
    fields.push(`phase = $${index++}`);
    params.push(data.phase);
  }
  if (data.description) {
    fields.push(`description = $${index++}`);
    params.push(data.description);
  }
  if (data.expectedDuration !== undefined) {
    fields.push(`expected_duration = $${index++}`);
    params.push(data.expectedDuration);
  }
  if (data.goals) {
    fields.push(`goals = $${index++}`);
    params.push(data.goals);
  }
  if (data.precautions !== undefined) {
    fields.push(`precautions = $${index++}`);
    params.push(data.precautions);
  }
  if (fields.length === 0) {
    throw new Error('No fields provided for treatment plan update.');
  }
  fields.push('updated_at = NOW()');

  const query = `
    UPDATE treatment_plans SET ${fields.join(', ')} WHERE id = $${index++} RETURNING *
  `;
  params.push(id);
  try {
    const result: QueryResult<TreatmentPlanRow> = await db.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error('[DB Error] Failed to update treatment plan', id, error);
    throw new Error('Database error while updating treatment plan.');
  }
};

export const deleteTreatmentPlan = async (id: string): Promise<boolean> => {
  try {
    const result = await db.query('DELETE FROM treatment_plans WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[DB Error] Failed to delete treatment plan', id, error);
    throw new Error('Database error while deleting treatment plan.');
  }
}; 