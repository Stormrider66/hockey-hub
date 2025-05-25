import db from '../../src/db';
import {
  getCurrentAvailability,
  createAvailabilityStatus,
  PlayerAvailabilityRow,
} from '../../src/repositories/playerAvailabilityRepository';

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const mockedDb = db as unknown as { query: jest.Mock };

describe('playerAvailabilityRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentAvailability', () => {
    it('returns status on successful query', async () => {
      const expected: PlayerAvailabilityRow = {
        id: 'a1', player_id: 'p1', current_status: 'full', notes: null,
        effective_from: new Date('2025-01-01'), expected_end_date: null,
        injury_id: null, updated_by_user_id: 'u1', team_id: 't1',
        created_at: new Date(), updated_at: new Date(),
      };
      mockedDb.query.mockResolvedValue({ rows: [expected] });

      const result = await getCurrentAvailability('p1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM player_availability_status'),
        ['p1']
      );
      expect(result).toEqual(expected);
    });

    it('returns null when no rows', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await getCurrentAvailability('p1');
      expect(result).toBeNull();
    });

    it('throws error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(getCurrentAvailability('p1')).rejects.toThrow(
        'Database error while fetching availability status.'
      );
    });
  });

  describe('createAvailabilityStatus', () => {
    it('inserts and returns new status', async () => {
      const input = { playerId: 'p1', currentStatus: 'limited', notes: 'note', effectiveFrom: '2025-01-01', expectedEndDate: '2025-02-01', injuryId: 'i1', updatedByUserId: 'u1', teamId: 't1' };
      const returned: PlayerAvailabilityRow = {
        id: 'a2', player_id: 'p1', current_status: 'limited', notes: 'note',
        effective_from: new Date('2025-01-01'), expected_end_date: new Date('2025-02-01'),
        injury_id: 'i1', updated_by_user_id: 'u1', team_id: 't1',
        created_at: new Date(), updated_at: new Date(),
      };
      mockedDb.query.mockResolvedValue({ rows: [returned] });

      const result = await createAvailabilityStatus(input);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it('throws error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      const input = { playerId: 'p1', currentStatus: 'full', effectiveFrom: '2025-01-01', updatedByUserId: 'u1', teamId: 't1' } as any;
      await expect(createAvailabilityStatus(input)).rejects.toThrow(
        'Database error while creating availability status.'
      );
    });
  });
}); 