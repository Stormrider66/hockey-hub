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
exports.ExerciseService = void 0;
const ExerciseRepository_1 = require("../repositories/ExerciseRepository");
const AppError_1 = require("../utils/AppError");
class ExerciseService {
    createExercise(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.name || !data.category || !data.difficulty || !data.description || !data.instructions || !data.created_by_user_id) {
                throw new AppError_1.AppError('VALIDATION_ERROR', 'Missing required fields for exercise', 400);
            }
            return ExerciseRepository_1.exerciseRepository.createExercise(data);
        });
    }
    getAllExercises(filters, page = 1, limit = 20) {
        return __awaiter(this, void 0, void 0, function* () {
            const offset = (page - 1) * limit;
            const [exercises, total] = yield Promise.all([
                ExerciseRepository_1.exerciseRepository.findExercises(filters, limit, offset),
                ExerciseRepository_1.exerciseRepository.countExercises(filters)
            ]);
            return { exercises, total };
        });
    }
    getExerciseById(id, organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                throw new AppError_1.AppError('VALIDATION_ERROR', 'Exercise ID is required', 400);
            }
            const exercise = yield ExerciseRepository_1.exerciseRepository.findExerciseById(id, organizationId);
            if (!exercise) {
                throw new AppError_1.AppError('NOT_FOUND', `Exercise with ID ${id} not found`, 404);
            }
            return exercise;
        });
    }
    updateExercise(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent changing creator or organization
            delete updates.created_by_user_id;
            delete updates.organization_id;
            const updatedExercise = yield ExerciseRepository_1.exerciseRepository.updateExercise(id, updates);
            if (!updatedExercise) {
                throw new AppError_1.AppError('NOT_FOUND', `Exercise with ID ${id} not found`, 404);
            }
            return updatedExercise;
        });
    }
    deleteExercise(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleted = yield ExerciseRepository_1.exerciseRepository.deleteExercise(id);
            if (!deleted) {
                throw new AppError_1.AppError('NOT_FOUND', `Exercise with ID ${id} not found for deletion`, 404);
            }
        });
    }
}
exports.ExerciseService = ExerciseService;
