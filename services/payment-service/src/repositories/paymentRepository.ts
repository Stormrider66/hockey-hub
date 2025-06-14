import { AppDataSource } from '../data-source';
import { Payment } from '../entities/Payment';
import { PaymentStatus, CurrencyCode, UUID, ISODateString } from '@hockey-hub/types';

const repo = () => AppDataSource.getRepository(Payment);

interface CreatePaymentOpts {
  invoiceId?: UUID | null;
  subscriptionId?: UUID | null;
  organizationId: UUID;
  userId?: UUID | null;
  amount: number;
  currency: CurrencyCode;
  providerPaymentId: string;
  providerPaymentMethodId?: string | null;
  paidAt: ISODateString;
  description?: string | null;
}

export const createPayment = async (opts: CreatePaymentOpts) => {
  const entity = repo().create({
    ...opts,
    status: 'completed' as PaymentStatus,
  } as any);
  return repo().save(entity);
}; 