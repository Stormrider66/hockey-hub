import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock the treatment plan repository
jest.mock('../../src/repositories/treatmentPlanRepository', () => ({
  __esModule: true,
  findPlansByInjuryId: jest.fn(),
  createTreatmentPlan: jest.fn(),
  updateTreatmentPlan: jest.fn(),
  deleteTreatmentPlan: jest.fn(),
}));

import * as TreatmentPlanRepository from '../../src/repositories/treatmentPlanRepository';
import treatmentPlanRoutes from '../../src/routes/treatmentPlanRoutes';

// Setup test app
const app = express();
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).user = { id: 'user-test', organizationId: 'org-test' };
  next();
});
app.use('/api/v1', treatmentPlanRoutes);

describe('Treatment Plan Routes Integration', () => {
  const now = new Date().toISOString();
  const basePlan = () => ({
    phase: 'phase1',
    description: 'desc',
    expectedDuration: 5,
    goals: 'g',
    precautions: 'p',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/injuries/:injuryId/plans returns plans', async () => {
    const mockData = [
      { id: 'p1', injury_id: 'i1', phase: 'phase1', description: 'desc', expected_duration: 5, goals: 'g', precautions: 'p', created_by_user_id: 'user-test', created_at: now, updated_at: now },
    ];
    (TreatmentPlanRepository.findPlansByInjuryId as jest.Mock).mockResolvedValueOnce(mockData);

    const res = await request(app)
      .get('/api/v1/injuries/i1/plans')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockData);
    expect(TreatmentPlanRepository.findPlansByInjuryId).toHaveBeenCalledWith('i1');
  });

  it('POST /api/v1/injuries/:injuryId/plans returns 201 on success', async () => {
    const input = basePlan();
    const created = { id: 'p2', injury_id: 'i1', phase: input.phase, description: input.description, expected_duration: input.expectedDuration, goals: input.goals, precautions: input.precautions, created_by_user_id: 'user-test', created_at: now, updated_at: now };
    (TreatmentPlanRepository.createTreatmentPlan as jest.Mock).mockResolvedValueOnce(created);

    const res = await request(app)
      .post('/api/v1/injuries/i1/plans')
      .send(input)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(created);
    expect(TreatmentPlanRepository.createTreatmentPlan).toHaveBeenCalled();
  });

  it('PUT /api/v1/plans/:id returns 200 on update', async () => {
    const updated = { id: 'p1', injury_id: 'i1', phase: 'phase2', description: 'desc2', expected_duration: 6, goals: 'g2', precautions: 'p2', created_by_user_id: 'user-test', created_at: now, updated_at: now };
    (TreatmentPlanRepository.updateTreatmentPlan as jest.Mock).mockResolvedValueOnce(updated);

    const res = await request(app)
      .put('/api/v1/plans/p1')
      .send({ phase: 'phase2' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(updated);
    expect(TreatmentPlanRepository.updateTreatmentPlan).toHaveBeenCalledWith('p1', expect.objectContaining({ phase: 'phase2' }));
  });

  it('PUT /api/v1/plans/:id returns 404 if not found', async () => {
    (TreatmentPlanRepository.updateTreatmentPlan as jest.Mock).mockResolvedValueOnce(null);
    await request(app)
      .put('/api/v1/plans/nonexistent')
      .send({ phase: 'phase2' })
      .expect(404);
  });

  it('DELETE /api/v1/plans/:id returns 200 on success', async () => {
    (TreatmentPlanRepository.deleteTreatmentPlan as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .delete('/api/v1/plans/p1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Treatment plan deleted successfully');
  });

  it('DELETE /api/v1/plans/:id returns 404 if not found', async () => {
    (TreatmentPlanRepository.deleteTreatmentPlan as jest.Mock).mockResolvedValueOnce(false);

    await request(app)
      .delete('/api/v1/plans/unknown')
      .expect(404);
  });
}); 