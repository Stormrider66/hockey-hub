import request from 'supertest';
import { setupTestApp } from './test-setup';
import express from 'express';

let app: express.Application;
let createdSeasonId: string;
let createdPhaseId: string;

beforeAll(async () => {
  app = await setupTestApp();
});

describe('Season Phase Routes (/api/v1/seasons/:seasonId/phases)', () => {
  describe('POST /', () => {
    it('creates phase with valid data', async () => {
      const seasonRes = await request(app)
        .post('/api/v1/seasons')
        .send({
          name: 'Test Season',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-12-31T23:59:59.000Z',
        });
      expect(seasonRes.status).toBe(201);
      createdSeasonId = seasonRes.body.data.id;

      const phaseData = {
        name: 'Pre Season',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-02-01T00:00:00.000Z',
        type: 'pre_season',
      };
      const res = await request(app)
        .post(`/api/v1/seasons/${createdSeasonId}/phases`)
        .send(phaseData);
      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe(phaseData.name);
      createdPhaseId = res.body.data.id;
    });

    it('returns 400 for missing fields', async () => {
      const res = await request(app)
        .post(`/api/v1/seasons/${createdSeasonId}/phases`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(
        res.body.details.find((e: any) => e.path.includes('body.name'))
      ).toBeDefined();
      expect(
        res.body.details.find((e: any) => e.path.includes('body.startDate'))
      ).toBeDefined();
      expect(
        res.body.details.find((e: any) => e.path.includes('body.endDate'))
      ).toBeDefined();
    });

    it('returns 400 when phase dates outside season range', async () => {
      const phaseData = {
        name: 'Out of Range',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-02-01T00:00:00.000Z',
        type: 'pre_season',
      };
      const res = await request(app)
        .post(`/api/v1/seasons/${createdSeasonId}/phases`)
        .send(phaseData);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 for overlapping phases', async () => {
      const phaseData1 = {
        name: 'Regular Season',
        startDate: '2025-02-02T00:00:00.000Z',
        endDate: '2025-03-01T00:00:00.000Z',
        type: 'regular_season',
      };
      const res1 = await request(app)
        .post(`/api/v1/seasons/${createdSeasonId}/phases`)
        .send(phaseData1);
      expect(res1.status).toBe(201);

      const overlappingPhase = {
        name: 'Overlap',
        startDate: '2025-02-15T00:00:00.000Z',
        endDate: '2025-02-20T00:00:00.000Z',
        type: 'regular_season',
      };
      const res2 = await request(app)
        .post(`/api/v1/seasons/${createdSeasonId}/phases`)
        .send(overlappingPhase);
      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('CONFLICT');
    });
  });

  describe('GET /', () => {
    it('returns list containing created phases', async () => {
      const res = await request(app)
        .get(`/api/v1/seasons/${createdSeasonId}/phases`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.find((p: any) => p.id === createdPhaseId)).toBeDefined();
    });
  });

  describe('PUT /:phaseId', () => {
    it('updates phase name', async () => {
      const res = await request(app)
        .put(`/api/v1/seasons/${createdSeasonId}/phases/${createdPhaseId}`)
        .send({ name: 'Updated Phase Name' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Phase Name');
    });
  });

  describe('DELETE /:phaseId', () => {
    it('deletes phase', async () => {
      const res = await request(app)
        .delete(`/api/v1/seasons/${createdSeasonId}/phases/${createdPhaseId}`);
      expect(res.status).toBe(200);

      const listRes = await request(app)
        .get(`/api/v1/seasons/${createdSeasonId}/phases`);
      expect(listRes.status).toBe(200);
      expect(
        listRes.body.data.find((p: any) => p.id === createdPhaseId)
      ).toBeUndefined();
    });
  });
});