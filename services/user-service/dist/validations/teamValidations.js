"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamsSchema = exports.getTeamSchema = exports.removeTeamMemberSchema = exports.addTeamMemberSchema = exports.updateTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
const teamRoles = zod_1.z.enum(['player', 'coach', 'assistant_coach', 'manager', 'staff']);
const teamStatuses = zod_1.z.enum(['active', 'inactive', 'archived']);
// Schema for creating a team
exports.createTeamSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, { message: 'Team name is required' }).max(100),
        organizationId: zod_1.z.string().uuid({ message: 'Valid organization ID is required' }),
        category: zod_1.z.string().max(100).optional(),
        season: zod_1.z.string().max(20).optional(),
        logoUrl: zod_1.z.string().url({ message: 'Invalid logo URL' }).optional(),
        primaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
        description: zod_1.z.string().optional(),
    }),
});
// Schema for updating a team
exports.updateTeamSchema = zod_1.z.object({
    params: zod_1.z.object({
        teamId: zod_1.z.string().uuid({ message: 'Invalid Team ID' })
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        category: zod_1.z.string().max(100).optional(),
        season: zod_1.z.string().max(20).optional(),
        logoUrl: zod_1.z.string().url({ message: 'Invalid logo URL' }).optional(),
        primaryColor: zod_1.z.string().regex(/^#([A-Fa-f0-9]{6})$/, { message: 'Invalid hex color code' }).optional(),
        description: zod_1.z.string().optional(),
        status: teamStatuses.optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
        path: ['body'], // You might adjust the path depending on how you want the error reported
    }),
});
// Schema for adding a team member
exports.addTeamMemberSchema = zod_1.z.object({
    params: zod_1.z.object({
        teamId: zod_1.z.string().uuid({ message: 'Invalid Team ID' }),
    }),
    body: zod_1.z.object({
        userId: zod_1.z.string().uuid({ message: 'Valid user ID is required' }),
        role: teamRoles,
        position: zod_1.z.string().max(50).optional(),
        jerseyNumber: zod_1.z.string().max(10).optional(),
        startDate: zod_1.z.string().datetime({ message: 'Invalid start date format' }).optional().transform((val) => val ? new Date(val) : undefined),
    }),
});
// Schema for removing a team member
exports.removeTeamMemberSchema = zod_1.z.object({
    params: zod_1.z.object({
        teamId: zod_1.z.string().uuid({ message: 'Invalid Team ID' }),
        userId: zod_1.z.string().uuid({ message: 'Invalid User ID' }),
    }),
    query: zod_1.z.object({
        role: teamRoles.optional(),
    }),
});
// Schema for getting team or team members
exports.getTeamSchema = zod_1.z.object({
    params: zod_1.z.object({
        teamId: zod_1.z.string().uuid({ message: 'Invalid Team ID' })
    }),
});
// Schema for listing teams (validates query parameters)
exports.listTeamsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 1).refine(val => val >= 1, 'Page must be 1 or greater'),
        limit: zod_1.z.string().optional().transform(val => val ? parseInt(val, 10) : 20).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
        search: zod_1.z.string().optional(),
        organizationId: zod_1.z.string().uuid({ message: 'Invalid Organization ID' }).optional(),
        status: teamStatuses.optional(),
        category: zod_1.z.string().optional(),
        sort: zod_1.z.enum(['name', 'category', 'createdAt']).optional().default('name'),
        order: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
    }),
});
//# sourceMappingURL=teamValidations.js.map