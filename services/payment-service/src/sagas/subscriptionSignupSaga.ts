import { createPayment } from '../repositories/paymentRepository';
import { createSubscription } from '../repositories/subscriptionRepository';
import Stripe from 'stripe';
import { CurrencyCode } from '@hockey-hub/types';
import { createBreaker } from '../lib/circuitBreaker';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', { apiVersion: '2022-11-15' } as any);

// Wrap stripe calls with circuit breaker
const stripeCreatePaymentIntent = createBreaker(async (amount: number, currency: string) => {
  return stripe.paymentIntents.create({ amount, currency });
});

interface SignupSagaInput {
  organizationId: string;
  planId: string;
  quantity: number;
  currency: CurrencyCode;
}

const genId = () => Math.random().toString(36).substring(2,10) + Date.now().toString(36);

export const runSubscriptionSignupSaga = async (input: SignupSagaInput) => {
  const sagaId = genId();
  console.log(`[SignupSaga:${sagaId}] started`);

  try {
    // Step 1: create payment intent
    const amount = 9900 * input.quantity; // placeholder price
    const pi = await stripeCreatePaymentIntent(amount, input.currency.toLowerCase());
    console.log(`[SignupSaga:${sagaId}] Stripe PaymentIntent ${pi.id} created`);

    // Step 2: create subscription record in DB
    const sub = await createSubscription(input.organizationId as any, {
      planId: input.planId as any,
      quantity: input.quantity,
      paymentMethodId: undefined,
    });
    console.log(`[SignupSaga:${sagaId}] Subscription ${(sub as any).id} saved`);

    // Step 3: record payment placeholder (to be confirmed by webhook)
    await createPayment({
      organizationId: input.organizationId as any,
      subscriptionId: (sub as any).id as any,
      amount,
      currency: input.currency,
      providerPaymentId: pi.id,
      paidAt: new Date().toISOString(),
    } as any);

    console.log(`[SignupSaga:${sagaId}] completed ✅`);
    return { subscriptionId: (sub as any).id, paymentIntentClientSecret: pi.client_secret };
  } catch (err) {
    console.error(`[SignupSaga:${sagaId}] failed:`, err);
    // TODO: compensation steps if needed
    throw err;
  }
}; 