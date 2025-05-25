import { z } from 'zod';

const seasonStatusEnum = z.enum(['planning', 'active', 'completed', 'archived']);

export const createSeasonSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Season name is required',
            invalid_type_error: "Season name must be a string",
        }).min(3, { message: "Season name must be at least 3 characters long" }),
        
        startDate: z.string({
            required_error: 'Start date is required',
        }).datetime({ message: "Invalid date-time string! Must be UTC." }), // ISO 8601 format
        
        endDate: z.string({
            required_error: 'End date is required',
        }).datetime({ message: "Invalid date-time string! Must be UTC." }),
        
        status: seasonStatusEnum.optional().default('planning')
    }).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
        message: "End date cannot be earlier than start date",
        path: ["endDate"], // Path of error
    })
});

export const updateSeasonSchema = z.object({
    body: z.object({
        name: z.string()
            .min(3, { message: "Season name must be at least 3 characters long" })
            .optional(),
            
        startDate: z.string()
            .datetime({ message: "Invalid date-time string! Must be UTC." })
            .optional(),
            
        endDate: z.string()
            .datetime({ message: "Invalid date-time string! Must be UTC." })
            .optional(),
            
        status: seasonStatusEnum.optional()
    })
    // Add refine for dates only if both are present in the update
    .refine(data => {
        if (data.startDate && data.endDate) {
            return new Date(data.endDate) >= new Date(data.startDate);
        }
        return true; // Skip validation if one date is missing
    }, {
        message: "End date cannot be earlier than start date when both are provided",
        path: ["endDate"],
    }),
    params: z.object({
        id: z.string().uuid({ message: "Invalid season ID format (must be UUID)" })
    })
});

export const singleSeasonIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid Season ID format (must be UUID)" })
    })
});

// Type helper for extracting inferred types
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>['body'];
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>['body'];

// --- Season Phase Schemas ---

// Align with SeasonPhase type in types/planning.ts
const phaseTypeEnum = z.enum(['pre_season', 'regular_season', 'playoffs', 'off_season']).optional();

export const createSeasonPhaseSchema = z.object({
    params: z.object({
        seasonId: z.string().uuid({ message: "Invalid Season ID format" })
    }),
    body: z.object({
        name: z.string({ required_error: 'Phase name is required' }).min(1),
        startDate: z.string().datetime({ message: "Invalid start date format. Must be ISO8601 UTC." }),
        endDate: z.string().datetime({ message: "Invalid end date format. Must be ISO8601 UTC." }),
        type: phaseTypeEnum,
        focusPrimary: z.string().optional(),
        focusSecondary: z.string().optional(),
        description: z.string().optional(),
        order: z.number().int().optional(),
    })
}).refine(data => new Date(data.body.endDate) >= new Date(data.body.startDate), {
    message: "End date cannot be before start date",
    path: ["body", "endDate"], // Point error to endDate
});

export const updateSeasonPhaseSchema = z.object({
    params: z.object({
        seasonId: z.string().uuid({ message: "Invalid Season ID format" })
            .refine(val => val, { message: "Season ID parameter is required"}), // Ensure it's present
        phaseId: z.string().uuid({ message: "Invalid Phase ID format" })
            .refine(val => val, { message: "Phase ID parameter is required"}), // Ensure it's present
    }),
    body: z.object({
        name: z.string().min(1).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        type: phaseTypeEnum.optional(),
        focusPrimary: z.string().optional().nullable(),
        focusSecondary: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        order: z.number().int().optional().nullable(),
    })
    .refine(data => Object.keys(data).length > 0, { 
        message: "At least one field must be provided for update" 
    })
    // Refine to check end date >= start date IF BOTH are provided
    .refine(data => {
        if (data.startDate && data.endDate) {
            return new Date(data.endDate) >= new Date(data.startDate);
        }
        return true; // Pass if one or both are missing
    }, {
        message: "End date cannot be before start date",
        path: ["endDate"], 
    })
});

export const seasonAndPhaseIdParamSchema = z.object({
    params: z.object({
        seasonId: z.string().uuid({ message: "Invalid Season ID format" })
            .refine(val => val, { message: "Season ID parameter is required"}), // Ensure it's present
        phaseId: z.string().uuid({ message: "Invalid Phase ID format" })
    })
});

// Type helpers for Phases
export type CreateSeasonPhaseInput = z.infer<typeof createSeasonPhaseSchema>['body'];
export type UpdateSeasonPhaseInput = z.infer<typeof updateSeasonPhaseSchema>['body'];

// Add schema specifically for validating seasonId param in routes like GET /:seasonId/phases
export const seasonIdParamSchema = z.object({
    params: z.object({
        seasonId: z.string().uuid({ message: "Invalid Season ID format" })
    })
});

// Add list query schema for listing seasons with pagination and filters
const pageSchema = z.preprocess(v => Number(v), z.number().int().min(1).default(1));
const limitSchema = z.preprocess(v => Number(v), z.number().int().min(1).max(100).default(20));

export const listSeasonsQuerySchema = z.object({
    query: z.object({
        status: seasonStatusEnum.optional(),
        organizationId: z.string().uuid().optional(),
        page: pageSchema.optional(),
        limit: limitSchema.optional(),
        sort: z.enum(['startDate', 'endDate', 'name', 'status', 'createdAt', 'updatedAt']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
    })
});

// Type helper for list seasons query
export type ListSeasonsQuery = z.infer<typeof listSeasonsQuerySchema>['query']; 