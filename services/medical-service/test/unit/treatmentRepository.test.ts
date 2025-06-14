import db from '../../src/db';
import { findTreatmentsByInjuryId, createTreatment, updateTreatment, deleteTreatment } from '../../src/repositories/treatmentRepository';

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const mockedDb = db as unknown as { query: jest.Mock };

describe('treatmentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findTreatmentsByInjuryId', () => {
    it('returns treatments on successful query', async () => {
      const expected = [{ id: 't1', injuryId: 'inj1', date: new Date(), treatmentType: 'X', notes: 'n', durationMinutes: 10, performedByUserId: 'user-test', createdAt: new Date() }];
      mockedDb.query.mockResolvedValue({ rows: expected });

      const result = await findTreatmentsByInjuryId('inj1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'SELECT * FROM treatments WHERE injury_id = $1 ORDER BY date DESC',
        ['inj1']
      );
      expect(result).toEqual(expected);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(findTreatmentsByInjuryId('inj1')).rejects.toThrow(
        'Database error while fetching treatments.'
      );
    });
  });

  describe('createTreatment', () => {
    it('inserts and returns new treatment', async () => {
      const input = { injuryId: 'inj1', date: new Date(), treatmentType: 'X', notes: 'n', durationMinutes: 10, performedByUserId: 'user-test' };
      const returned = { id: 't1', ...input, createdAt: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [returned] });

      const result = await createTreatment(input);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        createTreatment({ injuryId: 'inj1', date: new Date(), treatmentType: 'X', performedByUserId: 'user-test' } as any)
      ).rejects.toThrow('Database error while creating treatment.');
    });
  });

  describe('updateTreatment', () => {
    it('throws when no fields provided', async () => {
      await expect(updateTreatment('t1', {})).rejects.toThrow(
        'No fields provided for treatment update.'
      );
    });

    it('updates and returns treatment when fields provided', async () => {
      const updated = { id: 't1', injuryId: 'inj1', date: new Date(), treatmentType: 'Y', notes: 'n', durationMinutes: 20, performedByUserId: 'user-test', createdAt: new Date(), updatedAt: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [updated] });

      const result = await updateTreatment('t1', { treatmentType: 'Y' });

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('returns null when no row updated', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await updateTreatment('t1', { treatmentType: 'Y' });
      expect(result).toBeNull();
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        updateTreatment('t1', { treatmentType: 'Y' })
      ).rejects.toThrow('Database error while updating treatment.');
    });
  });

  describe('deleteTreatment', () => {
    it('returns true when rowCount > 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await deleteTreatment('t1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'DELETE FROM treatments WHERE id = $1',
        ['t1']
      );
      expect(result).toBe(true);
    });

    it('returns false when rowCount = 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 0 });
      const result = await deleteTreatment('t1');
      expect(result).toBe(false);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(deleteTreatment('t1')).rejects.toThrow(
        'Database error while deleting treatment.'
      );
    });
  });
}); 