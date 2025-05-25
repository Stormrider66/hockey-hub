import { z } from 'zod';

export const createTrainingCycleSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(3),
    startDate: z.string().datetime({ message: 'Invalid start date format' }),
    endDate: z.string().datetime({ message: 'Invalid end date format' }),
    description: z.string().optional(),
    order: z.number().int().min(0).optional(),
  }),
  params: z.object({
    seasonId: z.string().uuid({ message: 'Invalid season ID' }),
    phaseId: z.string().uuid({ message: 'Invalid phase ID' }),
  })
});

export const updateTrainingCycleSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    description: z.string().optional(),
    order: z.number().int().min(0).optional(),
  }),
  params: z.object({
    seasonId: z.string().uuid({ message: 'Invalid season ID' }),
    phaseId: z.string().uuid({ message: 'Invalid phase ID' }),
    cycleId: z.string().uuid({ message: 'Invalid cycle ID' }),
  })
});

export const trainingCycleIdParamSchema = z.object({
  params: z.object({
    seasonId: z.string().uuid(),
    phaseId: z.string().uuid(),
    cycleId: z.string().uuid(),
  })
});

export type CreateTrainingCycleInput = z.infer<typeof createTrainingCycleSchema>['body'];
export type UpdateTrainingCycleInput = z.infer<typeof updateTrainingCycleSchema>['body']; 