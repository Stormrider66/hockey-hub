import { z } from 'zod';
import { SubscriptionStatus } from '@hockey-hub/types';

// --- Shared ---
const uuid = () => z.string().uuid({ message: 'Invalid UUID' });

// List query (none for now) but keep placeholder
export const listSubscriptionsSchema = z.object({
  query: z.object({}).strict(),
  body: z.any().optional(),
  params: z.any().optional(),
});

// GET /:subId
export const getSubscriptionSchema = z.object({
  params: z.object({
    subId: uuid(),
  }),
});

// POST create
export const createSubscriptionSchema = z.object({
  body: z.object({
    planId: uuid(),
    quantity: z.number().int().positive().default(1),
    paymentMethodId: uuid().optional(),
  }),
});

// PUT update
export const updateSubscriptionSchema = z.object({
  params: z.object({
    subId: uuid(),
  }),
  body: z.object({
    planId: uuid().optional(),
    quantity: z.number().int().positive().optional(),
    status: z.nativeEnum(SubscriptionStatus).optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
  }).refine(val => Object.keys(val).length > 0, { message: 'At least one field must be provided' }),
});

// POST cancel
export const cancelSubscriptionSchema = z.object({
  params: z.object({
    subId: uuid(),
  }),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>['body'];
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>['body']; 