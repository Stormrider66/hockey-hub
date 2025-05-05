import { z } from 'zod';
import { GoalStatus } from '@hockey-hub/types'; // Import GoalStatus enum

// Common UUID param schema
const uuidParam = z.string().uuid({ message: 'Invalid UUID format' });

// Schema for validating planId in params
export const planIdParamSchema = z.object({
    params: z.object({
        planId: uuidParam,
    })
});

// Schema for validating planId and itemId in params
export const planItemIdParamSchema = z.object({
    params: z.object({
        planId: uuidParam,
        itemId: uuidParam,
    })
});

// Base schema for Development Plan Item (reused in create/update)
const devPlanItemBaseSchema = z.object({
    category: z.string().min(1, 'Category is required'),
    focusArea: z.string().min(1, 'Focus area is required'),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(GoalStatus).optional().default(GoalStatus.NOT_STARTED),
    notes: z.string().optional().nullable(),
});

// Schema for creating a Development Plan
export const createDevelopmentPlanSchema = z.object({
    body: z.object({
        organizationId: uuidParam,
        playerId: uuidParam,
        teamId: uuidParam.optional().nullable(),
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional().nullable(),
        status: z.nativeEnum(GoalStatus).optional().default(GoalStatus.NOT_STARTED),
        startDate: z.string().datetime({ message: 'Invalid start date format' }).optional().nullable(),
        endDate: z.string().datetime({ message: 'Invalid end date format' }).optional().nullable(),
        // Optional: Allow creating items directly?
        // items: z.array(devPlanItemBaseSchema).optional()
    })
});

// Schema for updating a Development Plan
export const updateDevelopmentPlanSchema = z.object({
    params: z.object({
        planId: uuidParam,
    }),
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        status: z.nativeEnum(GoalStatus).optional(),
        startDate: z.string().datetime({ message: 'Invalid start date format' }).optional().nullable(),
        endDate: z.string().datetime({ message: 'Invalid end date format' }).optional().nullable(),
    }).refine(data => Object.keys(data).length > 0, { 
        message: "At least one field must be provided for update",
        path: ['body'],
      }),
});

// Schema for creating a Development Plan Item
export const createDevelopmentPlanItemSchema = z.object({
    params: z.object({
        planId: uuidParam,
    }),
    body: devPlanItemBaseSchema // Reuse base item schema
});

// Schema for updating a Development Plan Item
export const updateDevelopmentPlanItemSchema = z.object({
    params: z.object({
        planId: uuidParam,
        itemId: uuidParam,
    }),
    body: devPlanItemBaseSchema.partial().refine(data => Object.keys(data).length > 0, { 
        message: "At least one field must be provided for update",
        path: ['body'],
      }),
});

// Export inferred types for controller usage if needed
export type ListDevelopmentPlansQueryInput = z.infer<typeof planIdParamSchema>; // Placeholder, needs proper query schema
export type CreateDevelopmentPlanInput = z.infer<typeof createDevelopmentPlanSchema>['body'];
export type UpdateDevelopmentPlanInput = z.infer<typeof updateDevelopmentPlanSchema>['body'];
export type CreateDevelopmentPlanItemInput = z.infer<typeof createDevelopmentPlanItemSchema>['body'];
export type UpdateDevelopmentPlanItemInput = z.infer<typeof updateDevelopmentPlanItemSchema>['body']; 