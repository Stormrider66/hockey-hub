import { z } from 'zod';
import { InvoiceStatus } from '@hockey-hub/types';

const uuid = () => z.string().uuid({ message: 'Invalid UUID' });

export const listInvoicesSchema = z.object({
  query: z.object({
    status: z.nativeEnum(InvoiceStatus).optional(),
  }).strict(),
});

export const getInvoiceSchema = z.object({
  params: z.object({
    invoiceId: uuid(),
  }),
});

export const payInvoiceSchema = z.object({
  params: z.object({
    invoiceId: uuid(),
  }),
  body: z.object({
    paymentMethodId: uuid().optional(), // default org default method
  }).partial(),
});

export type PayInvoiceInput = z.infer<typeof payInvoiceSchema>['body']; 