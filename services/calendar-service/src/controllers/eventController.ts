import { Request, Response, NextFunction } from 'express';
import {
    findAll as repoFindAll,
    findById as repoFindById,
    createEvent as repoCreateEvent,
    updateEvent as repoUpdateEvent,
    deleteEvent as repoDeleteEvent,
} from '../repositories/eventRepository';
import {
    findByEvent as attendeeFindByEvent,
    addAttendee as attendeeAdd,
    removeAttendee as attendeeRemove,
} from '../repositories/eventAttendeeRepository';
import { CalendarEvent } from '../types/event';
import { CreateEventInput } from '../validation/eventSchemas';
import { findConflictingEvents } from '../utils/conflictDetection';
import { EventType as EventTypeEnum, EventStatus as EventStatusEnum, AttendeeStatus as AttendeeStatusEnum } from '@hockey-hub/types';
import { doesTeamExist } from '../services/teamService';
import { doesUserExist } from '../services/userService';
import { findById as locFindById } from '../repositories/locationRepository';
import { findById as resRepositoryFindById } from '../repositories/resourceRepository';
import { t } from '../utils/translate';

// TODO: Add proper error handling and validation

/**
 * Get all calendar events, potentially filtered by query parameters.
 */
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    const { start, end, teamId, eventType, locationId } = req.query as any;
    try {
        const events = await repoFindAll({ start, end, teamId, eventType, locationId });
        res.status(200).json({ success: true, data: events });
    } catch (err) {
        console.error('[Error] Failed to fetch events:', err);
        next(err);
    }
};

/**
 * Get a single event by its ID, including associated resources.
 */
export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: t('errors.event.invalid_id', req) });
    }

    try {
        const event = await repoFindById(id);
        if (!event) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: t('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, data: event });
    } catch (err) {
        console.error(`[Error] Failed to fetch event ${id}:`, err);
        next(err);
    }
};

/**
 * Create a new calendar event.
 */
export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.user?.organizationId;
    const createdByUserId = req.user?.id;

    if (!organizationId || !createdByUserId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }

    const {
        title,
        description,
        startTime,
        endTime,
        eventType,
        locationId,
        teamIds,
        resourceIds,
        status = 'scheduled'
    } = req.body as CreateEventInput & { resourceIds?: string[] };

    // --- Basic Validation ---
    if (!title || !startTime || !endTime || !eventType) {
        return res.status(400).json({ 
            error: true, 
            message: 'Missing required fields: title, startTime, endTime, eventType' 
        });
    }
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: true, message: 'Invalid date format for startTime or endTime' });
    }
    if (endDate < startDate) {
        return res.status(400).json({ error: true, message: 'endTime cannot be before startTime' });
    }
    if (resourceIds && !Array.isArray(resourceIds)) {
        return res.status(400).json({ error: true, message: 'resourceIds must be an array' });
    }
    // Validate enums
    if (!Object.values(EventTypeEnum).includes(eventType as EventTypeEnum)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid eventType' });
    }
    if (status && !Object.values(EventStatusEnum).includes(status as EventStatusEnum)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid status value' });
    }
    // --- Existence Checks (location & resources) ---
    if (locationId) {
        const locExists = await locFindById(locationId);
        if (!locExists) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'locationId does not exist' });
        }
    }

    if (resourceIds && resourceIds.length > 0) {
        const resourceChecks = await Promise.all(resourceIds.map(id => resRepositoryFindById(id)));
        const missing: string[] = [];
        resourceChecks.forEach((res, idx) => {
            if (!res) missing.push(resourceIds[idx]);
        });
        if (missing.length > 0) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'One or more resourceIds do not exist', details: { missing } });
        }
    }

    // Team existence
    if (teamIds && teamIds.length === 1) {
        const teamOk = await doesTeamExist(teamIds[0], organizationId);
        if (!teamOk) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Provided teamId does not exist' });
        }
    }

    // --- Conflict Detection ---
    const conflictEvents = await findConflictingEvents({
        startTime,
        endTime,
        resourceIds: resourceIds ?? [],
        teamId: teamIds && teamIds.length === 1 ? teamIds[0] : null,
        locationId: locationId ?? null,
    });

    if (conflictEvents.length > 0) {
        return res.status(409).json({
            error: true,
            code: 'EVENT_CONFLICT',
            message: t('errors.event.conflict', req),
            conflicts: conflictEvents,
        });
    }

    try {
        const eventToSave: any = {
            organizationId,
            teamIds,
            locationId: locationId ?? null,
            title,
            description: description ?? null,
            startTime,
            endTime,
            eventType,
            status,
        };
        const saved = await repoCreateEvent({ ...eventToSave, resourceIds });
        res.status(201).json({ success: true, data: saved });
    } catch (err) {
        console.error('[Error] Failed to create event:', err);
        next(err);
    }
};

/**
 * Update an existing calendar event.
 */
