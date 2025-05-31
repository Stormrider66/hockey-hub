import { AppDataSource } from '../data-source';
import { Subscription } from '../entities/Subscription';
import { CreateSubscriptionInput, UpdateSubscriptionInput } from '../validation/subscriptionSchemas';
import { UUID } from '@hockey-hub/types';

const repo = () => AppDataSource.getRepository(Subscription);

export const listOrgSubscriptions = async (organizationId: UUID) => {
  return repo().find({ where: { organizationId } });
};

export const getSubscriptionById = async (subId: UUID) => {
  return repo().findOne({ where: { id: subId } });
};

export const createSubscription = async (organizationId: UUID, dto: CreateSubscriptionInput) => {
  const entity = repo().create({
    organizationId,
    status: 'ACTIVE', // default, will be satisfied by enum string
    cancelAtPeriodEnd: false,
    ...dto,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days; simple placeholder
    providerSubscriptionId: `mock_${Date.now()}`,
  } as any);
  return repo().save(entity);
};

export const updateSubscription = async (subId: UUID, updates: UpdateSubscriptionInput) => {
  await repo().update(subId, updates as any);
  return repo().findOne({ where: { id: subId } });
};

export const cancelSubscription = async (subId: UUID) => {
  await repo().update(subId, { cancelAtPeriodEnd: true });
  return repo().findOne({ where: { id: subId } });
}; 