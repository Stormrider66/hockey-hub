import { AppDataSource } from '../data-source';
import { PaymentMethod } from '../entities/PaymentMethod';
import { CreatePaymentMethodInput } from '../validation/paymentMethodSchemas';
import { UUID } from '@hockey-hub/types';

const repo = () => AppDataSource.getRepository(PaymentMethod);

export const listOrgPaymentMethods = async (organizationId: UUID) => {
  return repo().find({ where: { organizationId } });
};

export const createPaymentMethod = async (organizationId: UUID, dto: CreatePaymentMethodInput) => {
  // clear default flag if new method marked default
  if (dto.type && (dto as any).isDefault) {
    await repo().update({ organizationId }, { isDefault: false } as any);
  }
  const entity = repo().create({ organizationId, ...dto });
  return repo().save(entity);
};

export const deletePaymentMethod = async (methodId: UUID) => {
  const res = await repo().delete(methodId);
  return res.affected && res.affected > 0;
};

export const setDefaultPaymentMethod = async (organizationId: UUID, methodId: UUID) => {
  await repo().update({ organizationId }, { isDefault: false } as any);
  await repo().update(methodId, { isDefault: true } as any);
  return repo().findOne({ where: { id: methodId } });
}; 