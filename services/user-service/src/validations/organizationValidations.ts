import { z } from 'zod';

// Available statuses from schema/docs
const organizationStatuses = z.enum(['active', 'inactive', 'trial']);

// Schema for creating an organization
export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Organization name is required' }).max(100),
    contactEmail: z.string().email({ message: 'Valid contact email is required' }),
    contactPhone: z.string().regex(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' }).optional(),
    logoUrl: z.string().url({ message: 'Invalid logo URL' }).optional(),
    address: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional().default('Sweden'),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
    defaultLanguage: z.enum(['sv', 'en']).optional().default('sv'),
  }),
});

// Schema for updating an organization
export const updateOrganizationSchema = z.object({
  params: z.object({
    organizationId: z.string().uuid({ message: 'Invalid Organization ID' }),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().regex(/^\+?[0-9]{8,15}$/).optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional().nullable(),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional().nullable(),
    defaultLanguage: z.enum(['sv', 'en']).optional(),
    status: organizationStatuses.optional(), // Should be restricted by role
  }).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
    path: ['body'],
  }),
});

// Schema for getting an organization by ID
export const getOrganizationSchema = z.object({
    params: z.object({
        organizationId: z.string().uuid({ message: 'Invalid Organization ID' })
    }),
});

// Schema for listing organizations (validates query parameters)
export const listOrganizationsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1).refine(val => val >= 1, 'Page must be 1 or greater'),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
    search: z.string().optional(),
    status: organizationStatuses.optional(),
    sort: z.enum(['name', 'createdAt']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});


// Type definitions inferred from schemas
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>; // Includes params and body
export type GetOrganizationInput = z.infer<typeof getOrganizationSchema>['params'];
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>['query']; 