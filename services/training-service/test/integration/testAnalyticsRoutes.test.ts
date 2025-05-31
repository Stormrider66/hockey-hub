// @ts-nocheck
// Stub data-source to avoid entity imports
jest.mock('../../src/data-source', () => ({ AppDataSource: { getRepository: jest.fn() } }));
// Stub authentication middleware
jest.mock('../../src/middlewares/authMiddleware', () => ({
  requireAuth: (req: any, _res: any, next: any) => { next(); }
}));

import request from 'supertest';
import express, { Express } from 'express';
import { AppDataSource } from '../../src/data-source';
import testAnalyticsRoutes from '../../src/routes/testAnalyticsRoutes';

describe('TestAnalyticsRoutes Integration', () => {
  let findMock: jest.Mock;
  let app: Express;

  beforeEach(() => {
    findMock = jest.fn();
    // Mock repository to control returned data
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({ find: findMock } as any);

    app = express();
    app.use(express.json());
    app.use('/api/v1/tests/analytics', testAnalyticsRoutes);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/tests/analytics/correlation', () => {
    it('returns 400 if missing query params', async () => {
      const res = await request(app)
        .get('/api/v1/tests/analytics/correlation')
        .expect(400);
      expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
    });

    it('returns 400 if insufficient data or mismatched lengths', async () => {
      findMock
        .mockResolvedValueOnce([{ value: 1 }])
        .mockResolvedValueOnce([{ value: 1 }, { value: 2 }]);
      const res = await request(app)
        .get('/api/v1/tests/analytics/correlation?testX=t1&testY=t2&playerId=p1')
        .expect(400);
      expect(res.body).toMatchObject({ error: true, code: 'INSUFFICIENT_DATA' });
    });

    it('returns 200 with correct r and scatter on success', async () => {
      const valuesX = [1, 2, 3];
      const valuesY = [2, 4, 6];
      findMock
        .mockResolvedValueOnce(valuesX.map(v => ({ value: v })))
        .mockResolvedValueOnce(valuesY.map(v => ({ value: v })));
      const res = await request(app)
        .get('/api/v1/tests/analytics/correlation?testX=t1&testY=t2&playerId=p1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(valuesX.length);
      expect(res.body.r).toBeCloseTo(1);
      expect(res.body.scatter).toEqual(valuesX.map((x, i) => ({ x, y: valuesY[i] })));
    });
  });

  describe('POST /api/v1/tests/analytics/regression', () => {
    it('returns 400 if invalid body params', async () => {
      const res = await request(app)
        .post('/api/v1/tests/analytics/regression')
        .send({})
        .expect(400);
      expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
    });

    it('returns 400 if insufficient data or mismatched lengths', async () => {
      findMock
        .mockResolvedValueOnce([{ value: 1 }, { value: 2 }])
        .mockResolvedValueOnce([{ value: 1 }]);
      const res = await request(app)
        .post('/api/v1/tests/analytics/regression')
        .send({ targetTest: 't1', predictors: ['p1'], playerId: 'p1' })
        .expect(400);
      expect(res.body).toMatchObject({ error: true, code: 'INSUFFICIENT_DATA' });
    });

    it('returns 200 with coefficients and r2 on success', async () => {
      // y = 1 + 2*x
      const x = [1, 2];
      const y = [3, 5];
      findMock
        .mockResolvedValueOnce(y.map(v => ({ value: v })))
        .mockResolvedValueOnce(x.map(v => ({ value: v })));
      const res = await request(app)
        .post('/api/v1/tests/analytics/regression')
        .send({ targetTest: 't1', predictors: ['p1'], playerId: 'p1' })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(Array.isArray(res.body.coefficients)).toBe(true);
      expect(res.body.coefficients[0]).toBeCloseTo(1);
      expect(res.body.coefficients[1]).toBeCloseTo(2);
      expect(res.body.r2).toBeCloseTo(1);
    });
  });
}); 