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
exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocationById = exports.getAllLocations = void 0;
const locationRepository_1 = require("../repositories/locationRepository");
// TODO: Add proper error handling, validation, and authorization
/**
 * Get all locations, potentially filtered.
 */
const getAllLocations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { organizationId } = req.query;
        const locations = yield (0, locationRepository_1.findAll)({ organizationId: organizationId });
        return res.status(200).json({ success: true, data: locations });
    }
    catch (err) {
        console.error('[Error] Failed to fetch locations:', err);
        return next(err);
    }
});
exports.getAllLocations = getAllLocations;
/**
 * Get a single location by ID.
 */
const getLocationById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }
    try {
        const location = yield (0, locationRepository_1.findById)(id);
        if (!location) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        return res.status(200).json({ success: true, data: location });
    }
    catch (err) {
        console.error(`[Error] Failed to fetch location ${id}:`, err);
        return next(err);
    }
});
exports.getLocationById = getLocationById;
/**
 * Create a new location.
 */
const createLocation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId;
    if (!organizationId) {
        return res.status(401).json({ error: true, code: 'UNAUTHENTICATED', message: 'Missing user context' });
    }
    const { name, description, street, city, postalCode, country, stateProvince, latitude, longitude, } = req.body; // Assumed validated by Zod middleware
    try {
        const newLocation = yield (0, locationRepository_1.createLocation)({
            organizationId,
            name,
            description,
            street,
            city,
            postalCode,
            country,
            stateProvince,
            latitude,
            longitude,
        });
        console.log('[Success] Location created:', newLocation);
        return res.status(201).json({ success: true, data: newLocation });
    }
    catch (err) {
        console.error('[Error] Failed to create location:', err);
        return next(err);
    }
});
exports.createLocation = createLocation;
/**
 * Update an existing location.
 */
const updateLocation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }
    const dto = Object.assign({}, req.body);
    if (Object.keys(dto).length === 0) {
        return res.status(400).json({ error: true, message: 'No update data provided' });
    }
    try {
        const updated = yield (0, locationRepository_1.updateLocation)(id, dto);
        if (!updated) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        console.log('[Success] Location updated:', updated);
        return res.status(200).json({ success: true, data: updated });
    }
    catch (err) {
        console.error(`[Error] Failed to update location ${id}:`, err);
        return next(err);
    }
});
exports.updateLocation = updateLocation;
/**
 * Delete a location.
 */
const deleteLocation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Invalid location ID format' });
    }
    try {
        const deleted = yield (0, locationRepository_1.deleteLocation)(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Location not found' });
        }
        console.log(`[Success] Location deleted: ${id}`);
        return res.status(200).json({ success: true, message: 'Location deleted successfully' });
    }
    catch (err) {
        if (err.code === '23503') {
            console.error(`[Error] Attempted to delete location ${id} which is still in use.`);
            return res.status(409).json({ error: true, code: 'RESOURCE_CONFLICT', message: 'Cannot delete location because it is still referenced by events or resources.' });
        }
        console.error(`[Error] Failed to delete location ${id}:`, err);
        return next(err);
    }
});
exports.deleteLocation = deleteLocation;
