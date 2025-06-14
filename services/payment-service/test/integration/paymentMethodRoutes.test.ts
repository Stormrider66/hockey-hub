import request from 'supertest';
import express from 'express';

import pmRoutes from '../../src/routes/paymentMethodRoutes';

const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

jest.mock('../../src/repositories/paymentMethodRepository', () => {
  const store: any[] = [];
  return {
    listOrgPaymentMethods: jest.fn(async () => store),
    createPaymentMethod: jest.fn(async (_orgId: string, dto: any) => {
      const entity = { id: genId(), ...dto, isDefault: false };
      store.push(entity);
      return entity;
    }),
    deletePaymentMethod: jest.fn(async (id: string) => {
      const idx = store.findIndex(e => e.id === id);
      if (idx === -1) return false;
      store.splice(idx, 1);
      return true;
    }),
    setDefaultPaymentMethod: jest.fn(async (_orgId: string, id: string) => {
      store.forEach(e => e.isDefault = false);
      const ent = store.find(e => e.id === id);
      if (ent) ent.isDefault = true;
      return ent;
    }),
  };
});

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.headers['x-organization-id'] = 'org1';
  next();
});
app.use('/payment-methods', pmRoutes);

describe('Payment method routes', () => {
  let methodId: string;

  it('creates payment method', async () => {
    const res = await request(app)
      .post('/payment-methods')
      .send({ providerId: 'pm_123', type: 'card', billingName: 'Test User' })
      .expect(201);
    methodId = res.body.id;
  });

  it('lists methods', async () => {
    const res = await request(app).get('/payment-methods').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('set default', async () => {
    const res = await request(app).post(`/payment-methods/${methodId}/set-default`).expect(200);
    expect(res.body.isDefault).toBe(true);
  });

  it('delete method', async () => {
    await request(app).delete(`/payment-methods/${methodId}`).expect(200);
  });
}); 