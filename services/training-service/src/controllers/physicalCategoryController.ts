import { Request, Response, NextFunction } from 'express';
import * as CategoryRepository from '../repositories/physicalCategoryRepository';
import { PhysicalSessionCategory } from '../types/training';

// TODO: Add validation, authorization, error handling

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id'; 
    try {
        const categories = await CategoryRepository.findCategoriesByOrgId(organizationId);
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id'; 
    // TODO: Validate ID
    try {
        const category = await CategoryRepository.findCategoryById(id, organizationId);
        if (!category) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Category not found or not accessible' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

export const createCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;
    // TODO: Get organizationId and createdByUserId from req.user
    const organizationId = 'placeholder-org-id';
    const createdByUserId = 'placeholder-user-id';

    if (!name) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: name' });
    }

    try {
        const categoryData: Omit<PhysicalSessionCategory, 'id' | 'createdAt' | 'updatedAt'> = {
            name,
            organizationId,
            createdByUserId
        };
        const newCategory = await CategoryRepository.createCategory(categoryData);
        res.status(201).json({ success: true, data: newCategory });
    } catch (error) {
        // TODO: Handle potential unique constraint errors (name per org)
        next(error);
    }
};

export const updateCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name } = req.body;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID and name
    if (!name) {
         return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required field: name' });
    }

    try {
        const updatedCategory = await CategoryRepository.updateCategory(id, organizationId, { name });
        if (!updatedCategory) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Category not found or not accessible' });
        }
        res.status(200).json({ success: true, data: updatedCategory });
    } catch (error) {
        next(error);
    }
};

export const deleteCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
     // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID

    try {
        const deleted = await CategoryRepository.deleteCategory(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Category not found or not accessible' });
        }
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
}; 