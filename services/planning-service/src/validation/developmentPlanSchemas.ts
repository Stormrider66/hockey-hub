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
        planId: z.string().uuid({ message: "Invalid Plan ID format" })
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
        planId: z.string().uuid({ message: "Invalid Plan ID format" })
    })
});

// --- Plan Item Schema ---
export const createDevelopmentPlanItemSchema = z.object({
    params: z.object({
        planId: z.string().uuid({ message: "Invalid Plan ID format" })
    }),
    body: z.object({
        category: z.string({ required_error: 'Category is required' }).min(1),
        focusArea: z.string({ required_error: 'Focus area is required' }).min(1),
        description: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
    })
});

export const updateDevelopmentPlanItemSchema = z.object({
    params: z.object({
        planId: z.string().uuid({ message: "Invalid Plan ID format" }),
        itemId: z.string().uuid({ message: "Invalid Item ID format" })
    }),
    body: z.object({
        category: z.string().min(1).optional(),
        focusArea: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        status: z.string().optional(),
        notes: z.string().optional().nullable(),
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

// --- List / Query Schema ---
const pageSchema = z.preprocess(v => Number(v), z.number().int().min(1).default(1));
const limitSchema = z.preprocess(v => Number(v), z.number().int().min(1).max(100).default(20));

export const listDevelopmentPlansQuerySchema = z.object({
    query: z.object({
        page: pageSchema.optional(),
        limit: limitSchema.optional(),
        sort: z.enum(['createdAt', 'updatedAt', 'title', 'status']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
        status: planStatusEnum.optional(),
        playerId: z.string().uuid().optional(),
        teamId: z.string().uuid().optional(),
    })
});

// Type helpers
export type CreateDevelopmentPlanInput = z.infer<typeof createDevelopmentPlanSchema>['body'];
export type UpdateDevelopmentPlanInput = z.infer<typeof updateDevelopmentPlanSchema>['body'];
export type CreateDevelopmentPlanItemInput = z.infer<typeof createDevelopmentPlanItemSchema>['body'];
export type UpdateDevelopmentPlanItemInput = z.infer<typeof updateDevelopmentPlanItemSchema>['body']; 