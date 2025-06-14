import request from 'supertest';
import { setupTestApp } from './test-setup';
import express from 'express';

let app: express.Application;

beforeAll(async () => {
  app = await setupTestApp();
});

describe('GET /development-plans', () => {
  it('returns empty list with 200', async () => {
    const res = await request(app).get('/api/v1/development-plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /development-plans/:id', () => {
  it('returns 404 when plan not found', async () => {
    const res = await request(app).get('/api/v1/development-plans/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('GET /development-plans with filters', () => {
  it('returns 200 even with status filter', async () => {
    const res = await request(app).get('/api/v1/development-plans?status=draft');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /development-plans', () => {
  it('supports pagination query params', async () => {
    const res = await request(app).get('/api/v1/development-plans?page=2&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.limit).toBe(5);
  });

  it('returns 400 for invalid limit', async () => {
    const res = await request(app).get('/api/v1/development-plans?limit=0');
    expect(res.status).toBe(400);
  });
}); 