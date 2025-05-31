// Stub data-source to avoid loading real entities
jest.mock('../../src/data-source', () => ({ AppDataSource: { getRepository: jest.fn() } }));
import { Request, Response, NextFunction } from 'express';
import { getCorrelation, postRegression } from '../../src/controllers/testAnalyticsController';
import { AppDataSource } from '../../src/data-source';

describe('TestAnalyticsController', () => {
  let findMock: jest.Mock;

  beforeEach(() => {
    findMock = jest.fn();
    jest.spyOn(AppDataSource, 'getRepository').mockReturnValue({ find: findMock } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCorrelation', () => {
    it('returns 400 if missing query parameters', async () => {
      const req = { query: {} } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await getCorrelation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    it('returns 400 if insufficient data or mismatched lengths', async () => {
      findMock
        .mockResolvedValueOnce([{ value: 1 }])
        .mockResolvedValueOnce([{ value: 1 }, { value: 2 }]);

      const req = { query: { testX: 't1', testY: 't2', playerId: 'p1' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await getCorrelation(req, res, next);

      expect(findMock).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INSUFFICIENT_DATA' }));
    });

    it('returns 200 and correlation data on success', async () => {
      const valuesX = [1, 2, 3];
      const valuesY = [2, 4, 6];
      findMock
        .mockResolvedValueOnce(valuesX.map(v => ({ value: v })))
        .mockResolvedValueOnce(valuesY.map(v => ({ value: v })));

      const req = { query: { testX: 't1', testY: 't2', playerId: 'p1' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await getCorrelation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: valuesX.length,
        r: 1,
        scatter: valuesX.map((x, i) => ({ x, y: valuesY[i] })),
      }));
    });
  });

  describe('postRegression', () => {
    it('returns 400 if invalid body parameters', async () => {
      const req = { body: {} } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await postRegression(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    it('returns 400 if insufficient data or mismatched lengths', async () => {
      findMock
        .mockResolvedValueOnce([{ value: 1 }, { value: 2 }])
        .mockResolvedValueOnce([{ value: 1 }]);

      const req = { body: { targetTest: 't1', predictors: ['p1'], playerId: 'p1' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await postRegression(req, res, next);

      expect(findMock).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INSUFFICIENT_DATA' }));
    });

    it('returns 200 with regression coefficients and R² on success', async () => {
      // Simple linear relation: y = 1 + 2*x
      const x = [1, 2];
      const y = [3, 5];
      findMock
        .mockResolvedValueOnce(y.map(v => ({ value: v })))
        .mockResolvedValueOnce(x.map(v => ({ value: v })));

      const req = { body: { targetTest: 't1', predictors: ['p1'], playerId: 'p1' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await postRegression(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        count: 2,
        coefficients: expect.any(Array),
        r2: 1,
      }));
      const [{ coefficients }] = (res.json as jest.Mock).mock.calls[0];
    });
  });
}); 