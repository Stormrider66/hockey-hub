import { Request, Response, NextFunction } from 'express';
import * as TemplateRepository from '../repositories/PhysicalTemplateRepository';
import { PhysicalSessionTemplate } from '../types/training';

// TODO: Add validation, authorization, error handling

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId, search, isPublic, page = 1, limit = 20 } = req.query;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id'; 
    const filters = {
        organizationId,
        categoryId: categoryId as string | undefined,
        searchTerm: search as string | undefined,
        isPublic: isPublic !== undefined ? (isPublic === 'true') : undefined,
    };
    const limitNum = parseInt(limit as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limitNum;

    try {
        const templates = await TemplateRepository.findTemplates(filters, limitNum, offset);
        const total = await TemplateRepository.countTemplates(filters);
        res.status(200).json({ 
            success: true, 
            data: templates,
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

export const getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id'; 
    // TODO: Validate ID
    try {
        const template = await TemplateRepository.findTemplateById(id, organizationId);
        if (!template) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found or not accessible' });
        }
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
};

export const createTemplateHandler = async (req: Request, res: Response, next: NextFunction) => {
    const templateData = req.body as Partial<PhysicalSessionTemplate>; 
    // TODO: Get organizationId and createdByUserId from req.user
    const organizationId = 'placeholder-org-id';
    const createdByUserId = 'placeholder-user-id';

    // TODO: Add robust validation (Zod/Joi), especially for the sections JSON
    if (!templateData.name || !templateData.categoryId || !templateData.sections) {
        return res.status(400).json({ error: true, code: 'VALIDATION_ERROR', message: 'Missing required fields: name, categoryId, sections' });
    }

    try {
        const dataToSave: Omit<PhysicalSessionTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
            name: templateData.name,
            description: templateData.description,
            categoryId: templateData.categoryId,
            createdByUserId,
            organizationId,
            sections: templateData.sections, // Assume sections structure is validated
            estimatedDuration: templateData.estimatedDuration,
            isPublic: templateData.isPublic || false
        };
        const newTemplate = await TemplateRepository.createTemplate(dataToSave);
        res.status(201).json({ success: true, data: newTemplate });
    } catch (error) {
        next(error);
    }
};

export const updateTemplateHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body as Partial<PhysicalSessionTemplate>;
    // TODO: Get organizationId from req.user for authorization check
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID and updateData (especially sections JSON)
    // TODO: Check user has permission to update this template

    // Prevent changing ownership fields
    delete updateData.organizationId;
    delete updateData.createdByUserId;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    try {
        const updatedTemplate = await TemplateRepository.updateTemplate(id, organizationId, updateData);
        if (!updatedTemplate) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found or not accessible' });
        }
        res.status(200).json({ success: true, data: updatedTemplate });
    } catch (error) {
        next(error);
    }
};

export const deleteTemplateHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // TODO: Get organizationId from req.user
    const organizationId = 'placeholder-org-id';
    // TODO: Validate ID
    // TODO: Check permissions
    
    try {
        const deleted = await TemplateRepository.deleteTemplate(id, organizationId);
        if (!deleted) {
            return res.status(404).json({ error: true, code: 'NOT_FOUND', message: 'Template not found or not accessible' });
        }
        res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// TODO: Add handler for copying a template (POST /:id/copy)
export const copyTemplateHandler = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
     // TODO: Implement logic to fetch template, modify ownership/name, and create new one
    res.status(501).json({ message: `POST /${id}/copy Not Implemented Yet`});
}; 