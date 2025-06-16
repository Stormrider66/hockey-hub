import { updateSubscription } from '../repositories/subscriptionRepository';
import { enqueueMessage } from '../repositories/outboxRepository';
import Stripe from 'stripe';
import { createBreaker } from '../lib/circuitBreaker';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', { apiVersion: '2022-11-15' } as any);

const stripeCancelSub = createBreaker(async (stripeSubId: string) => {
  return stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true });
});

export const runSubscriptionCancellationSaga = async (subscriptionId: string, stripeSubscriptionId: string, organizationId: string) => {
  console.log(`[CancelSaga] start for sub ${subscriptionId}`);
  // Step 1 – mark DB flag
  await updateSubscription(subscriptionId as any, { cancelAtPeriodEnd: true } as any);
  await enqueueMessage('subscription.cancellationScheduled', { subscriptionId, organizationId });

  try {
    // Step 2 – call Stripe via breaker
    await stripeCancelSub(stripeSubscriptionId);
    console.log('[CancelSaga] Stripe cancel scheduled');
  } catch (err) {
    console.error('[CancelSaga] Stripe call failed, rolling back', err);
    // Compensation: revert DB flag & notify
    await updateSubscription(subscriptionId as any, { cancelAtPeriodEnd: false } as any);
    await enqueueMessage('subscription.cancellationRollback', { subscriptionId, organizationId, reason: (err as Error).message });
    throw err;
  }

  console.log('[CancelSaga] completed ✅');
}; 