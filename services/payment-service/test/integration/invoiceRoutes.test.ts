import request from 'supertest';
import express from 'express';

import invoiceRoutes from '../../src/routes/invoiceRoutes';

const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

jest.mock('../../src/repositories/invoiceRepository', () => {
  const store: any[] = [];
  return {
    listOrgInvoices: jest.fn(async (_orgId: string) => store),
    getInvoiceById: jest.fn(async (id: string) => store.find(e => e.id === id) || null),
    markInvoicePaid: jest.fn(async (id: string) => {
      const inv = store.find(e => e.id === id);
      if (!inv) return null;
      inv.status = 'paid';
      return inv;
    }),
  };
});

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.headers['x-organization-id'] = 'org1';
  next();
});
app.use('/invoices', invoiceRoutes);

// Tests

describe('Invoice routes', () => {
  let invoiceId: string;

  it('lists invoices (empty)', async () => {
    await request(app).get('/invoices').expect(200);
  });

  it('adds fake invoice to mock store', () => {
    const repo = require('../../src/repositories/invoiceRepository');
    invoiceId = genId();
    repo.listOrgInvoices.mockResolvedValue([{ id: invoiceId, status: 'sent' }]);
    repo.getInvoiceById.mockResolvedValue({ id: invoiceId, status: 'sent' });
  });

  it('gets invoice by id', async () => {
    await request(app).get(`/invoices/${invoiceId}`).expect(200);
  });

  it('pays invoice', async () => {
    await request(app).post(`/invoices/${invoiceId}/pay`).expect(200);
  });
}); 