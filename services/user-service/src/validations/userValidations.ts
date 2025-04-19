import { z } from 'zod';

// Common user ID parameter validation
const userIdParam = z.string().uuid({ message: 'Invalid User ID format' });

// Available statuses from schema/docs
const userStatuses = z.enum(['active', 'inactive', 'pending']);

// Schema for getting a user by ID
export const getUserSchema = z.object({
  params: z.object({
    userId: userIdParam,
  }),
});

// Schema for updating a user profile
export const updateUserSchema = z.object({
  params: z.object({
    userId: userIdParam,
  }),
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' }).optional().nullable(), // Allow null to clear
    preferredLanguage: z.enum(['sv', 'en']).optional(),
    status: userStatuses.optional(), // Only specific roles should be able to set this
    avatarUrl: z.string().url({ message: 'Invalid avatar URL' }).optional().nullable(), // Allow null to clear
  }).refine(data => Object.keys(data).length > 0, { 
    message: "At least one field must be provided for update",
    path: ['body'],
  }),
});

// Schema for listing users (validates query parameters)
export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1).refine(val => val >= 1, 'Page must be 1 or greater'),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
    search: z.string().optional(),
    role: z.string().optional(), // Validate against actual roles if needed dynamically
    teamId: z.string().uuid().optional(),
    status: userStatuses.optional(),
    sort: z.enum(['firstName', 'lastName', 'email', 'createdAt']).optional().default('lastName'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    organizationId: z.string().uuid().optional(),
  }),
});

// Schema for assigning a role
export const assignRoleSchema = z.object({
  params: z.object({
    userId: userIdParam,
  }),
  body: z.object({
    roleName: z.string().min(1, { message: 'Role name is required' }), // Could use an enum if roles are static
  }),
});

// Schema for removing a role
export const removeRoleSchema = z.object({
  params: z.object({
    userId: userIdParam,
    roleName: z.string().min(1, { message: 'Role name is required' }), // Role name in params
  }),
});

// Type definitions inferred from schemas
export type GetUserInput = z.infer<typeof getUserSchema>['params'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>; // Includes params and body
export type ListUsersInput = z.infer<typeof listUsersSchema>['query'];
export type AssignRoleInput = z.infer<typeof assignRoleSchema>; // Includes params and body
export type RemoveRoleInput = z.infer<typeof removeRoleSchema>['params']; 