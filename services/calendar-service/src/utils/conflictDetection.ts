import db from '../db';

/**
 * Detect overlapping events for the given criteria.
 *
 * Two kinds of conflicts are checked:
 *   1. Resource-based conflicts – any event that uses the same resource(s).
 *   2. Team-based conflicts – any event assigned to the same team.
 *
 * An overlap is defined as:
 *   existing.start_time < newEndTime AND existing.end_time > newStartTime
 */
export interface ConflictDetectionParams {
  startTime: string; // ISO date-time string
  endTime: string;   // ISO date-time string
  resourceIds?: string[]; // Resource UUIDs linked to the event being created/updated
  teamId?: string | null; // Team UUID the event belongs to (can be null)
  locationId?: string | null; // Location UUID the event is scheduled at (can be null)
  excludeEventId?: string; // When updating an event, exclude itself from the check
}

export interface ConflictingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  conflict_reason: 'resource' | 'team' | 'location';
  conflict_identifier: string; // resourceId, teamId, or locationId causing the conflict
}

/**
 * Returns a list of conflicting events. The list will be empty when no conflict exists.
 */
export async function findConflictingEvents(params: ConflictDetectionParams): Promise<ConflictingEvent[]> {
  const {
    startTime,
    endTime,
    resourceIds,
    teamId,
    locationId,
    excludeEventId,
  } = params;

  const conflicts: ConflictingEvent[] = [];

  // 1. Resource-based conflicts
  if (resourceIds && resourceIds.length > 0) {
    const resQueryParts: string[] = [
      `SELECT DISTINCT e.id, e.title, e.start_time, e.end_time, e.event_type,` +
        ` 'resource' AS conflict_reason, er.resource_id AS conflict_identifier`,
      'FROM events e',
      'JOIN event_resources er ON er.event_id = e.id',
      'WHERE er.resource_id = ANY($1::uuid[])',
      'AND e.start_time < $2',
      'AND e.end_time > $3',
      "AND e.status != 'canceled'",
    ];
    const resParams: any[] = [resourceIds, endTime, startTime];
    if (excludeEventId) {
      resQueryParts.push('AND e.id <> $4');
      resParams.push(excludeEventId);
    }

    const resSql = resQueryParts.join(' ');
    const resResult = await db.query(resSql, resParams);
    conflicts.push(
      ...resResult.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        start_time: row.start_time,
        end_time: row.end_time,
        event_type: row.event_type,
        conflict_reason: 'resource' as const,
        conflict_identifier: row.conflict_identifier,
      }))
    );
  }

  // 2. Team-based conflicts
  if (teamId) {
    const teamQueryParts: string[] = [
      `SELECT e.id, e.title, e.start_time, e.end_time, e.event_type,` +
        ` 'team' AS conflict_reason, e.team_id AS conflict_identifier`,
      'FROM events e',
      'WHERE e.team_id = $1',
      'AND e.start_time < $2',
      'AND e.end_time > $3',
      "AND e.status != 'canceled'",
    ];
    const teamParams: any[] = [teamId, endTime, startTime];
    if (excludeEventId) {
      teamQueryParts.push('AND e.id <> $4');
      teamParams.push(excludeEventId);
    }

    const teamSql = teamQueryParts.join(' ');
    const teamResult = await db.query(teamSql, teamParams);
    conflicts.push(
      ...teamResult.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        start_time: row.start_time,
        end_time: row.end_time,
        event_type: row.event_type,
        conflict_reason: 'team' as const,
        conflict_identifier: row.conflict_identifier,
      }))
    );
  }

  // 3. Location-based conflicts
  if (locationId) {
    const locQueryParts: string[] = [
      `SELECT e.id, e.title, e.start_time, e.end_time, e.event_type,` +
        ` 'location' AS conflict_reason, e.location_id AS conflict_identifier`,
      'FROM events e',
      'WHERE e.location_id = $1',
      'AND e.start_time < $2',
      'AND e.end_time > $3',
      "AND e.status != 'canceled'",
    ];
    const locParams: any[] = [locationId, endTime, startTime];
    if (excludeEventId) {
      locQueryParts.push('AND e.id <> $4');
      locParams.push(excludeEventId);
    }

    const locSql = locQueryParts.join(' ');
    const locResult = await db.query(locSql, locParams);
    conflicts.push(
      ...locResult.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        start_time: row.start_time,
        end_time: row.end_time,
        event_type: row.event_type,
        conflict_reason: 'location' as const,
        conflict_identifier: row.conflict_identifier,
      }))
    );
  }

  return conflicts;
}

/** Convenience helper that simply returns true / false */
export async function hasConflicts(params: ConflictDetectionParams): Promise<boolean> {
  const results = await findConflictingEvents(params);
  return results.length > 0;
} 