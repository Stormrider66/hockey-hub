import db from '../../src/db';
import {
  findItemsByPlanId,
  createTreatmentPlanItem,
  updateTreatmentPlanItem,
  deleteTreatmentPlanItem,
  TreatmentPlanItemRow,
} from '../../src/repositories/treatmentPlanItemRepository';

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const mockedDb = db as unknown as { query: jest.Mock };

describe('treatmentPlanItemRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findItemsByPlanId', () => {
    it('returns items on successful query', async () => {
      const expected: TreatmentPlanItemRow[] = [
        { id: 'i1', treatment_plan_id: 'p1', description: 'desc', frequency: 'freq', duration: 'dur', sets: 3, reps: 10, progression_criteria: 'pc', exercise_id: 'e1', sequence: 1, created_at: new Date(), updated_at: new Date() },
      ];
      mockedDb.query.mockResolvedValue({ rows: expected });

      const result = await findItemsByPlanId('p1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'SELECT * FROM treatment_plan_items WHERE treatment_plan_id = $1 ORDER BY sequence',
        ['p1']
      );
      expect(result).toEqual(expected);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(findItemsByPlanId('p1')).rejects.toThrow(
        'Database error while fetching treatment plan items.'
      );
    });
  });

  describe('createTreatmentPlanItem', () => {
    it('inserts and returns new item', async () => {
      const input = { planId: 'p1', description: 'desc', frequency: 'freq', duration: 'dur', sets: 3, reps: 10, progressionCriteria: 'pc', exerciseId: 'e1', sequence: 1 };
      const returned: TreatmentPlanItemRow = { id: 'i2', treatment_plan_id: 'p1', description: 'desc', frequency: 'freq', duration: 'dur', sets: 3, reps: 10, progression_criteria: 'pc', exercise_id: 'e1', sequence: 1, created_at: new Date(), updated_at: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [returned] });

      const result = await createTreatmentPlanItem(input);

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(returned);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      const input = { planId: 'p1', description: 'desc', frequency: 'freq', duration: 'dur', sequence: 1 } as any;
      await expect(createTreatmentPlanItem(input)).rejects.toThrow(
        'Database error while creating treatment plan item.'
      );
    });
  });

  describe('updateTreatmentPlanItem', () => {
    it('throws when no fields provided', async () => {
      await expect(updateTreatmentPlanItem('i1', {})).rejects.toThrow(
        'No fields provided for treatment plan item update.'
      );
    });

    it('updates and returns item when fields provided', async () => {
      const updated: TreatmentPlanItemRow = { id: 'i1', treatment_plan_id: 'p1', description: 'desc2', frequency: 'freq2', duration: 'dur2', sets: 4, reps: 8, progression_criteria: 'pc2', exercise_id: 'e2', sequence: 2, created_at: new Date(), updated_at: new Date() };
      mockedDb.query.mockResolvedValue({ rows: [updated] });

      const result = await updateTreatmentPlanItem('i1', { description: 'desc2' });

      expect(mockedDb.query).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('returns null when no row updated', async () => {
      mockedDb.query.mockResolvedValue({ rows: [] });
      const result = await updateTreatmentPlanItem('i1', { description: 'desc2' });
      expect(result).toBeNull();
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(updateTreatmentPlanItem('i1', { description: 'desc2' })).rejects.toThrow(
        'Database error while updating treatment plan item.'
      );
    });
  });

  describe('deleteTreatmentPlanItem', () => {
    it('returns true when rowCount > 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await deleteTreatmentPlanItem('i1');

      expect(mockedDb.query).toHaveBeenCalledWith(
        'DELETE FROM treatment_plan_items WHERE id = $1',
        ['i1']
      );
      expect(result).toBe(true);
    });

    it('returns false when rowCount = 0', async () => {
      mockedDb.query.mockResolvedValue({ rowCount: 0 });
      const result = await deleteTreatmentPlanItem('i1');
      expect(result).toBe(false);
    });

    it('throws generic error on failure', async () => {
      mockedDb.query.mockRejectedValue(new Error('fail'));
      await expect(deleteTreatmentPlanItem('i1')).rejects.toThrow(
        'Database error while deleting treatment plan item.'
      );
    });
  });
}); 