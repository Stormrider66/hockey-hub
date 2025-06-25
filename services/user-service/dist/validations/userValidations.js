"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRoleSchema = exports.assignRoleSchema = exports.listUsersSchema = exports.updateUserSchema = exports.getUserSchema = void 0;
const zod_1 = require("zod");
// Common user ID parameter validation
const userIdParam = zod_1.z.string().uuid({ message: 'Invalid User ID format' });
// Available statuses from schema/docs
const userStatuses = zod_1.z.enum(['active', 'inactive', 'pending']);
// Schema for getting a user by ID
exports.getUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: userIdParam,
    }),
});
// Schema for updating a user profile
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: userIdParam,
    }),
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(100).optional(),
        lastName: zod_1.z.string().min(1).max(100).optional(),
        phone: zod_1.z.string().regex(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' }).optional().nullable(), // Allow null to clear
        preferredLanguage: zod_1.z.enum(['sv', 'en']).optional(),
        status: userStatuses.optional(), // Only specific roles should be able to set this
        avatarUrl: zod_1.z.string().url({ message: 'Invalid avatar URL' }).optional().nullable(), // Allow null to clear
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
        path: ['body'],
    }),
});
// Schema for listing users (validates query parameters)
exports.listUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 1).refine(val => val >= 1, 'Page must be 1 or greater'),
        limit: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 20).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
        search: zod_1.z.string().optional(),
        role: zod_1.z.string().optional(), // Validate against actual roles if needed dynamically
        teamId: zod_1.z.string().uuid().optional(),
        status: userStatuses.optional(),
        sort: zod_1.z.enum(['firstName', 'lastName', 'email', 'createdAt']).optional().default('lastName'),
        order: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
        organizationId: zod_1.z.string().uuid().optional(),
    }),
});
// Schema for assigning a role
exports.assignRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: userIdParam,
    }),
    body: zod_1.z.object({
        roleName: zod_1.z.string().min(1, { message: 'Role name is required' }), // Could use an enum if roles are static
    }),
});
// Schema for removing a role
exports.removeRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: userIdParam,
        roleName: zod_1.z.string().min(1, { message: 'Role name is required' }), // Role name in params
    }),
});
//# sourceMappingURL=userValidations.js.map