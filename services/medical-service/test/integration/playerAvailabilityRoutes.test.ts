import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock the player availability repository
jest.mock('../../src/repositories/playerAvailabilityRepository', () => ({
  __esModule: true,
  getCurrentAvailability: jest.fn(),
  createAvailabilityStatus: jest.fn(),
}));

import * as Repository from '../../src/repositories/playerAvailabilityRepository';
import playerAvailabilityRoutes from '../../src/routes/playerAvailabilityRoutes';

// Setup test app
const app = express();
app.use(express.json());
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).user = { id: 'u-test', teamIds: ['t-test'] };
  next();
});
app.use('/api/v1', playerAvailabilityRoutes);

describe('Player Availability Routes Integration', () => {
  const nowDate = new Date().toISOString();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/players/:playerId/availability returns status', async () => {
    const mockStatus = { id: 'a1', player_id: 'p1', current_status: 'full', notes: null, effective_from: nowDate, expected_end_date: null, injury_id: null, updated_by_user_id: 'u-test', team_id: 't-test', created_at: nowDate, updated_at: nowDate };
    (Repository.getCurrentAvailability as jest.Mock).mockResolvedValueOnce(mockStatus);

    const res = await request(app)
      .get('/api/v1/players/p1/availability')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockStatus);
    expect(Repository.getCurrentAvailability).toHaveBeenCalledWith('p1');
  });

  it('GET returns 404 if not found', async () => {
    (Repository.getCurrentAvailability as jest.Mock).mockResolvedValueOnce(null);
    await request(app)
      .get('/api/v1/players/p1/availability')
      .expect(404);
  });

  it('POST /api/v1/players/:playerId/availability creates status', async () => {
    const input = { currentStatus: 'limited', notes: 'note', effectiveFrom: '2025-01-01', expectedEndDate: '2025-02-01', injuryId: 'i1' };
    const created = { id: 'a2', player_id: 'p1', current_status: 'limited', notes: 'note', effective_from: '2025-01-01', expected_end_date: '2025-02-01', injury_id: 'i1', updated_by_user_id: 'u-test', team_id: 't-test', created_at: '2025-01-01', updated_at: '2025-01-01' };
    (Repository.createAvailabilityStatus as jest.Mock).mockResolvedValueOnce(created as any);

    const res = await request(app)
      .post('/api/v1/players/p1/availability')
      .send(input)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(created);
    expect(Repository.createAvailabilityStatus).toHaveBeenCalledWith(expect.objectContaining({ playerId: 'p1', currentStatus: 'limited' }));
  });

  it('POST returns 400 on validation failure', async () => {
    await request(app)
      .post('/api/v1/players/p1/availability')
      .send({ })
      .expect(400);
  });
}); 