"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceTypeIdParamSchema = exports.updateResourceTypeSchema = exports.createResourceTypeSchema = void 0;
const zod_1 = require("zod");
const uuid = () => zod_1.z.string().uuid({ message: 'Invalid UUID format' });
exports.createResourceTypeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        description: zod_1.z.string().optional(),
    }),
});
exports.updateResourceTypeSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional().nullable(),
    }),
});
exports.resourceTypeIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
});
