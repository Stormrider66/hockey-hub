// @ts-nocheck

import { Request, Response, NextFunction } from 'express';
import { exerciseRepository } from '../repositories/ExerciseRepository';
import { Exercise } from '../types/exercise';

// TODO: Add validation, authorization, error handling

export const getExercises = async (req: Request, res: Response, next: NextFunction) => {
    const { category, search, page = 1, limit = 20 } = req.query;
    // TODO: Get organizationId from authenticated user (req.user)
    const organizationId = 'placeholder-org-id'; // Replace later
    const filters = {
        organizationId,
        category: category as string | undefined,
        searchTerm: search as string | undefined
    };
    const limitNum = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limitNum;

    try {
        const exercises = await exerciseRepository.findExercises(filters, limitNum, offset);
        const total = await exerciseRepository.countExercises(filters);
        res.status(200).json({ 
            success: true, 
            data: exercises,
            meta: {
                pagination: {
                    page: parseInt(page as string, 10),
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
         });
    } catch (error) {
        next(error);
    }
};

export const getExerciseById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Get organizationId from authenticated user (req.user)
    const organizationId = 'placeholder-org-id'; // Replace later
    // TODO: Validate ID format
    try {
        const exercise = await exerciseRepository.findExerciseById(id, organizationId);
        if (!exercise) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Exercise not found or not accessible' });
        }
        res.status(200).json({ success: true, data: exercise });
    } catch (error) {
        next(error);
    }
};

export const createExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
    const exerciseData = req.body as Partial<Exercise>; // Basic type assertion
    // TODO: Get organizationId and createdByUserId from req.user
    const organizationId = 'placeholder-org-id'; // Replace later
    const createdByUserId = 'placeholder-user-id'; // Replace later

    // TODO: Add robust validation (Zod/Joi)
    if (!exerciseData.name) { 
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: name' });
    }

    try {
        const newExercise = await exerciseRepository.createExercise({
            ...exerciseData,
            organizationId: exerciseData.isPublic ? undefined : organizationId, // Org ID only if not public
            createdByUserId,
            name: exerciseData.name, // Ensure required name is passed
            // These fields are optional or have defaults in the repository
        } as Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>); 

        res.status(201).json({ success: true, data: newExercise });
    } catch (error) {
        next(error);
    }
};

export const updateExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body as Partial<Exercise>;
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
        
        const updatedExercise = await exerciseRepository.updateExercise(id, updateData);
        if (!updatedExercise) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Exercise not found' });
        }
        res.status(200).json({ success: true, data: updatedExercise });
    } catch (error) {
        next(error);
    }
};

export const deleteExerciseHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // Comment out unused variable for now
    // const organizationId = 'placeholder-org-id';
    // TODO: Validate ID 
    // TODO: Check user has permission to delete this exercise
    
    try {
        // Potential check: Fetch exercise first to verify ownership/existence for non-public
        // const existing = await exerciseRepository.findExerciseById(id, organizationId);
        // if (!existing) { ... return 404 or 403 ... }
        
        const deleted = await exerciseRepository.deleteExercise(id);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Exercise not found' });
        }
        res.status(200).json({ success: true, message: 'Exercise deleted successfully' });
    } catch (error) {
        next(error);
    }
}; 