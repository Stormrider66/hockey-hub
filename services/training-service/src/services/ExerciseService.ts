// @ts-nocheck

import { exerciseRepository } from '../repositories/ExerciseRepository';
import { Exercise, Difficulty } from '../entities/Exercise';
import { AppError } from '../utils/AppError';

interface ExerciseData {
    name: string;
    category: string;
    difficulty: Difficulty;
    description: string;
    instructions: string;
    equipment?: string[];
    muscle_groups?: string[];
    video_url?: string;
    image_url?: string;
    created_by_user_id: string;
    organization_id?: string;
    is_public?: boolean;
}

export class ExerciseService {
    async createExercise(data: ExerciseData): Promise<Exercise> {
        if (!data.name || !data.category || !data.difficulty || !data.description || !data.instructions || !data.created_by_user_id) {
            throw new AppError('VALIDATION_ERROR', 'Missing required fields for exercise', 400);
        }

        return exerciseRepository.createExercise(data);
    }

    async getAllExercises(filters: {
        organizationId?: string;
        category?: string;
        searchTerm?: string;
    }, page: number = 1, limit: number = 20): Promise<{ exercises: Exercise[]; total: number }> {
        const offset = (page - 1) * limit;
        
        const [exercises, total] = await Promise.all([
            exerciseRepository.findExercises(filters, limit, offset),
            exerciseRepository.countExercises(filters)
        ]);

        return { exercises, total };
    }

    async getExerciseById(id: string, organizationId?: string): Promise<Exercise> {
        if (!id) {
            throw new AppError('VALIDATION_ERROR', 'Exercise ID is required', 400);
        }

        const exercise = await exerciseRepository.findExerciseById(id, organizationId);
        if (!exercise) {
            throw new AppError('NOT_FOUND', `Exercise with ID ${id} not found`, 404);
        }
        return exercise;
    }

    async updateExercise(id: string, updates: Partial<ExerciseData>): Promise<Exercise> {
        // Prevent changing creator or organization
        delete updates.created_by_user_id;
        delete updates.organization_id;

        const updatedExercise = await exerciseRepository.updateExercise(id, updates);
        if (!updatedExercise) {
            throw new AppError('NOT_FOUND', `Exercise with ID ${id} not found`, 404);
        }

        return updatedExercise;
    }

    async deleteExercise(id: string): Promise<void> {
        const deleted = await exerciseRepository.deleteExercise(id);
        if (!deleted) {
            throw new AppError('NOT_FOUND', `Exercise with ID ${id} not found for deletion`, 404);
        }
    }
}
