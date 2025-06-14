import request from 'supertest';
import { setupTestApp } from './test-setup';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

let app: express.Application;
let createdGoalId: string;

beforeAll(async () => {
  app = await setupTestApp();
});

describe('Team Goal End-to-End', () => {
  const mockTeamId = uuidv4();
  const mockSeasonId = uuidv4();

  it('creates a Team Goal', async () => {
    const res = await request(app)
      .post('/api/v1/team-goals')
      .send({
        teamId: mockTeamId,
        description: 'Win regional championship',
        seasonId: mockSeasonId,
        status: 'not_started',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.teamId).toBe(mockTeamId);

    createdGoalId = res.body.data.id;
  });

  it('lists goals and includes the created goal', async () => {
    const res = await request(app).get('/api/v1/team-goals');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === createdGoalId);
    expect(found).toBeDefined();
  });

  it('fetches the goal by id', async () => {
    const res = await request(app).get(`/api/v1/team-goals/${createdGoalId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdGoalId);
  });

  it('updates the goal status', async () => {
    const res = await request(app)
      .put(`/api/v1/team-goals/${createdGoalId}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('deletes the goal', async () => {
    const del = await request(app).delete(`/api/v1/team-goals/${createdGoalId}`);
    expect(del.status).toBe(200);

    const list = await request(app).get('/api/v1/team-goals');
    const exists = list.body.data.find((g: any) => g.id === createdGoalId);
    expect(exists).toBeUndefined();
  });

  it('returns 403 when authorization fails', async () => {
    // Spy on authzService.checkTeamAccess to return false just for this call
    const authz = require('../../src/services/authzService');
    (authz.checkTeamAccess as jest.Mock).mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/v1/team-goals')
      .send({
        teamId: uuidv4(),
        description: 'Should fail',
      });
    expect(res.status).toBe(403);
  });
}); 