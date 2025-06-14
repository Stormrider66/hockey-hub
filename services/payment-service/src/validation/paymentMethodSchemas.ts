import { z } from 'zod';
import { PaymentMethodType } from '@hockey-hub/types';

const uuid = () => z.string().uuid({ message: 'Invalid UUID' });

export const listPaymentMethodsSchema = z.object({});

export const createPaymentMethodSchema = z.object({
  body: z.object({
    providerId: z.string().min(3),
    type: z.nativeEnum(PaymentMethodType),
    billingName: z.string().optional(),
  }),
});

export const deletePaymentMethodSchema = z.object({
  params: z.object({
    methodId: uuid(),
  }),
});

export const setDefaultPaymentMethodSchema = z.object({
  params: z.object({
    methodId: uuid(),
  }),
});

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>['body']; 