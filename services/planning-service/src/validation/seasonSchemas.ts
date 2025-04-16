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

export const seasonIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid season ID format (must be UUID)" })
    })
});

// Type helper for extracting inferred types
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>['body'];
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>['body']; 