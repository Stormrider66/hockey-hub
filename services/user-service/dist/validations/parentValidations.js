"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelatedUsersSchema = exports.removeParentLinkSchema = exports.addParentLinkSchema = void 0;
const zod_1 = require("zod");
const relationshipEnum = zod_1.z.enum(['parent', 'guardian', 'other']).optional();
// Schema for adding a parent-child link
exports.addParentLinkSchema = zod_1.z.object({
    body: zod_1.z.object({
        parentId: zod_1.z.string().uuid({ message: 'Valid parent user ID is required' }),
        childId: zod_1.z.string().uuid({ message: 'Valid child user ID is required' }),
        relationship: relationshipEnum.default('parent'),
        isPrimary: zod_1.z.boolean().optional().default(false),
    }),
});
// Schema for removing a parent-child link (by link ID)
exports.removeParentLinkSchema = zod_1.z.object({
    params: zod_1.z.object({
        linkId: zod_1.z.string().uuid({ message: 'Invalid link ID format' }),
    }),
});
// Schema for getting children or parents (by user ID)
exports.getRelatedUsersSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().uuid({ message: 'Invalid user ID format' })
    })
});
//# sourceMappingURL=parentValidations.js.map