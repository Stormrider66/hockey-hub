import { z } from 'zod';

const teamRoles = z.enum(['player', 'coach', 'assistant_coach', 'manager', 'staff']);
const teamStatuses = z.enum(['active', 'inactive', 'archived']);

// Schema for creating a team
export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Team name is required' }).max(100),
    organizationId: z.string().uuid({ message: 'Valid organization ID is required' }),
    category: z.string().max(100).optional(),
    season: z.string().max(20).optional(),
    logoUrl: z.string().url({ message: 'Invalid logo URL' }).optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
    description: z.string().optional(),
  }),
});

// Schema for updating a team
export const updateTeamSchema = z.object({
  params: z.object({ 
    teamId: z.string().uuid({ message: 'Invalid Team ID' })
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    category: z.string().max(100).optional(),
    season: z.string().max(20).optional(),
    logoUrl: z.string().url({ message: 'Invalid logo URL' }).optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
    description: z.string().optional(),
    status: teamStatuses.optional(),
  }).refine((data) => Object.keys(data).length > 0, { // Use refine to check if body has at least one key
    message: "At least one field must be provided for update",
    path: ['body'], // You might adjust the path depending on how you want the error reported
  }),
});

// Schema for adding a team member
export const addTeamMemberSchema = z.object({
  params: z.object({
    teamId: z.string().uuid({ message: 'Invalid Team ID' }),
  }),
  body: z.object({
    userId: z.string().uuid({ message: 'Valid user ID is required' }),
    role: teamRoles,
    position: z.string().max(50).optional(),
    jerseyNumber: z.string().max(10).optional(),
    startDate: z.string().datetime({ message: 'Invalid start date format' }).optional().transform((val) => val ? new Date(val) : undefined),
  }),
});

// Schema for removing a team member
export const removeTeamMemberSchema = z.object({
  params: z.object({
    teamId: z.string().uuid({ message: 'Invalid Team ID' }),
    userId: z.string().uuid({ message: 'Invalid User ID' }),
  }),
  query: z.object({ // Role might be passed as query param to specify which role link to remove
    role: teamRoles.optional(),
  }),
});

// Schema for getting team or team members
export const getTeamSchema = z.object({
  params: z.object({
    teamId: z.string().uuid({ message: 'Invalid Team ID' })
  }),
});

// Type definitions inferred from schemas
export type CreateTeamInput = z.infer<typeof createTeamSchema>['body'];
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>; // Includes params and body
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>; // Includes params and body
export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberSchema>; // Includes params and query
export type GetTeamInput = z.infer<typeof getTeamSchema>['params']; 