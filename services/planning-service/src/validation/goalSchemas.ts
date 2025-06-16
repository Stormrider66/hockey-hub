import { z } from 'zod';

const goalStatusEnum = z.enum(['not_started', 'in_progress', 'achieved', 'partially_achieved', 'not_achieved', 'on_hold']);
const goalCategoryEnum = z.enum(['performance', 'skill', 'tactical', 'physical', 'behavioral', 'other']).optional();
const goalPriorityEnum = z.enum(['high', 'medium', 'low']).optional();

// Base schema shared by Team and Player goals
const baseGoalSchema = {
    description: z.string({
        required_error: 'Goal description is required',
    }).min(3, { message: "Description must be at least 3 characters" }),
    
    seasonId: z.string().uuid({ message: "Invalid Season ID format" }).optional(),
    category: goalCategoryEnum,
    measure: z.string().optional(),
    targetValue: z.union([z.string(), z.number()]).optional(), // Allow string or number
    priority: goalPriorityEnum,
    status: goalStatusEnum, // Status is required
    dueDate: z.string().datetime({ message: "Invalid due date format. Must be UTC." }).optional(),
};

// --- Team Goal Schemas ---

export const createTeamGoalSchema = z.object({
    body: z.object({
        ...baseGoalSchema,
        teamId: z.string({ required_error: 'Team ID is required' })
            .uuid({ message: "Invalid Team ID format" }),
        status: goalStatusEnum.optional().default('not_started') // Default status on create
    })
});

export const updateTeamGoalSchema = z.object({
    body: z.object({
        description: z.string().min(3).optional(),
        seasonId: z.string().uuid().optional(),
        category: goalCategoryEnum.optional(),
        measure: z.string().optional(),
        targetValue: z.union([z.string(), z.number()]).optional(),
        priority: goalPriorityEnum.optional(),
        status: goalStatusEnum.optional(),
        dueDate: z.string().datetime().optional(),
    }),
    params: z.object({
        id: z.string().uuid({ message: "Invalid Goal ID format" })
    })
});

export const teamGoalIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid Goal ID format" })
    })
});

// --- Player Goal Schemas ---

export const createPlayerGoalSchema = z.object({
    body: z.object({
        ...baseGoalSchema,
        playerId: z.string({ required_error: 'Player ID is required' })
            .uuid({ message: "Invalid Player ID format" }),
        status: goalStatusEnum.optional().default('not_started') // Default status on create
    })
});

export const updatePlayerGoalSchema = z.object({
    body: z.object({
        description: z.string().min(3).optional(),
        seasonId: z.string().uuid().optional(),
        category: goalCategoryEnum.optional(),
        measure: z.string().optional(),
        targetValue: z.union([z.string(), z.number()]).optional(),
        priority: goalPriorityEnum.optional(),
        status: goalStatusEnum.optional(),
        dueDate: z.string().datetime().optional(),
    }),
    params: z.object({
        id: z.string().uuid({ message: "Invalid Goal ID format" })
    })
});

export const playerGoalIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid Goal ID format" })
    })
});

// Type helpers
export type CreateTeamGoalInput = z.infer<typeof createTeamGoalSchema>['body'];
export type UpdateTeamGoalInput = z.infer<typeof updateTeamGoalSchema>['body'];
export type CreatePlayerGoalInput = z.infer<typeof createPlayerGoalSchema>['body'];
export type UpdatePlayerGoalInput = z.infer<typeof updatePlayerGoalSchema>['body']; 