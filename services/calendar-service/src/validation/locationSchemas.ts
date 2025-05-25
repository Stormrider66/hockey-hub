import { z } from 'zod';

const uuid = () => z.string().uuid({ message: 'Invalid UUID format' });

// Create
export const createLocationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    description: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    stateProvince: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
});

// Update
export const updateLocationSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    stateProvince: z.string().optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
  }),
});

export const locationIdParamSchema = z.object({
  params: z.object({ id: uuid() }),
});

// Types
export type CreateLocationInput = z.infer<typeof createLocationSchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body']; 