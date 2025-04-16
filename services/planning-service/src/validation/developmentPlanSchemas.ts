import { z } from 'zod';

const planStatusEnum = z.enum(['draft', 'active', 'completed', 'archived']);

// --- Base Plan Schema ---
export const createDevelopmentPlanSchema = z.object({
    body: z.object({
        playerId: z.string().uuid({ message: "Invalid Player ID format" }),
        seasonId: z.string().uuid({ message: "Invalid Season ID format" }),
        title: z.string({ required_error: 'Title is required' })
            .min(3, { message: "Title must be at least 3 characters" }),
        status: planStatusEnum.optional().default('draft'),
        reviewSchedule: z.string().optional(),
        overallComment: z.string().optional(),
    })
});

export const updateDevelopmentPlanSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid Plan ID format" })
    }),
    body: z.object({
        title: z.string().min(3).optional(),
        status: planStatusEnum.optional(),
        reviewSchedule: z.string().optional(),
        overallComment: z.string().optional(),
    }).refine(data => Object.keys(data).length > 0, { 
        message: "At least one field must be provided for update" 
    })
});

export const planIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid Plan ID format" })
    })
});

// --- Plan Item Schema ---
export const createDevelopmentPlanItemSchema = z.object({
    params: z.object({
        planId: z.string().uuid({ message: "Invalid Plan ID format" })
    }),
    body: z.object({
        skillArea: z.string({ required_error: 'Skill area is required' }).min(1),
        currentLevel: z.string().optional(),
        targetLevel: z.string().optional(),
        actions: z.string().optional(),
        resources: z.string().optional(),
        order: z.number().int().optional(),
    })
});

export const updateDevelopmentPlanItemSchema = z.object({
    params: z.object({
        planId: z.string().uuid({ message: "Invalid Plan ID format" }),
        itemId: z.string().uuid({ message: "Invalid Item ID format" })
    }),
    body: z.object({
        skillArea: z.string().min(1).optional(),
        currentLevel: z.string().optional().nullable(),
        targetLevel: z.string().optional().nullable(),
        actions: z.string().optional().nullable(),
        resources: z.string().optional().nullable(),
        order: z.number().int().optional().nullable(),
    }).refine(data => Object.keys(data).length > 0, { 
        message: "At least one field must be provided for update" 
    })
});

export const planItemIdParamSchema = z.object({
    params: z.object({
        planId: z.string().uuid({ message: "Invalid Plan ID format" }),
        itemId: z.string().uuid({ message: "Invalid Item ID format" })
    })
});


// Type helpers
export type CreateDevelopmentPlanInput = z.infer<typeof createDevelopmentPlanSchema>['body'];
export type UpdateDevelopmentPlanInput = z.infer<typeof updateDevelopmentPlanSchema>['body'];
export type CreateDevelopmentPlanItemInput = z.infer<typeof createDevelopmentPlanItemSchema>['body'];
export type UpdateDevelopmentPlanItemInput = z.infer<typeof updateDevelopmentPlanItemSchema>['body']; 