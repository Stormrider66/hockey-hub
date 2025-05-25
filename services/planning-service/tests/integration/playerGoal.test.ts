import request from 'supertest';
import { setupTestApp } from './test-setup';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

let app: express.Application;
let createdPlayerGoalId: string;

beforeAll(async () => {
  app = await setupTestApp();
});

describe('Player Goal End-to-End', () => {
  const mockPlayerId = uuidv4();
  const mockSeasonId = uuidv4();

  it('creates a Player Goal', async () => {
    const res = await request(app)
      .post('/api/v1/player-goals')
      .send({
        playerId: mockPlayerId,
        description: 'Improve skating speed by 10%',
        seasonId: mockSeasonId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdPlayerGoalId = res.body.data.id;
  });

  it('lists player goals', async () => {
    const res = await request(app).get('/api/v1/player-goals');
    expect(res.status).toBe(200);
    const found = res.body.data.find((g: any) => g.id === createdPlayerGoalId);
    expect(found).toBeDefined();
  });

  it('gets goal by id', async () => {
    const res = await request(app).get(`/api/v1/player-goals/${createdPlayerGoalId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdPlayerGoalId);
  });

  it('updates goal description', async () => {
    const res = await request(app)
      .put(`/api/v1/player-goals/${createdPlayerGoalId}`)
      .send({ description: 'Updated skating speed goal' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated skating speed goal');
  });

  it('deletes the goal', async () => {
    const del = await request(app).delete(`/api/v1/player-goals/${createdPlayerGoalId}`);
    expect(del.status).toBe(200);

    const list = await request(app).get('/api/v1/player-goals');
    const exists = list.body.data.find((g: any) => g.id === createdPlayerGoalId);
    expect(exists).toBeUndefined();
  });
}); 