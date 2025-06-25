"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getResourcesAvailability = exports.getResourceAvailability = exports.deleteResource = exports.updateResource = exports.createResource = exports.getResourceById = exports.getAllResources = exports.deleteResourceType = exports.updateResourceType = exports.createResourceType = exports.getResourceTypeById = exports.getAllResourceTypes = void 0;
const resourceTypeRepository_1 = require("../repositories/resourceTypeRepository");
const resourceRepository_1 = require("../repositories/resourceRepository");
// TODO: Add proper error handling, validation, and authorization
// --- Resource Type Handlers ---
const getAllResourceTypes = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { organizationId } = req.query;
        const types = yield (0, resourceTypeRepository_1.findAll)({ organizationId: organizationId });
        return res.status(200).json({ success: true, data: types });
    }
    catch (err) {
        console.error('[Error] Failed to fetch resource types:', err);
        return next(err);
    }
});
exports.getAllResourceTypes = getAllResourceTypes;
const getResourceTypeById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource type ID format' });
    }
    try {
        const type = yield (0, resourceTypeRepository_1.findById)(id);
        if (!type) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        return res.status(200).json({ success: true, data: type });
    }
    catch (err) {
        console.error(`[Error] Failed to fetch resource type ${id}:`, err);
        return next(err);
    }
});
exports.getResourceTypeById = getResourceTypeById;
const createResourceType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: true, message: 'Missing required field: name' });
    }
    try {
        const newType = yield (0, resourceTypeRepository_1.createResourceType)({ organizationId, name, description });
        return res.status(201).json({ success: true, data: newType });
    }
    catch (err) {
        console.error('[Error] Failed to create resource type:', err);
        return next(err);
    }
});
exports.createResourceType = createResourceType;
const updateResourceType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource type ID format' });
    }
    const dto = Object.assign({}, req.body);
    if (Object.keys(dto).length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }
    try {
        const updated = yield (0, resourceTypeRepository_1.updateResourceType)(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        return res.status(200).json({ success: true, data: updated });
    }
    catch (err) {
        console.error(`[Error] Failed to update resource type ${id}:`, err);
        return next(err);
    }
});
exports.updateResourceType = updateResourceType;
const deleteResourceType = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource type ID format' });
    }
    try {
        const deleted = yield (0, resourceTypeRepository_1.deleteResourceType)(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource type not found' });
        }
        return res.status(200).json({ success: true, message: 'Resource type deleted successfully' });
    }
    catch (err) {
        if (err.code === '23503') {
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete resource type because it is still in use by resources.' });
        }
        console.error(`[Error] Failed to delete resource type ${id}:`, err);
        return next(err);
    }
});
exports.deleteResourceType = deleteResourceType;
// --- Resource Handlers ---
const getAllResources = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { organizationId: orgId, locationId, resourceTypeId } = req.query;
    // TODO: Filter by user's org ID from token
    try {
        const resources = yield (0, resourceRepository_1.findAll)({
            organizationId: orgId,
            locationId: locationId,
            resourceTypeId: resourceTypeId,
        });
        return res.status(200).json({ success: true, data: resources });
    }
    catch (err) {
        console.error('[Error] Failed to fetch resources:', err);
        return next(err);
    }
});
exports.getAllResources = getAllResources;
const getResourceById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }
    try {
        const resource = yield (0, resourceRepository_1.findById)(id);
        if (!resource) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        return res.status(200).json({ success: true, data: resource });
    }
    catch (err) {
        console.error(`[Error] Failed to fetch resource ${id}:`, err);
        return next(err);
    }
});
exports.getResourceById = getResourceById;
const createResource = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
    if (!organizationId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }
    const { name, description, resourceTypeId, locationId, capacity, isBookable = true } = req.body;
    if (!name || !resourceTypeId || !locationId) {
        return res.status(400).json({ error: true, message: 'Missing required fields: name, resourceTypeId, locationId' });
    }
    try {
        const newResource = yield (0, resourceRepository_1.createResource)({
            organizationId,
            name,
            description,
            resourceTypeId,
            locationId,
            capacity,
            isBookable,
        });
        return res.status(201).json({ success: true, data: newResource });
    }
    catch (err) {
        console.error('[Error] Failed to create resource:', err);
        return next(err);
    }
});
exports.createResource = createResource;
const updateResource = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }
    const dto = Object.assign({}, req.body);
    if (Object.keys(dto).length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }
    try {
        const updated = yield (0, resourceRepository_1.updateResource)(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        return res.status(200).json({ success: true, data: updated });
    }
    catch (err) {
        console.error(`[Error] Failed to update resource ${id}:`, err);
        return next(err);
    }
});
exports.updateResource = updateResource;
const deleteResource = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }
    try {
        const deleted = yield (0, resourceRepository_1.deleteResource)(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found' });
        }
        return res.status(200).json({ success: true, message: 'Resource deleted successfully' });
    }
    catch (err) {
        if (err.code === '23503') {
            console.error(`[Error] Attempted to delete resource ${id} which is still in use.`);
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete resource because it is still referenced (check FK constraints).' });
        }
        console.error(`[Error] Failed to delete resource ${id}:`, err);
        return next(err);
    }
});
exports.deleteResource = deleteResource;
// Placeholder for getResourceAvailability - Implement later
const getResourceAvailability = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { start, end } = req.query;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format' });
    }
    if (!start || !end) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'start and end query parameters are required' });
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid date format for start or end' });
    }
    if (endDate <= startDate) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'end must be after start' });
    }
    // Check resource exists and is bookable
    const resource = yield (0, resourceRepository_1.findById)(id);
    if (!resource || !resource.isBookable) {
        return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Resource not found or not bookable' });
    }
    // Find conflicting events using conflictDetection util
    const { findConflictingEvents } = yield Promise.resolve().then(() => __importStar(require('../utils/conflictDetection')));
    const conflicts = yield findConflictingEvents({
        startTime: start,
        endTime: end,
        resourceIds: [id],
    });
    const available = conflicts.length === 0;
    res.status(200).json({ success: true, data: { available, conflicts } });
});
exports.getResourceAvailability = getResourceAvailability;
/**
 * Bulk availability checker for multiple resources within a time window.
 * Query params:
 *   ids  – comma-separated list of resource UUIDs (required)
 *   start, end – ISO strings (required)
 *   granularityMinutes – optional positive integer; if provided, the response includes slot availability.
 */
