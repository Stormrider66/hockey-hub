"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventStatusSchema = exports.listEventsQuerySchema = exports.eventIdParamSchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("@hockey-hub/types");
// --- Enums ---
// TODO: Replace eventTypeEnum with actual enum when available
const eventTypeEnum = zod_1.z.string().min(1);
const eventStatusEnum = zod_1.z.nativeEnum(types_1.EventStatus);
const repetitionEnum = zod_1.z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).optional();
// --- Helpers ---
const isoDateString = () => zod_1.z.string().datetime({ message: 'Must be ISO 8601 UTC date-time string' });
const uuid = () => zod_1.z.string().uuid({ message: 'Invalid UUID format' });
// --- Create Event ---
exports.createEventSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ required_error: 'Title is required' }).min(3),
        description: zod_1.z.string().optional(),
        startTime: isoDateString(),
        endTime: isoDateString(),
        isAllDay: zod_1.z.boolean().optional().default(false),
        eventType: eventTypeEnum,
        status: eventStatusEnum.optional(),
        locationId: uuid().optional(),
        teamIds: zod_1.z.array(uuid()).optional(),
        resourceIds: zod_1.z.array(uuid()).optional(),
        repetition: repetitionEnum,
        repetitionEndDate: isoDateString().optional(),
    }).refine(data => new Date(data.endTime) >= new Date(data.startTime), {
        message: 'endTime cannot be before startTime',
        path: ['endTime'],
    }),
});
// --- Update Event ---
exports.updateEventSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        description: zod_1.z.string().optional().nullable(),
        startTime: isoDateString().optional(),
        endTime: isoDateString().optional(),
        isAllDay: zod_1.z.boolean().optional(),
        eventType: eventTypeEnum.optional(),
        status: eventStatusEnum.optional(),
        locationId: uuid().optional().nullable(),
        teamIds: zod_1.z.array(uuid()).optional(),
        resourceIds: zod_1.z.array(uuid()).optional(),
        repetition: repetitionEnum,
        repetitionEndDate: isoDateString().optional().nullable(),
    }).refine(data => {
        if (data.startTime && data.endTime) {
            return new Date(data.endTime) >= new Date(data.startTime);
        }
        return true;
    }, {
        message: 'endTime cannot be before startTime',
        path: ['endTime'],
    }),
});
// --- Param Schema ---
exports.eventIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: uuid() }),
});
// --- List Query Schema ---
exports.listEventsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        start: isoDateString().optional(),
        end: isoDateString().optional(),
        teamId: uuid().optional(),
        eventType: eventTypeEnum.optional(),
        locationId: uuid().optional(),
    }),
});
// Add schema for status-only update
exports.updateEventStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid({ message: 'Invalid event ID format' })
    }),
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(types_1.EventStatus)
    })
});
