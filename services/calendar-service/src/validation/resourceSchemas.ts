import { z } from 'zod';

const uuid = () => z.string().uuid({ message: 'Invalid UUID format' });

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    resourceTypeId: uuid(),
    description: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    isBookable: z.boolean().optional().default(true),
  }),
});

export const updateResourceSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    resourceTypeId: uuid().optional(),
    description: z.string().optional().nullable(),
    capacity: z.number().int().positive().optional().nullable(),
    isBookable: z.boolean().optional(),
  }),
});

export const resourceIdParamSchema = z.object({
  params: z.object({ id: uuid() }),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>['body'];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>['body']; 