export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { 
        title,
        description,
        startTime,
        endTime,
        eventType,
        locationId,
        teamId,
        resourceIds, // Expecting an array of resource UUIDs
        status
    } = req.body as Partial<CalendarEvent & { resourceIds?: string[] }>;

    // --- Basic Validation ---
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: t('errors.event.invalid_id', req) });
    }
    if (startTime && isNaN(Date.parse(startTime as unknown as string))) { 
        return res.status(400).json({ error: true, message: 'Invalid date format for startTime' });
    }
    if (endTime && isNaN(Date.parse(endTime as unknown as string))) { 
        return res.status(400).json({ error: true, message: 'Invalid date format for endTime' });
    }
    if (startTime && endTime && new Date(endTime as unknown as string) < new Date(startTime as unknown as string)) { 
        return res.status(400).json({ error: true, message: 'endTime cannot be before startTime' });
    }
    if (resourceIds && !Array.isArray(resourceIds)) {
        return res.status(400).json({ error: true, message: 'resourceIds must be an array' });
    }
    // Validate enums were handled earlier; now check referenced entities

    if (locationId !== undefined && locationId !== null) {
        const locExists = await locFindById(locationId);
        if (!locExists) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'locationId does not exist' });
        }
    }

    if (resourceIds !== undefined) {
        const resourceChecks = await Promise.all(resourceIds.map(id => resRepositoryFindById(id)));
        const missingRes: string[] = [];
        resourceChecks.forEach((res, idx) => {
            if (!res) missingRes.push(resourceIds[idx]);
        });
        if (missingRes.length > 0) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'One or more resourceIds do not exist', details: { missing: missingRes } });
        }
    }

    // --- Fetch Existing Event & Resources to Determine Final State ---
    const existingEventResult = await repoFindById(id);
    if (!existingEventResult) {
        return res.status(404).json({ error: true, code: 'NOT_FOUND', message: t('errors.event.not_found', req) });
    }

    // Determine final values after update (what they *will* be)
    const toIso = (val: any): string => (val instanceof Date ? val.toISOString() : String(val));
    const rawStart = startTime ?? existingEventResult.startTime;
    const rawEnd = endTime ?? existingEventResult.endTime;
    const finalStart: string = toIso(rawStart);
    const finalEnd: string = toIso(rawEnd);
    const finalTeamId: string | null = teamId !== undefined ? teamId : (existingEventResult.teamIds && existingEventResult.teamIds.length === 1 ? existingEventResult.teamIds[0] : null);
    const existingResourceIds = existingEventResult.eventResources?.map(er => er.resourceId) ?? [];
    const finalResourceIds = resourceIds !== undefined ? resourceIds : existingResourceIds;

    // --- Conflict Detection ---
    const conflictsOnUpdate = await findConflictingEvents({
        startTime: finalStart,
        endTime: finalEnd,
        resourceIds: finalResourceIds,
        teamId: finalTeamId,
        locationId: locationId !== undefined ? locationId : existingEventResult.locationId,
        excludeEventId: id,
    });

    if (conflictsOnUpdate.length > 0) {
        return res.status(409).json({
            error: true,
            code: 'EVENT_CONFLICT',
            message: t('errors.event.conflict', req),
            conflicts: conflictsOnUpdate,
        });
    }

    // Team existence check (now that we have orgId)
    if (teamId !== undefined) {
        const orgIdForTeam = req.user?.organizationId ?? existingEventResult.organizationId;
        const teamOk = await doesTeamExist(teamId, orgIdForTeam);
        if (!teamOk) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Provided teamId does not exist' });
        }
    }

    try {
        const dto: any = {
            title,
            description,
            startTime,
            endTime,
            eventType,
            locationId,
            teamIds: teamId ? [teamId] : undefined,
            status: status as EventStatusEnum,
            resourceIds,
        };
        const updated = await repoUpdateEvent(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: t('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error(`[Error] Failed to update event ${id}:`, err);
        next(err);
    }
};

/**
 * Delete an event by its ID.
 */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // --- Basic Validation ---
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: t('errors.event.invalid_id', req) });
    }
    // TODO: Add authorization check - who can delete this event?

    try {
        const deleted = await repoDeleteEvent(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: t('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        console.error(`[Error] Failed to delete event ${id}:`, err);
        next(err);
    }
};

/**
 * Get event participants.
 */
export const getEventParticipants = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid event ID format' });
    }

    try {
        const attendees = await attendeeFindByEvent(id);
        return res.status(200).json({ success: true, data: attendees });
    } catch (err) {
        console.error(`[Error] Failed to fetch participants for event ${id}:`, err);
        return _next(err);
    }
};

/**
 * Add an event participant.
 */
export const addEventParticipant = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { userId, status = 'invited', reasonForAbsence } = req.body as { userId: string; status?: string; reasonForAbsence?: string };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id) || !uuidRegex.test(userId)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid UUID format' });
    }

    // Validate status enum
    const allowedStatus = Object.values(AttendeeStatusEnum);
    if (!allowedStatus.includes(status as AttendeeStatusEnum)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid attendee status' });
    }

    // Verify user exists
    const userExists = await doesUserExist(userId);
    if (!userExists) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'User does not exist' });
    }

    try {
        const attendee = await attendeeAdd({
            eventId: id,
            userId,
            status,
            reasonForAbsence: reasonForAbsence ?? null,
        });
        return res.status(201).json({ success: true, data: attendee });
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'User already added to event' });
        }
        console.error(`[Error] Failed to add participant to event ${id}:`, err);
        return _next(err);
    }
};

/**
 * Remove an event participant.
 */
export const removeEventParticipant = async (req: Request, res: Response, _next: NextFunction) => {
    const { eventId, userId } = req.params as { eventId: string; userId: string };
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid UUID format' });
    }

    try {
        const removed = await attendeeRemove(eventId, userId);
        if (!removed) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Participant not found for this event' });
        }
        return res.status(200).json({ success: true, message: 'Participant removed' });
    } catch (err) {
        console.error(`[Error] Failed to remove participant ${userId} from event ${eventId}:`, err);
        return _next(err);
    }
};

/**
 * Simple helper to update only the status field of an event.
 * Route: PATCH /events/:id/status
 */
export const updateEventStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body as { status: string | undefined };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: t('errors.event.invalid_id', req) });
    }

    if (!status) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'status is required' });
    }

    if (!Object.values(EventStatusEnum).includes(status as EventStatusEnum)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid status value' });
    }

    try {
        const updated = await repoUpdateEvent(id, { status: status as EventStatusEnum });
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: t('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error(`[Error] Failed to update status for event ${id}:`, err);
        next(err);
    }
}; 