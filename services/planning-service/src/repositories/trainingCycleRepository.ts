import db from '../db';
import { TrainingCycle } from '../types/planning';
import { QueryResult } from 'pg';

export const findCyclesByPhaseId = async (phaseId: string, organizationId: string): Promise<TrainingCycle[]> => {
  const query = 'SELECT * FROM training_cycles WHERE phase_id = $1 AND organization_id = $2 ORDER BY start_date ASC';
  const params = [phaseId, organizationId];
  const result: QueryResult<TrainingCycle> = await db.query(query, params);
  return result.rows;
};

export const findCycleById = async (cycleId: string, organizationId?: string): Promise<TrainingCycle | null> => {
  let query = 'SELECT * FROM training_cycles WHERE id = $1';
  const params: any[] = [cycleId];
  if (organizationId) {
    query += ' AND organization_id = $2';
    params.push(organizationId);
  }
  const result: QueryResult<TrainingCycle> = await db.query(query, params);
  return result.rows[0] || null;
};

export const createCycle = async (data: Omit<TrainingCycle,'id'|'createdAt'|'updatedAt'>): Promise<TrainingCycle> => {
  const { seasonId, phaseId, organizationId, name, startDate, endDate, description, order } = data;
  const query = `INSERT INTO training_cycles (season_id, phase_id, organization_id, name, start_date, end_date, description, "order")
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
  const params = [seasonId, phaseId, organizationId, name, startDate, endDate, description || null, order || null];
  const result: QueryResult<TrainingCycle> = await db.query(query, params);
  return result.rows[0];
};

export const updateCycle = async (cycleId: string, organizationId: string, data: Partial<Omit<TrainingCycle,'id'|'createdAt'|'updatedAt'|'seasonId'|'phaseId'|'organizationId'>>): Promise<TrainingCycle|null> => {
  const setClauses: string[] = [];
  const values: any[] = [];
  let idx = 1;
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined) {
      const col = key.replace(/[A-Z]/g, l=>`_${l.toLowerCase()}`);
      setClauses.push(`${col} = $${idx++}`);
      values.push(val);
    }
  });
  if (setClauses.length === 0) return null;
  setClauses.push(`updated_at = NOW()`);
  values.push(cycleId, organizationId);
  const query = `UPDATE training_cycles SET ${setClauses.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *`;
  const result: QueryResult<TrainingCycle> = await db.query(query, values);
  return result.rows[0] || null;
};

export const deleteCycle = async (cycleId: string, organizationId: string): Promise<boolean> => {
  const result = await db.query('DELETE FROM training_cycles WHERE id = $1 AND organization_id = $2', [cycleId, organizationId]);
  return result.rowCount ? result.rowCount>0 : false;
}; 