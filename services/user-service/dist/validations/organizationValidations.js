"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrganizationsSchema = exports.getOrganizationSchema = exports.updateOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = require("zod");
// Available statuses from schema/docs
const organizationStatuses = zod_1.z.enum(['active', 'inactive', 'trial']);
// Schema for creating an organization
exports.createOrganizationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, { message: 'Organization name is required' }).max(100),
        contactEmail: zod_1.z.string().email({ message: 'Valid contact email is required' }),
        contactPhone: zod_1.z.string().regex(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' }).optional(),
        logoUrl: zod_1.z.string().url({ message: 'Invalid logo URL' }).optional(),
        address: zod_1.z.string().max(255).optional(),
        city: zod_1.z.string().max(100).optional(),
        country: zod_1.z.string().max(100).optional().default('Sweden'),
        primaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
        secondaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
        defaultLanguage: zod_1.z.enum(['sv', 'en']).optional().default('sv'),
    }),
});
// Schema for updating an organization
exports.updateOrganizationSchema = zod_1.z.object({
    params: zod_1.z.object({
        organizationId: zod_1.z.string().uuid({ message: 'Invalid Organization ID' }),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        contactEmail: zod_1.z.string().email().optional(),
        contactPhone: zod_1.z.string().regex(/^\+?[0-9]{8,15}$/).optional().nullable(),
        logoUrl: zod_1.z.string().url().optional().nullable(),
        address: zod_1.z.string().max(255).optional().nullable(),
        city: zod_1.z.string().max(100).optional().nullable(),
        country: zod_1.z.string().max(100).optional().nullable(),
        primaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional().nullable(),
        secondaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6})$/).optional().nullable(),
        defaultLanguage: zod_1.z.enum(['sv', 'en']).optional(),
        status: organizationStatuses.optional(), // Should be restricted by role
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
        path: ['body'],
    }),
});
// Schema for getting an organization by ID
exports.getOrganizationSchema = zod_1.z.object({
    params: zod_1.z.object({
        organizationId: zod_1.z.string().uuid({ message: 'Invalid Organization ID' })
    }),
});
// Schema for listing organizations (validates query parameters)
exports.listOrganizationsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 1).refine(val => val >= 1, 'Page must be 1 or greater'),
        limit: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 20).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
        search: zod_1.z.string().optional(),
        status: organizationStatuses.optional(),
        sort: zod_1.z.enum(['name', 'createdAt']).optional().default('name'),
        order: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
    }),
});
//# sourceMappingURL=organizationValidations.js.map