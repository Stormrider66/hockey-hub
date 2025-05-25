import request from 'supertest';
import express from 'express'; // Import express to type the app object
// Import test setup first so global mocks are applied
import { setupTestApp } from './test-setup';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppDataSource } = require('../../src/data-source');
import { v4 as uuidv4 } from 'uuid'; // For generating UUIDs

let app: express.Application;
let createdPlanId: string;

beforeAll(async () => {
    app = await setupTestApp();
});

afterAll(async () => {
    // Close data source connection
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});

// Simple health check test
describe('GET /health', () => {
    // ... existing code ...
});

// --- Development Plan Tests --- 
describe('Development Plan Routes (/api/v1/development-plans)', () => {
    // Define mock IDs needed for tests in this block
    const mockPlayerId = uuidv4();
    const mockSeasonId = uuidv4();
    const mockOrgId = 'mock-org-id'; // From mock auth

    describe('POST /', () => {
        it('should create a new development plan with valid data', async () => {
            const planData = {
                playerId: mockPlayerId,
                seasonId: mockSeasonId,
                title: 'Test Development Plan 2024',
            };

            const response = await request(app)
                .post('/api/v1/development-plans')
                .send(planData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.title).toBe(planData.title);
            expect(response.body.data.playerId).toBe(mockPlayerId);
            expect(response.body.data.seasonId).toBe(mockSeasonId);
            expect(response.body.data.organizationId).toBe(mockOrgId);
            expect(response.body.data.status).toBe('draft'); // Default status
            expect(response.body.data.createdByUserId).toBe('mock-user-id'); // From mock auth

            createdPlanId = response.body.data.id;
        });

        it('should return 400 Bad Request if required fields are missing', async () => {
             const planData = {
                // Missing playerId, seasonId, title
             };
            const response = await request(app)
                .post('/api/v1/development-plans')
                .send(planData);
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('VALIDATION_ERROR');
            expect(response.body.details).toBeDefined();
            // Check for specific missing field errors
            expect(response.body.details).toEqual(expect.arrayContaining([
                expect.objectContaining({ path: 'body.playerId' }),
                expect.objectContaining({ path: 'body.seasonId' }),
                expect.objectContaining({ path: 'body.title' }),
            ]));
        });

         it('should return 400 Bad Request for invalid UUID formats', async () => {
             const planData = {
                playerId: 'invalid-uuid',
                seasonId: 'invalid-uuid',
                title: 'Plan with Invalid IDs',
             };
            const response = await request(app)
                .post('/api/v1/development-plans')
                .send(planData);
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('VALIDATION_ERROR');
            expect(response.body.details).toEqual(expect.arrayContaining([
                expect.objectContaining({ path: 'body.playerId', message: 'Invalid Player ID format' }),
                expect.objectContaining({ path: 'body.seasonId', message: 'Invalid Season ID format' }),
            ]));
        });
    });

    // Remove the todo placeholder for create
    // it.todo('should create a new development plan');
    // ... remaining todos ... 
});

describe('List & Get created plan', () => {
  it('should return list including the new plan', async () => {
    const res = await request(app).get('/api/v1/development-plans');
    expect(res.status).toBe(200);
    expect(res.body.data.find((p:any)=>p.id===createdPlanId)).toBeDefined();
  });

  it('should fetch plan by id', async () => {
    const res = await request(app).get(`/api/v1/development-plans/${encodeURIComponent(createdPlanId)}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdPlanId);
  });
});

// --- Update & Delete plan ---
describe('Update & delete plan', () => {
  it('updates plan title', async () => {
    const res = await request(app).put(`/api/v1/development-plans/${createdPlanId}`).send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('adds, updates and deletes an item', async () => {
    // Add item
    const addRes = await request(app)
      .post(`/api/v1/development-plans/${createdPlanId}/items`)
      .send({ category: 'skating', focusArea: 'speed', description: 'Initial', status: 'not_started' });
    expect(addRes.status).toBe(201);
    const itemId = addRes.body.data.id;

    // Verify listing endpoint returns the new item
    const listItemsRes1 = await request(app).get(`/api/v1/development-plans/${createdPlanId}/items`);
    expect(listItemsRes1.status).toBe(200);
    expect(Array.isArray(listItemsRes1.body.data)).toBe(true);
    expect(listItemsRes1.body.data.find((i:any)=>i.id===itemId)).toBeDefined();

    // Update item
    const updRes = await request(app)
      .put(`/api/v1/development-plans/${createdPlanId}/items/${itemId}`)
      .send({ description: 'Updated desc' });
    expect(updRes.status).toBe(200);
    expect(updRes.body.data.description).toBe('Updated desc');

    // Delete item
    const delRes = await request(app).delete(`/api/v1/development-plans/${createdPlanId}/items/${itemId}`);
    expect(delRes.status).toBe(200);

    // Verify listing endpoint now returns no items
    const listItemsRes2 = await request(app).get(`/api/v1/development-plans/${createdPlanId}/items`);
    expect(listItemsRes2.status).toBe(200);
    expect(listItemsRes2.body.data.length).toBe(0);
  });

  it('deletes plan', async () => {
    const res = await request(app).delete(`/api/v1/development-plans/${createdPlanId}`);
    expect(res.status).toBe(200);
    // verify fetching returns 404
    const list = await request(app).get('/api/v1/development-plans');
    expect(list.body.data.length).toBe(0);
  });
}); 