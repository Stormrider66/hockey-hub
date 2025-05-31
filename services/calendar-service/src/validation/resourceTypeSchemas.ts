import { z } from 'zod';

const uuid = () => z.string().uuid({ message: 'Invalid UUID format' });

export const createResourceTypeSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    description: z.string().optional(),
  }),
});

export const updateResourceTypeSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
  }),
});

export const resourceTypeIdParamSchema = z.object({
  params: z.object({ id: uuid() }),
});

export type CreateResourceTypeInput = z.infer<typeof createResourceTypeSchema>['body'];
export type UpdateResourceTypeInput = z.infer<typeof updateResourceTypeSchema>['body']; 