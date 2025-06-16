import { findConflictingEvents, ConflictDetectionParams } from '../../src/utils/conflictDetection';
import db from '../../src/db';

// Jest needs to access the mocked path relative to this test file's location.
jest.mock('../../src/db', () => {
  return {
    __esModule: true,
    default: {
      query: jest.fn(),
    },
  };
});

const mockQuery = (db as unknown as { query: jest.Mock }).query;

describe('findConflictingEvents (unit)', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns empty array when no conflict criteria provided', async () => {
    const params: ConflictDetectionParams = {
      startTime: '2025-01-01T10:00:00Z',
      endTime: '2025-01-01T11:00:00Z',
    };

    const result = await findConflictingEvents(params);

    expect(mockQuery).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('detects resource-based conflicts', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'event-1',
          title: 'Existing Event',
          start_time: '2025-01-01T09:00:00Z',
          end_time: '2025-01-01T11:30:00Z',
          event_type: 'game',
          conflict_identifier: 'resource-1',
        },
      ],
    });

    const params: ConflictDetectionParams = {
      startTime: '2025-01-01T10:00:00Z',
      endTime: '2025-01-01T11:00:00Z',
      resourceIds: ['resource-1'],
    };

    const result = await findConflictingEvents(params);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({
      conflict_reason: 'resource',
      conflict_identifier: 'resource-1',
    });
  });

  it('detects team-based conflicts', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'event-2',
          title: 'Team Practice',
          start_time: '2025-01-02T09:00:00Z',
          end_time: '2025-01-02T11:00:00Z',
          event_type: 'practice',
          conflict_identifier: 'team-1',
        },
      ],
    });

    const params: ConflictDetectionParams = {
      startTime: '2025-01-02T10:00:00Z',
      endTime: '2025-01-02T10:30:00Z',
      teamId: 'team-1',
    };

    const result = await findConflictingEvents(params);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({
      conflict_reason: 'team',
      conflict_identifier: 'team-1',
    });
  });

  it('detects location-based conflicts', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'event-3',
          title: 'Arena Slot',
          start_time: '2025-01-03T08:00:00Z',
          end_time: '2025-01-03T10:00:00Z',
          event_type: 'ice_training',
          conflict_identifier: 'location-1',
        },
      ],
    });

    const params: ConflictDetectionParams = {
      startTime: '2025-01-03T09:00:00Z',
      endTime: '2025-01-03T09:30:00Z',
      locationId: 'location-1',
    };

    const result = await findConflictingEvents(params);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({
      conflict_reason: 'location',
      conflict_identifier: 'location-1',
    });
  });
});
