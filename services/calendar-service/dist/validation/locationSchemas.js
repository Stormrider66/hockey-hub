"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationIdParamSchema = exports.updateLocationSchema = exports.createLocationSchema = void 0;
const zod_1 = require("zod");
const uuid = () => zod_1.z.string().uuid({ message: 'Invalid UUID format' });
// Create
exports.createLocationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }).min(2),
        description: zod_1.z.string().optional(),
        street: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        postalCode: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        stateProvince: zod_1.z.string().optional(),
        latitude: zod_1.z.number().min(-90).max(90).optional(),
        longitude: zod_1.z.number().min(-180).max(180).optional(),
    }),
});
// Update
exports.updateLocationSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional().nullable(),
        street: zod_1.z.string().optional().nullable(),
        city: zod_1.z.string().optional().nullable(),
        postalCode: zod_1.z.string().optional().nullable(),
        country: zod_1.z.string().optional().nullable(),
        stateProvince: zod_1.z.string().optional().nullable(),
        latitude: zod_1.z.number().min(-90).max(90).optional().nullable(),
        longitude: zod_1.z.number().min(-180).max(180).optional().nullable(),
    }),
});
exports.locationIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
});
