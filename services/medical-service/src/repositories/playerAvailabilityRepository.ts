import db from '../db';
import { QueryResult } from 'pg';

export interface PlayerAvailabilityRow {
  id: string;
  player_id: string;
  current_status: string;
  notes: string | null;
  effective_from: Date;
  expected_end_date: Date | null;
  injury_id: string | null;
  updated_by_user_id: string;
  team_id: string;
  created_at: Date;
  updated_at: Date;
}

export const getCurrentAvailability = async (
  playerId: string
): Promise<PlayerAvailabilityRow | null> => {
  const query = `
    SELECT *
    FROM player_availability_status
    WHERE player_id = $1
      AND effective_from <= CURRENT_DATE
    ORDER BY effective_from DESC
    LIMIT 1
  `;
  const params = [playerId];
  try {
    const result: QueryResult<PlayerAvailabilityRow> = await db.query(query, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[DB Error] Failed to fetch availability for player', playerId, error);
    throw new Error('Database error while fetching availability status.');
  }
};

export const createAvailabilityStatus = async (
  status: {
    playerId: string;
    currentStatus: string;
    notes?: string;
    effectiveFrom: string;
    expectedEndDate?: string;
    injuryId?: string;
    updatedByUserId: string;
    teamId: string;
  }
): Promise<PlayerAvailabilityRow> => {
  const {
    playerId,
    currentStatus,
    notes,
    effectiveFrom,
    expectedEndDate,
    injuryId,
    updatedByUserId,
    teamId,
  } = status;
  const query = `
    INSERT INTO player_availability_status (
      player_id, current_status, notes,
      effective_from, expected_end_date, injury_id,
      updated_by_user_id, team_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
  `;
  const params = [
    playerId,
    currentStatus,
    notes || null,
    effectiveFrom,
    expectedEndDate || null,
    injuryId || null,
    updatedByUserId,
    teamId,
  ];
  try {
    const result: QueryResult<PlayerAvailabilityRow> = await db.query(query, params);
    return result.rows[0];
  } catch (error) {
    console.error('[DB Error] Failed to create availability status', error);
    throw new Error('Database error while creating availability status.');
  }
}; 