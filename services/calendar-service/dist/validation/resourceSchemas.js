"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceIdParamSchema = exports.updateResourceSchema = exports.createResourceSchema = void 0;
const zod_1 = require("zod");
const uuid = () => zod_1.z.string().uuid({ message: 'Invalid UUID format' });
exports.createResourceSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        resourceTypeId: uuid(),
        description: zod_1.z.string().optional(),
        capacity: zod_1.z.number().int().positive().optional(),
        isBookable: zod_1.z.boolean().optional().default(true),
    }),
});
exports.updateResourceSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        resourceTypeId: uuid().optional(),
        description: zod_1.z.string().optional().nullable(),
        capacity: zod_1.z.number().int().positive().optional().nullable(),
        isBookable: zod_1.z.boolean().optional(),
    }),
});
exports.resourceIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
});
