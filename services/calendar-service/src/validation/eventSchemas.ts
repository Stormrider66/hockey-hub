import { z } from 'zod';
import { EventStatus as EventStatusEnum } from '@hockey-hub/types';

// --- Enums ---
// TODO: Replace eventTypeEnum with actual enum when available
const eventTypeEnum = z.string().min(1);
const eventStatusEnum = z.nativeEnum(EventStatusEnum);
const repetitionEnum = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).optional();

// --- Helpers ---
const isoDateString = () => z.string().datetime({ message: 'Must be ISO 8601 UTC date-time string' });
const uuid = () => z.string().uuid({ message: 'Invalid UUID format' });

// --- Create Event ---
export const createEventSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3),
    description: z.string().optional(),
    startTime: isoDateString(),
    endTime: isoDateString(),
    isAllDay: z.boolean().optional().default(false),
    eventType: eventTypeEnum,
    status: eventStatusEnum.optional(),
    locationId: uuid().optional(),
    teamIds: z.array(uuid()).optional(),
    resourceIds: z.array(uuid()).optional(),
    repetition: repetitionEnum,
    repetitionEndDate: isoDateString().optional(),
  }).refine(data => new Date(data.endTime) >= new Date(data.startTime), {
    message: 'endTime cannot be before startTime',
    path: ['endTime'],
  }),
});

// --- Update Event ---
export const updateEventSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional().nullable(),
    startTime: isoDateString().optional(),
    endTime: isoDateString().optional(),
    isAllDay: z.boolean().optional(),
    eventType: eventTypeEnum.optional(),
    status: eventStatusEnum.optional(),
    locationId: uuid().optional().nullable(),
    teamIds: z.array(uuid()).optional(),
    resourceIds: z.array(uuid()).optional(),
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
export const eventIdParamSchema = z.object({
  params: z.object({ id: uuid() }),
});

// --- List Query Schema ---
export const listEventsQuerySchema = z.object({
  query: z.object({
    start: isoDateString().optional(),
    end: isoDateString().optional(),
    teamId: uuid().optional(),
    eventType: eventTypeEnum.optional(),
    locationId: uuid().optional(),
  }),
});

// Add schema for status-only update
export const updateEventStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: 'Invalid event ID format' })
    }),
    body: z.object({
        status: z.nativeEnum(EventStatusEnum)
    })
});

// --- Types ---
export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
export type UpdateEventStatusInput = z.infer<typeof updateEventStatusSchema>['body']; 