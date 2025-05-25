import db from '../../src/db';
import {
  findPlansByInjuryId,
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  TreatmentPlanRow,
} from '../../src/repositories/treatmentPlanRepository';

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const mockedDb = db as unknown as { query: jest.Mock };

describe('treatmentPlanRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findPlansByInjuryId', () => {
    it('returns plans on successful query', async () => {
      const expected: TreatmentPlanRow[] = [
        { id: 'p1', injury_id: 'i1', phase: 'phase1', description: 'desc', expected_duration: 5, goals: 'g', precautions: null, created_by_user_id: 'u1', created_at: new Date(), updated_at: new Date() },
      ];
      mockedDb.query.mockResolvedValue({ rows: expected });

      const result = await findPlansByInjuryId('i1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'SELECT * FROM treatment_plans WHERE injury_id = $1 ORDER BY created_at DESC',
        ['i1']
      );
      expect(result).toEqual(expected);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(findPlansByInjuryId('i1')).rejects.toThrow(
        'Database error while fetching treatment plans.'
      );
    });
  });

  describe('createTreatmentPlan', () => {
    it('inserts and returns new plan', async () => {
      const input = { injuryId: 'i1', phase: 'phase1', description: 'desc', expectedDuration: 5, goals: 'g', precautions: 'p', createdByUserId: 'u1' };
      const returned: TreatmentPlanRow = { id: 'p1', injury_id: 'i1', phase: 'phase1', description: 'desc', expected_duration: 5, goals: 'g', precautions: 'p', created_by_user_id: 'u1', created_at: new Date(), updated_at: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [returned] });

      const result = await createTreatmentPlan(input);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(
        createTreatmentPlan({ injuryId: 'i1', phase: 'phase1', description: 'desc', expectedDuration: 5, goals: 'g', createdByUserId: 'u1' } as any)
      ).rejects.toThrow('Database error while creating treatment plan.');
    });
  });

  describe('updateTreatmentPlan', () => {
    it('throws when no fields provided', async () => {
      await expect(updateTreatmentPlan('p1', {})).rejects.toThrow(
        'No fields provided for treatment plan update.'
      );
    });

    it('updates and returns plan when fields provided', async () => {
      const updated: TreatmentPlanRow = { id: 'p1', injury_id: 'i1', phase: 'phase2', description: 'desc2', expected_duration: 6, goals: 'g2', precautions: 'p2', created_by_user_id: 'u1', created_at: new Date(), updated_at: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [updated] });

      const result = await updateTreatmentPlan('p1', { phase: 'phase2' });

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('returns null when no row updated', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await updateTreatmentPlan('p1', { phase: 'phase2' });
      expect(result).toBeNull();
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(updateTreatmentPlan('p1', { phase: 'phase2' })).rejects.toThrow(
        'Database error while updating treatment plan.'
      );
    });
  });

  describe('deleteTreatmentPlan', () => {
    it('returns true when rowCount > 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await deleteTreatmentPlan('p1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'DELETE FROM treatment_plans WHERE id = $1',
        ['p1']
      );
      expect(result).toBe(true);
    });

    it('returns false when rowCount = 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 0 });
      const result = await deleteTreatmentPlan('p1');
      expect(result).toBe(false);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(deleteTreatmentPlan('p1')).rejects.toThrow(
        'Database error while deleting treatment plan.'
      );
    });
  });
}); 