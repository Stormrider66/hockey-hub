import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock the treatment repository
jest.mock('../../src/repositories/treatmentRepository', () => ({
  __esModule: true,
  findTreatmentsByInjuryId: jest.fn(),
  createTreatment: jest.fn(),
  updateTreatment: jest.fn(),
  deleteTreatment: jest.fn(),
}));

import * as TreatmentRepository from '../../src/repositories/treatmentRepository';
import injuryRoutes from '../../src/routes/injuryRoutes';
import treatmentRoutes from '../../src/routes/treatmentRoutes';

// Setup test app
const app = express();
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  // Stub user context
  (req as any).user = { id: 'user-test', organizationId: 'org-test' };
  next();
});
app.use('/api/v1/injuries', injuryRoutes);
app.use('/api/v1/treatments', treatmentRoutes);

describe('Treatment Routes Integration', () => {
  const now = new Date().toISOString();
  const baseTreatment = () => ({
    date: new Date('2025-02-01').toISOString(),
    treatmentType: 'Physiotherapy',
    notes: 'Test note',
    durationMinutes: 30,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/injuries/:injuryId/treatments returns treatments', async () => {
    const mockData = [
      { id: 't1', injuryId: 'inj1', date: now, treatmentType: 'X', notes: 'n', durationMinutes: 10, performedByUserId: 'user-test', createdAt: now },
    ];
    (TreatmentRepository.findTreatmentsByInjuryId as jest.Mock).mockResolvedValueOnce(mockData);

    const res = await request(app)
      .get('/api/v1/injuries/inj1/treatments')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockData);
    expect(TreatmentRepository.findTreatmentsByInjuryId).toHaveBeenCalledWith('inj1');
  });

  it('POST /api/v1/injuries/:injuryId/treatments returns 201 on success', async () => {
    const input = baseTreatment();
    const created = { id: 't2', injuryId: 'inj1', date: input.date, treatmentType: input.treatmentType, notes: input.notes, durationMinutes: input.durationMinutes, performedByUserId: 'user-test', createdAt: now };
    (TreatmentRepository.createTreatment as jest.Mock).mockResolvedValueOnce(created);

    const res = await request(app)
      .post('/api/v1/injuries/inj1/treatments')
      .send(input)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(created);
    expect(TreatmentRepository.createTreatment).toHaveBeenCalled();
  });

  it('PUT /api/v1/treatments/:id returns 200 on update', async () => {
    const updated = { id: 't1', injuryId: 'inj1', date: now, treatmentType: 'Updated', notes: 'u', durationMinutes: 15, performedByUserId: 'user-test', createdAt: now, updatedAt: now };
    (TreatmentRepository.updateTreatment as jest.Mock).mockResolvedValueOnce(updated);

    const res = await request(app)
      .put('/api/v1/treatments/t1')
      .send({ treatmentType: 'Updated' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(updated);
    expect(TreatmentRepository.updateTreatment).toHaveBeenCalledWith('t1', expect.objectContaining({ treatmentType: 'Updated' }));
  });

  it('PUT /api/v1/treatments/:id returns 404 if not found', async () => {
    (TreatmentRepository.updateTreatment as jest.Mock).mockResolvedValueOnce(null);

    await request(app)
      .put('/api/v1/treatments/nonexistent')
      .send({ treatmentType: 'X' })
      .expect(404);
  });

  it('DELETE /api/v1/treatments/:id returns 200 on success', async () => {
    (TreatmentRepository.deleteTreatment as jest.Mock).mockResolvedValueOnce(true);

    const res = await request(app)
      .delete('/api/v1/treatments/t1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Treatment deleted successfully');
  });

  it('DELETE /api/v1/treatments/:id returns 404 if not found', async () => {
    (TreatmentRepository.deleteTreatment as jest.Mock).mockResolvedValueOnce(false);

    await request(app)
      .delete('/api/v1/treatments/unknown')
      .expect(404);
  });
}); 