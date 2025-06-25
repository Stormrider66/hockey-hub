"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEventStatus = exports.removeEventParticipant = exports.addEventParticipant = exports.getEventParticipants = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getAllEvents = void 0;
const eventRepository_1 = require("../repositories/eventRepository");
const eventAttendeeRepository_1 = require("../repositories/eventAttendeeRepository");
const conflictDetection_1 = require("../utils/conflictDetection");
const types_1 = require("@hockey-hub/types");
const teamService_1 = require("../services/teamService");
const userService_1 = require("../services/userService");
const locationRepository_1 = require("../repositories/locationRepository");
const resourceRepository_1 = require("../repositories/resourceRepository");
const translate_1 = require("../utils/translate");
// TODO: Add proper error handling and validation
/**
 * Get all calendar events, potentially filtered by query parameters.
 */
const getAllEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { start, end, teamId, eventType, locationId } = req.query;
    try {
        const events = yield (0, eventRepository_1.findAll)({ start, end, teamId, eventType, locationId });
        res.status(200).json({ success: true, data: events });
    }
    catch (err) {
        console.error('[Error] Failed to fetch events:', err);
        next(err);
    }
});
exports.getAllEvents = getAllEvents;
/**
 * Get a single event by its ID, including associated resources.
 */
const getEventById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: (0, translate_1.t)('errors.event.invalid_id', req) });
    }
    try {
        const event = yield (0, eventRepository_1.findById)(id);
        if (!event) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: (0, translate_1.t)('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, data: event });
    }
    catch (err) {
        console.error(`[Error] Failed to fetch event ${id}:`, err);
        next(err);
    }
});
exports.getEventById = getEventById;
/**
 * Create a new calendar event.
 */
const createEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    const createdByUserId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!organizationId || !createdByUserId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }
    const { title, description, startTime, endTime, eventType, locationId, teamIds, resourceIds, status = 'scheduled' } = req.body;
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
    if (!Object.values(types_1.EventType).includes(eventType)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid eventType' });
    }
    if (status && !Object.values(types_1.EventStatus).includes(status)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid status value' });
    }
    // --- Existence Checks (location & resources) ---
    if (locationId) {
        const locExists = yield (0, locationRepository_1.findById)(locationId);
        if (!locExists) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'locationId does not exist' });
        }
    }
    if (resourceIds && resourceIds.length > 0) {
        const resourceChecks = yield Promise.all(resourceIds.map(id => (0, resourceRepository_1.findById)(id)));
        const missing = [];
        resourceChecks.forEach((res, idx) => {
            if (!res)
                missing.push(resourceIds[idx]);
        });
        if (missing.length > 0) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'One or more resourceIds do not exist', details: { missing } });
        }
    }
    // Team existence
    if (teamIds && teamIds.length === 1) {
        const teamOk = yield (0, teamService_1.doesTeamExist)(teamIds[0], organizationId);
        if (!teamOk) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Provided teamId does not exist' });
        }
    }
    // --- Conflict Detection ---
    const conflictEvents = yield (0, conflictDetection_1.findConflictingEvents)({
        startTime,
        endTime,
        resourceIds: resourceIds !== null && resourceIds !== void 0 ? resourceIds : [],
        teamId: teamIds && teamIds.length === 1 ? teamIds[0] : null,
        locationId: locationId !== null && locationId !== void 0 ? locationId : null,
    });
    if (conflictEvents.length > 0) {
        return res.status(409).json({
            error: true,
            code: 'EVENT_CONFLICT',
            message: (0, translate_1.t)('errors.event.conflict', req),
            conflicts: conflictEvents,
        });
    }
    try {
        const eventToSave = {
            organizationId,
            teamIds,
            locationId: locationId !== null && locationId !== void 0 ? locationId : null,
            title,
            description: description !== null && description !== void 0 ? description : null,
            startTime,
            endTime,
            eventType,
            status,
        };
        const saved = yield (0, eventRepository_1.createEvent)(Object.assign(Object.assign({}, eventToSave), { resourceIds }));
        res.status(201).json({ success: true, data: saved });
    }
    catch (err) {
        console.error('[Error] Failed to create event:', err);
        next(err);
    }
});
exports.createEvent = createEvent;
/**
 * Update an existing calendar event.
 */
const updateEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f;
    const { id } = req.params;
    const { title, description, startTime, endTime, eventType, locationId, teamId, resourceIds, // Expecting an array of resource UUIDs
    status } = req.body;
    // --- Basic Validation ---
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: (0, translate_1.t)('errors.event.invalid_id', req) });
    }
    if (startTime && isNaN(Date.parse(startTime))) {
        return res.status(400).json({ error: true, message: 'Invalid date format for startTime' });
    }
    if (endTime && isNaN(Date.parse(endTime))) {
        return res.status(400).json({ error: true, message: 'Invalid date format for endTime' });
    }
    if (startTime && endTime && new Date(endTime) < new Date(startTime)) {
        return res.status(400).json({ error: true, message: 'endTime cannot be before startTime' });
    }
    if (resourceIds && !Array.isArray(resourceIds)) {
        return res.status(400).json({ error: true, message: 'resourceIds must be an array' });
    }
    // Validate enums were handled earlier; now check referenced entities
    if (locationId !== undefined && locationId !== null) {
        const locExists = yield (0, locationRepository_1.findById)(locationId);
        if (!locExists) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'locationId does not exist' });
        }
    }
    if (resourceIds !== undefined) {
        const resourceChecks = yield Promise.all(resourceIds.map(id => (0, resourceRepository_1.findById)(id)));
        const missingRes = [];
        resourceChecks.forEach((res, idx) => {
            if (!res)
                missingRes.push(resourceIds[idx]);
        });
        if (missingRes.length > 0) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'One or more resourceIds do not exist', details: { missing: missingRes } });
        }
    }
    // --- Fetch Existing Event & Resources to Determine Final State ---
    const existingEventResult = yield (0, eventRepository_1.findById)(id);
    if (!existingEventResult) {
        return res.status(404).json({ error: true, code: 'NOT_FOUND', message: (0, translate_1.t)('errors.event.not_found', req) });
    }
    // Determine final values after update (what they *will* be)
    const toIso = (val) => (val instanceof Date ? val.toISOString() : String(val));
    const rawStart = startTime !== null && startTime !== void 0 ? startTime : existingEventResult.startTime;
    const rawEnd = endTime !== null && endTime !== void 0 ? endTime : existingEventResult.endTime;
    const finalStart = toIso(rawStart);
    const finalEnd = toIso(rawEnd);
    const finalTeamId = teamId !== undefined ? teamId : (existingEventResult.teamIds && existingEventResult.teamIds.length === 1 ? existingEventResult.teamIds[0] : null);
    const existingResourceIds = (_d = (_c = existingEventResult.eventResources) === null || _c === void 0 ? void 0 : _c.map(er => er.resourceId)) !== null && _d !== void 0 ? _d : [];
    const finalResourceIds = resourceIds !== undefined ? resourceIds : existingResourceIds;
    // --- Conflict Detection ---
    const conflictsOnUpdate = yield (0, conflictDetection_1.findConflictingEvents)({
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
            message: (0, translate_1.t)('errors.event.conflict', req),
            conflicts: conflictsOnUpdate,
        });
    }
    // Team existence check (now that we have orgId)
    if (teamId !== undefined) {
        const orgIdForTeam = (_f = (_e = req.user) === null || _e === void 0 ? void 0 : _e.organizationId) !== null && _f !== void 0 ? _f : existingEventResult.organizationId;
        const teamOk = yield (0, teamService_1.doesTeamExist)(teamId, orgIdForTeam);
        if (!teamOk) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Provided teamId does not exist' });
        }
    }
    try {
        const dto = {
            title,
            description,
            startTime,
            endTime,
            eventType,
            locationId,
            teamIds: teamId ? [teamId] : undefined,
            status: status,
            resourceIds,
        };
        const updated = yield (0, eventRepository_1.updateEvent)(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: (0, translate_1.t)('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, data: updated });
    }
    catch (err) {
        console.error(`[Error] Failed to update event ${id}:`, err);
        next(err);
    }
});
exports.updateEvent = updateEvent;
/**
 * Delete an event by its ID.
 */
const deleteEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // --- Basic Validation ---
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: (0, translate_1.t)('errors.event.invalid_id', req) });
    }
    // TODO: Add authorization check - who can delete this event?
    try {
        const deleted = yield (0, eventRepository_1.deleteEvent)(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: (0, translate_1.t)('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    }
    catch (err) {
        console.error(`[Error] Failed to delete event ${id}:`, err);
        next(err);
    }
});
exports.deleteEvent = deleteEvent;
/**
 * Get event participants.
 */
const getEventParticipants = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid event ID format' });
    }
    try {
        const attendees = yield (0, eventAttendeeRepository_1.findByEvent)(id);
        return res.status(200).json({ success: true, data: attendees });
    }
    catch (err) {
        console.error(`[Error] Failed to fetch participants for event ${id}:`, err);
        return _next(err);
    }
});
exports.getEventParticipants = getEventParticipants;
/**
 * Add an event participant.
 */
const addEventParticipant = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { userId, status = 'invited', reasonForAbsence } = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id) || !uuidRegex.test(userId)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid UUID format' });
    }
    // Validate status enum
    const allowedStatus = Object.values(types_1.AttendeeStatus);
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid attendee status' });
    }
    // Verify user exists
    const userExists = yield (0, userService_1.doesUserExist)(userId);
    if (!userExists) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'User does not exist' });
    }
    try {
        const attendee = yield (0, eventAttendeeRepository_1.addAttendee)({
            eventId: id,
            userId,
            status,
            reasonForAbsence: reasonForAbsence !== null && reasonForAbsence !== void 0 ? reasonForAbsence : null,
        });
        return res.status(201).json({ success: true, data: attendee });
    }
    catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'User already added to event' });
        }
        console.error(`[Error] Failed to add participant to event ${id}:`, err);
        return _next(err);
    }
});
exports.addEventParticipant = addEventParticipant;
/**
 * Remove an event participant.
 */
const removeEventParticipant = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId, userId } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid UUID format' });
    }
    try {
        const removed = yield (0, eventAttendeeRepository_1.removeAttendee)(eventId, userId);
        if (!removed) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Participant not found for this event' });
        }
        return res.status(200).json({ success: true, message: 'Participant removed' });
    }
    catch (err) {
        console.error(`[Error] Failed to remove participant ${userId} from event ${eventId}:`, err);
        return _next(err);
    }
});
exports.removeEventParticipant = removeEventParticipant;
/**
 * Simple helper to update only the status field of an event.
 * Route: PATCH /events/:id/status
 */
const updateEventStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: (0, translate_1.t)('errors.event.invalid_id', req) });
    }
    if (!status) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'status is required' });
    }
    if (!Object.values(types_1.EventStatus).includes(status)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid status value' });
    }
    try {
        const updated = yield (0, eventRepository_1.updateEvent)(id, { status: status });
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: (0, translate_1.t)('errors.event.not_found', req) });
        }
        res.status(200).json({ success: true, data: updated });
    }
    catch (err) {
        console.error(`[Error] Failed to update status for event ${id}:`, err);
        next(err);
    }
});
exports.updateEventStatus = updateEventStatus;
