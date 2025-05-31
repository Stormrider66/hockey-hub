import request from 'supertest';
import { setupTestApp } from './test-setup';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

let app: express.Application;
let createdSeasonId: string;
const seasonData = {
  name: 'Season 2025',
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-12-31T23:59:59.000Z',
  // status: 'planning' // Status should be defaulted by schema/handler
};

beforeAll(async () => {
  app = await setupTestApp();
  // Create a season that subsequent tests can use
  const res = await request(app).post('/api/v1/seasons').send(seasonData);
  expect(res.status).toBe(201); // Ensure creation was successful
  expect(res.body.data.id).toBeDefined();
  createdSeasonId = res.body.data.id;
  console.log('Season created in beforeAll with ID:', createdSeasonId);
  // Verify the status directly after creation in beforeAll
  expect(res.body.data.status).toBe('planning'); 
});

afterAll(async () => {
  // Clean up the created season
  if (createdSeasonId) {
    await request(app).delete(`/api/v1/seasons/${createdSeasonId}`);
    console.log('Cleaned up season ID:', createdSeasonId);
  }
});

describe('Season Routes (/api/v1/seasons)', () => {
  describe('POST /', () => {
    it('can create another season successfully', async () => {
      const anotherSeasonData = {
        name: 'Season 2026',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
      };
      const res = await request(app)
        .post('/api/v1/seasons')
        .send(anotherSeasonData);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe(anotherSeasonData.name);
      expect(res.body.data.status).toBe('planning'); // Check status for this new season
      // Optionally delete this one too if it pollutes other tests, or ensure mock store handles it
      await request(app).delete(`/api/v1/seasons/${res.body.data.id}`);
    });

    it('returns 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/seasons')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details.find((e: any) => e.path === 'body.name')).toBeDefined();
      expect(res.body.details.find((e: any) => e.path === 'body.startDate')).toBeDefined();
      expect(res.body.details.find((e: any) => e.path === 'body.endDate')).toBeDefined();
    });

    it('returns 400 for invalid date', async () => {
      const res = await request(app)
        .post('/api/v1/seasons')
        .send({ name: 'S', startDate: 'invalid', endDate: '2025-12-01T00:00:00.000Z' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /', () => {
    it('returns list containing the main created season', async () => {
      console.log('Using season ID (GET /):', createdSeasonId);
      const res = await request(app).get('/api/v1/seasons');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.find((s: any) => s.id === createdSeasonId)).toBeDefined();
      expect(res.body.meta.pagination.page).toBe(1);
      expect(res.body.meta.pagination.limit).toBe(20);
    });
  });

  describe('GET /:id', () => {
    it('returns 200 for the main existing season', async () => {
      console.log('Using season ID (GET /:id):', createdSeasonId);
      const res = await request(app).get(`/api/v1/seasons/${createdSeasonId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdSeasonId);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await request(app).get(`/api/v1/seasons/${uuidv4()}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /:id', () => {
    it('updates the main seasons name', async () => {
      console.log('Using season ID (PUT /:id):', createdSeasonId);
      const res = await request(app)
        .put(`/api/v1/seasons/${createdSeasonId}`)
        .send({ name: 'Updated Season' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Season');
    });
  });

  describe('DELETE /:id', () => {
    it('cannot delete the main season as it is handled by afterAll', async () => {
        // This test might need to change. 
        // If we want to test DELETE, we should create a new season and delete that one.
        // The main `createdSeasonId` is deleted in `afterAll`.
        const tempSeasonData = {
            name: 'Season To Delete',
            startDate: '2027-01-01T00:00:00.000Z',
            endDate: '2027-12-31T23:59:59.000Z',
        };
        const createRes = await request(app).post('/api/v1/seasons').send(tempSeasonData);
        expect(createRes.status).toBe(201);
        const tempSeasonId = createRes.body.data.id;

        console.log('Using temp season ID for DELETE:', tempSeasonId);
        const res = await request(app).delete(`/api/v1/seasons/${tempSeasonId}`);
        expect(res.status).toBe(200);
        const getRes = await request(app).get(`/api/v1/seasons/${tempSeasonId}`);
        expect(getRes.status).toBe(404);
    });
  });
}); 