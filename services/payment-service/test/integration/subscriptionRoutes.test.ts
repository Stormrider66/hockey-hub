import request from 'supertest';
import express from 'express';

import subscriptionRoutes from '../../src/routes/subscriptionRoutes';

// --- In-memory mock repository ---
const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

jest.mock('../../src/repositories/subscriptionRepository', () => {
  const store: any[] = [];
  return {
    listOrgSubscriptions: jest.fn(async (_orgId: string) => store),
    getSubscriptionById: jest.fn(async (id: string) => store.find(e => e.id === id) || null),
    createSubscription: jest.fn(async (_orgId: string, dto: any) => {
      const entity = { id: genId(), cancelAtPeriodEnd: false, status: 'active', ...dto };
      store.push(entity);
      return entity;
    }),
    updateSubscription: jest.fn(async (id: string, updates: any) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return null;
      store[idx] = { ...store[idx], ...updates };
      return store[idx];
    }),
    cancelSubscription: jest.fn(async (id: string) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return null;
      store[idx].cancelAtPeriodEnd = true;
      return store[idx];
    }),
  };
});

const app = express();
app.use(express.json());
// inject org header automatically
app.use((req, _res, next) => {
  req.headers['x-organization-id'] = 'org1';
  next();
});
app.use('/subscriptions', subscriptionRoutes);

// --- Tests ---

describe('Subscription routes', () => {
  let subId: string;

  it('creates subscription', async () => {
    const res = await request(app)
      .post('/subscriptions')
      .send({ planId: genId(), quantity: 2 })
      .expect(201);
    subId = res.body.id;
    expect(res.body.planId).toBeDefined();
  });

  it('lists subscriptions', async () => {
    const res = await request(app)
      .get('/subscriptions')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gets subscription by id', async () => {
    await request(app)
      .get(`/subscriptions/${subId}`)
      .expect(200);
  });

  it('updates subscription', async () => {
    await request(app)
      .put(`/subscriptions/${subId}`)
      .send({ quantity: 4 })
      .expect(200);
  });

  it('cancels subscription', async () => {
    const res = await request(app)
      .post(`/subscriptions/${subId}/cancel`)
      .expect(200);
    expect(res.body.cancelAtPeriodEnd).toBe(true);
  });
}); 