export interface ConflictDetectionParams {
  startTime: string;
  endTime: string;
  resourceIds?: string[];
  teamId?: string | null;
  excludeEventId?: string;
}

export interface ConflictingEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: string;
  conflict_reason: 'resource' | 'team';
  conflict_identifier: string;
}

export async function findConflictingEvents(_params: ConflictDetectionParams): Promise<ConflictingEvent[]> {
  // In tests we assume no conflicting events exist.
  return [];
}

export async function hasConflicts(_params: ConflictDetectionParams): Promise<boolean> {
  return false;
} 