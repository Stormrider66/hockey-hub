import db from '../db';

export interface LiveMetric {
    playerId: string;
    heartRate: number | null;
    watts: number | null;
    recordedAt: Date;
}

/**
 * Fetches the latest metric row per player for a given team.
 * Expects a view or table `live_metrics` containing realtime data.
 */
export const findLatestMetricsByTeamId = async (teamId: string): Promise<LiveMetric[]> => {
    const query = `
        SELECT lm.player_id   AS "playerId",
               lm.heart_rate  AS "heartRate",
               lm.watts       AS "watts",
               lm.recorded_at AS "recordedAt"
        FROM live_metrics lm
        JOIN players p ON p.id = lm.player_id
        WHERE p.team_id = $1
          AND lm.recorded_at = (
              SELECT MAX(recorded_at)
              FROM live_metrics lm2
              WHERE lm2.player_id = lm.player_id
          );`;

    const params = [teamId];

    try {
        const result = await db.query(query, params);
        return result.rows as LiveMetric[];
    } catch (err) {
        console.error('[DB Error] Failed to fetch live metrics:', err);
        throw new Error('Database error fetching live metrics');
    }
}; 