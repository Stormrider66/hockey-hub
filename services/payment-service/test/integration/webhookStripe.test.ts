import request from 'supertest';
import express from 'express';

jest.mock('../../src/repositories/invoiceRepository', () => ({
  markInvoicePaid: jest.fn(async () => ({})),
}));

jest.mock('../../src/repositories/paymentRepository', () => ({
  createPayment: jest.fn(async () => ({})),
}));

import { stripeWebhookHandler } from '../../src/controllers/webhookController';

// mount raw route similar to production
const app = express();
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

describe('Stripe webhook', () => {
  it('returns 200 for test event', async () => {
    const payload = {
      id: 'evt_test_123',
      type: 'invoice.paid',
      data: { object: { id: 'in_123' } },
    };
    await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload))
      .expect(200);
  });
}); 