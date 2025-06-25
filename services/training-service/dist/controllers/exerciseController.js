"use strict";
// @ts-nocheck
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
exports.deleteExerciseHandler = exports.updateExerciseHandler = exports.createExerciseHandler = exports.getExerciseById = exports.getExercises = void 0;
const ExerciseRepository_1 = require("../repositories/ExerciseRepository");
// TODO: Add validation, authorization, error handling
const getExercises = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, search, page = 1, limit = 20 } = req.query;
    // TODO: Get organizationId from authenticated user (req.user)
    const organizationId = 'placeholder-org-id'; // Replace later
    const filters = {
        organizationId,
        category: category,
        searchTerm: search
    };
    const limitNum = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitNum;
    try {
        const exercises = yield ExerciseRepository_1.exerciseRepository.findExercises(filters, limitNum, offset);
        const total = yield ExerciseRepository_1.exerciseRepository.countExercises(filters);
        res.status(200).json({
            success: true,
            data: exercises,
            meta: {
                pagination: {
                    page: parseInt(page, 10),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getExercises = getExercises;
const getExerciseById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // TODO: Get organizationId from authenticated user (req.user)
    const organizationId = 'placeholder-org-id'; // Replace later
    // TODO: Validate ID format
    try {
        const exercise = yield ExerciseRepository_1.exerciseRepository.findExerciseById(id, organizationId);
        if (!exercise) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Exercise not found or not accessible' });
        }
        res.status(200).json({ success: true, data: exercise });
    }
    catch (error) {
        next(error);
    }
});
exports.getExerciseById = getExerciseById;
const createExerciseHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const exerciseData = req.body; // Basic type assertion
    // TODO: Get organizationId and createdByUserId from req.user
    const organizationId = 'placeholder-org-id'; // Replace later
    const createdByUserId = 'placeholder-user-id'; // Replace later
    // TODO: Add robust validation (Zod/Joi)
    if (!exerciseData.name) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: name' });
    }
    try {
        const newExercise = yield ExerciseRepository_1.exerciseRepository.createExercise(Object.assign(Object.assign({}, exerciseData), { organizationId: exerciseData.isPublic ? undefined : organizationId, // Org ID only if not public
            createdByUserId, name: exerciseData.name }));
        res.status(201).json({ success: true, data: newExercise });
    }
    catch (error) {
        next(error);
    }
});
exports.createExerciseHandler = createExerciseHandler;
const updateExerciseHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updateData = req.body;
    // Comment out unused variable for now
    // const organizationId = 'placeholder-org-id';
    // TODO: Validate ID and updateData
    // TODO: Check user has permission to update this exercise (created by them or admin in org)
    // Prevent changing ownership fields
    delete updateData.organizationId;
    delete updateData.createdByUserId;
    delete updateData.isPublic;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    try {
        // Potential check: Fetch exercise first to verify ownership/existence for non-public
        // const existing = await exerciseRepository.findExerciseById(id, organizationId);
        // if (!existing) { ... return 404 or 403 ... }
        // Add more complex auth logic here based on who can update what
        const updatedExercise = yield ExerciseRepository_1.exerciseRepository.updateExercise(id, updateData);
        if (!updatedExercise) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Exercise not found' });
        }
        res.status(200).json({ success: true, data: updatedExercise });
    }
    catch (error) {
        next(error);
    }
});
exports.updateExerciseHandler = updateExerciseHandler;
const deleteExerciseHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Comment out unused variable for now
    // const organizationId = 'placeholder-org-id';
    // TODO: Validate ID 
    // TODO: Check user has permission to delete this exercise
    try {
        // Potential check: Fetch exercise first to verify ownership/existence for non-public
        // const existing = await exerciseRepository.findExerciseById(id, organizationId);
        // if (!existing) { ... return 404 or 403 ... }
        const deleted = yield ExerciseRepository_1.exerciseRepository.deleteExercise(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Exercise not found' });
        }
        res.status(200).json({ success: true, message: 'Exercise deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteExerciseHandler = deleteExerciseHandler;
