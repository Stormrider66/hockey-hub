import { subscribe } from '../lib/eventBus';
import { getRepository } from 'typeorm';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { Subscription } from '../entities/Subscription';
import { CurrencyCode } from '@hockey-hub/types';

export const startOrgConsumer = () => {
  subscribe('organization.*', (msg: any) => {
    console.log('[Payment Service] organization event', msg);
  });

  subscribe('organization.provisioned', async (msg: { orgId: string; name?: string }) => {
    console.log('[Payment Service] organization provisioned – activating free trial for', msg.orgId);
    await handleOrgProvisioned(msg.orgId);
  });
};

export const handleOrgProvisioned = async (orgId: string) => {
  const planRepo = getRepository(SubscriptionPlan);
  const subRepo = getRepository(Subscription);

  // 1. Ensure Free Trial plan exists
  let plan: any = await planRepo.findOne({ where: { name: 'Free Trial' } });
  if (!plan) {
    plan = planRepo.create({
      name: 'Free Trial',
      description: '30-day free trial plan',
      price: 0,
      currency: CurrencyCode.SEK,
      billingInterval: 'month',
      features: ['basic_usage'],
      isActive: true,
    } as any);
    plan = await planRepo.save(plan as any);
    console.log('[Payment Service] Free Trial plan created');
  }

  // 2. If organization already has a subscription, skip
  const existing = await subRepo.findOne({ where: { organizationId: orgId as any } });
  if (existing) {
    console.log('[Payment Service] Org already has subscription; skipping');
    return;
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const sub = subRepo.create({
    organizationId: orgId as any,
    planId: (plan as any).id,
    status: 'active',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: trialEnd.toISOString(),
    trialEndsAt: trialEnd.toISOString(),
    cancelAtPeriodEnd: false,
    providerSubscriptionId: `trial_${Date.now()}`,
  } as any);

  await subRepo.save(sub);
  console.log('[Payment Service] Free trial subscription created for org', orgId);
}; 