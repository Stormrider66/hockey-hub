import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock the treatment plan item repository
jest.mock('../../src/repositories/treatmentPlanItemRepository', () => ({
  __esModule: true,
  findItemsByPlanId: jest.fn(),
  createTreatmentPlanItem: jest.fn(),
  updateTreatmentPlanItem: jest.fn(),
  deleteTreatmentPlanItem: jest.fn(),
}));

import * as Repository from '../../src/repositories/treatmentPlanItemRepository';
import treatmentPlanItemRoutes from '../../src/routes/treatmentPlanItemRoutes';

// Setup test app
const app = express();
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  // attach a mock user context if needed
  (req as any).user = { id: 'user-test', organizationId: 'org-test' };
  next();
});
app.use('/api/v1', treatmentPlanItemRoutes);

describe('Treatment Plan Item Routes Integration', () => {
  const now = new Date().toISOString();
  const baseItem = () => ({
    description: 'desc',
    frequency: 'freq',
    duration: 'dur',
    sets: 3,
    reps: 10,
    progressionCriteria: 'pc',
    exerciseId: 'e1',
    sequence: 1,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/plans/:planId/items returns items', async () => {
    const mockData = [
      { id: 'i1', treatment_plan_id: 'p1', description: 'desc', frequency: 'freq', duration: 'dur', sets: 3, reps: 10, progression_criteria: 'pc', exercise_id: 'e1', sequence: 1, created_at: now, updated_at: now },
    ];
    (Repository.findItemsByPlanId as jest.Mock).mockResolvedValueOnce(mockData);

    const res = await request(app)
      .get('/api/v1/plans/p1/items')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockData);
    expect(Repository.findItemsByPlanId).toHaveBeenCalledWith('p1');
  });

  it('POST /api/v1/plans/:planId/items returns 201 on success', async () => {
    const input = baseItem();
    const created = { id: 'i2', treatment_plan_id: 'p1', description: input.description, frequency: input.frequency, duration: input.duration, sets: input.sets, reps: input.reps, progression_criteria: input.progressionCriteria, exercise_id: input.exerciseId, sequence: input.sequence, created_at: now, updated_at: now };
    (Repository.createTreatmentPlanItem as jest.Mock).mockResolvedValueOnce(created);

    const res = await request(app)
      .post('/api/v1/plans/p1/items')
      .send(input)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(created);
    expect(Repository.createTreatmentPlanItem).toHaveBeenCalledWith(expect.objectContaining({ planId: 'p1', sequence: input.sequence }));
  });

  it('PUT /api/v1/items/:id returns 200 on update', async () => {
    const updated = { id: 'i1', treatment_plan_id: 'p1', description: 'desc2', frequency: 'freq2', duration: 'dur2', sets: 4, reps: 8, progression_criteria: 'pc2', exercise_id: 'e2', sequence: 2, created_at: now, updated_at: now };
    (Repository.updateTreatmentPlanItem as jest.Mock).mockResolvedValueOnce(updated);

    const res = await request(app)
      .put('/api/v1/items/i1')
      .send({ description: 'desc2' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(updated);
    expect(Repository.updateTreatmentPlanItem).toHaveBeenCalledWith('i1', expect.objectContaining({ description: 'desc2' }));
  });

  it('PUT /api/v1/items/:id returns 404 if not found', async () => {
    (Repository.updateTreatmentPlanItem as jest.Mock).mockResolvedValueOnce(null);
    await request(app)
      .put('/api/v1/items/nonexistent')
      .send({ description: 'desc2' })
      .expect(404);
  });

  it('DELETE /api/v1/items/:id returns 200 on success', async () => {
    (Repository.deleteTreatmentPlanItem as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .delete('/api/v1/items/i1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Treatment plan item deleted successfully');
  });

  it('DELETE /api/v1/items/:id returns 404 if not found', async () => {
    (Repository.deleteTreatmentPlanItem as jest.Mock).mockResolvedValueOnce(false);
    await request(app)
      .delete('/api/v1/items/unknown')
      .expect(404);
  });
}); 