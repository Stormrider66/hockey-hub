import db from '../../src/db';
import * as InjuryRepository from '../../src/repositories/injuryRepository';

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const mockedDb = db as unknown as { query: jest.Mock };

describe('injuryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findInjuries', () => {
    it('returns rows on successful query', async () => {
      const rows = [{ id: 'i1' }];
      mockedDb.query.mockResolvedValue({ rows });

      const result = await InjuryRepository.findInjuries({ organizationId: 'org1' } as any, 10, 0);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(rows);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        InjuryRepository.findInjuries({ organizationId: 'org1' } as any, 10, 0)
      ).rejects.toThrow('Database error while fetching injuries.');
    });
  });

  describe('countInjuries', () => {
    it('returns count on successful query', async () => {
      mockedDb.query.mockResolvedValue({ rows: [{ count: '5' }] });
      const result = await InjuryRepository.countInjuries({ organizationId: 'org1' } as any);
      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        InjuryRepository.countInjuries({ organizationId: 'org1' } as any)
      ).rejects.toThrow('Database error while counting injuries.');
    });
  });

  describe('findInjuryById', () => {
    it('returns injury row when found', async () => {
      const row = { id: 'i1' };
      mockedDb.query.mockResolvedValue({ rows: [row] });

      const result = await InjuryRepository.findInjuryById('i1', 'org1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'SELECT * FROM injuries WHERE id = $1 AND organization_id = $2',
        ['i1', 'org1']
      );
      expect(result).toEqual(row);
    });

    it('returns null when not found', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await InjuryRepository.findInjuryById('i1', 'org1');
      expect(result).toBeNull();
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        InjuryRepository.findInjuryById('i1', 'org1')
      ).rejects.toThrow('Database error while fetching injury by ID.');
    });
  });

  describe('createInjury', () => {
    it('inserts and returns new injury', async () => {
      const data = {
        playerId: 'p1',
        teamId: null,
        organizationId: 'org1',
        dateOccurred: new Date(),
        dateReported: new Date(),
        bodyPart: 'leg',
        injuryType: 'sprain',
        mechanism: null,
        severity: 'unknown',
        description: null,
        diagnosis: null,
        estimatedReturnDate: null,
        reportedByUserId: 'u1',
        status: 'active'
      } as any;
      const returned = { id: 'i1', ...data, createdAt: new Date(), updatedAt: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [returned] });

      const result = await InjuryRepository.createInjury(data);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        InjuryRepository.createInjury({} as any)
      ).rejects.toThrow('Database error while creating injury.');
    });
  });

  describe('updateInjury', () => {
    it('updates and returns injury when found', async () => {
      const updatedRow = { id: 'i1' };
      mockedDb.query.mockResolvedValue({ rows: [updatedRow] });

      const result = await InjuryRepository.updateInjury('i1', 'org1', { bodyPart: 'leg' });

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(updatedRow);
    });

    it('returns null when not found', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await InjuryRepository.updateInjury('i1', 'org1', { bodyPart: 'leg' });
      expect(result).toBeNull();
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        InjuryRepository.updateInjury('i1', 'org1', { bodyPart: 'leg' })
      ).rejects.toThrow('Database error while updating injury.');
    });
  });

  describe('deleteInjury', () => {
    it('returns true when rowCount > 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await InjuryRepository.deleteInjury('i1', 'org1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'DELETE FROM injuries WHERE id = $1 AND organization_id = $2',
        ['i1', 'org1']
      );
      expect(result).toBe(true);
    });

    it('returns false when rowCount = 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 0 });
      const result = await InjuryRepository.deleteInjury('i1', 'org1');
      expect(result).toBe(false);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        InjuryRepository.deleteInjury('i1', 'org1')
      ).rejects.toThrow('Database error while deleting injury.');
    });
  });
}); 