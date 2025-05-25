import request from 'supertest';
import { setupTestApp } from './test-setup';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

let app: express.Application;
let cycleId: string;

beforeAll(async () => {
  app = await setupTestApp();
});

describe('Training Cycle End-to-End', () => {
  // Need season and phase IDs to nest path
  const seasonId = uuidv4();
  const phaseId = uuidv4();

  it('creates cycle', async () => {
    // Mock season/phase existence not enforced in repository, so path works
    const res = await request(app)
      .post(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles`)
      .send({ name: 'Macro Cycle 1', startDate: new Date().toISOString(), endDate: new Date(Date.now()+86400000).toISOString() });
    expect(res.status).toBe(201);
    cycleId = res.body.data.id;
  });

  it('lists cycles', async () => {
    const res = await request(app).get(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles`);
    expect(res.status).toBe(200);
    expect(res.body.data.find((c:any)=>c.id===cycleId)).toBeDefined();
  });

  it('gets cycle by id', async () => {
    const res = await request(app).get(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles/${cycleId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(cycleId);
  });

  it('updates cycle', async () => {
    const res = await request(app).put(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles/${cycleId}`).send({ description:'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated');
  });

  it('deletes cycle', async () => {
    const del = await request(app).delete(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles/${cycleId}`);
    expect(del.status).toBe(200);
  });

  it('rejects overlapping cycle creation', async () => {
    // create base cycle again
    const base = await request(app)
      .post(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles`)
      .send({ name: 'Base', startDate: new Date().toISOString(), endDate: new Date(Date.now()+86400000).toISOString() });
    expect(base.status).toBe(201);

    // attempt overlapping
    const overlap = await request(app)
      .post(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles`)
      .send({ name: 'Overlap', startDate: new Date(Date.now()+3600000).toISOString(), endDate: new Date(Date.now()+86400000*2).toISOString() });
    expect(overlap.status).toBe(409);
  });

  it('rejects outside phase range', async () => {
    const bad = await request(app)
      .post(`/api/v1/seasons/${seasonId}/phases/${phaseId}/cycles`)
      .send({ name: 'OutOfRange', startDate: new Date(Date.now()-86400000*10).toISOString(), endDate: new Date().toISOString() });
    expect(bad.status).toBe(400);
  });
}); 