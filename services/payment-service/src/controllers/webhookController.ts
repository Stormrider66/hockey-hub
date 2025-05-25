import { Request, Response } from 'express';
import Stripe from 'stripe';
import { markInvoicePaid } from '../repositories/invoiceRepository';
import { createPayment } from '../repositories/paymentRepository';
import { CurrencyCode } from '@hockey-hub/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', { apiVersion: '2022-11-15' } as any);

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

  let event: Stripe.Event;

  if (process.env.NODE_ENV === 'test') {
    // Skip signature verification in tests – assume body already parsed as JSON
    event = req.body as any;
  } else {
    if (!sig) return res.status(400).send('Missing stripe-signature header');
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[Stripe] Webhook signature verification failed:', (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
  }

  // TODO: handle different event types
  switch (event.type) {
    case 'invoice.paid':
      console.log('[Stripe] invoice.paid received');
      // Persist invoice status
      const invoiceObj = event.data.object as Stripe.Invoice;
      if (invoiceObj.id && invoiceObj.customer) {
        await markInvoicePaid(invoiceObj.id as any);
        if (invoiceObj.payment_intent && invoiceObj.amount_paid) {
          await createPayment({
            invoiceId: invoiceObj.id as any,
            organizationId: 'org1' as any, // TODO map organization
            amount: invoiceObj.amount_paid,
            currency: (invoiceObj.currency?.toUpperCase() || 'USD') as CurrencyCode,
            providerPaymentId: typeof invoiceObj.payment_intent === 'string' ? invoiceObj.payment_intent : invoiceObj.payment_intent.id,
            paidAt: new Date().toISOString(),
            description: 'Stripe invoice.paid',
          });
        }
      }
      break;
    case 'payment_intent.succeeded':
      console.log('[Stripe] payment_intent.succeeded received');
      break;
    default:
      console.log(`[Stripe] Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}; 