const getResourcesAvailability = (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids, start, end, granularityMinutes } = req.query;
    if (!ids || !start || !end) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'ids, start and end query parameters are required' });
    }
    const resourceIds = ids.split(',').map(id => id.trim()).filter(Boolean);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (resourceIds.some(id => !uuidRegex.test(id))) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid resource ID format in ids list' });
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid start/end values' });
    }
    // Verify all resources exist & are bookable
    const resources = yield Promise.all(resourceIds.map(rid => (0, resourceRepository_1.findById)(rid)));
    const missing = [];
    const validResources = [];
    resources.forEach((resItem, idx) => {
        if (!resItem || !resItem.isBookable) {
            missing.push(resourceIds[idx]);
        }
        else {
            validResources.push(resItem);
        }
    });
    if (missing.length > 0) {
        return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Some resources not found or not bookable', details: { missing } });
    }
    // Conflicts
    const { findConflictingEvents } = yield Promise.resolve().then(() => __importStar(require('../utils/conflictDetection')));
    const conflicts = yield findConflictingEvents({
        startTime: start,
        endTime: end,
        resourceIds,
    });
    const busyByResource = {};
    resourceIds.forEach(id => (busyByResource[id] = []));
    conflicts.forEach(c => {
        busyByResource[c.conflict_identifier].push(c);
    });
    const summary = resourceIds.map(id => ({ id, available: busyByResource[id].length === 0 }));
    // Slot calculation if granularityMinutes provided
    let slots;
    if (granularityMinutes) {
        const step = parseInt(granularityMinutes, 10);
        if (isNaN(step) || step <= 0) {
            return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'granularityMinutes must be a positive integer' });
        }
        slots = [];
        for (let t = startDate.getTime(); t < endDate.getTime(); t += step * 60000) {
            const slotStart = new Date(t);
            const slotEnd = new Date(Math.min(t + step * 60000, endDate.getTime()));
            const unavailable = [];
            resourceIds.forEach(rid => {
                const hasOverlap = busyByResource[rid].some(evt => {
                    return new Date(evt.start_time).getTime() < slotEnd.getTime() && new Date(evt.end_time).getTime() > slotStart.getTime();
                });
                if (hasOverlap)
                    unavailable.push(rid);
            });
            slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), unavailableResourceIds: unavailable });
        }
    }
    res.status(200).json({ success: true, data: { resources: summary, slots } });
});
exports.getResourcesAvailability = getResourcesAvailability;
