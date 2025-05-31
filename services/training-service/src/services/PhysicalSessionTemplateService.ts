import { physicalSessionTemplateRepository } from '../repositories/PhysicalSessionTemplateRepository';
import { PhysicalSessionTemplate } from '../entities/PhysicalSessionTemplate';
import { AppError } from '../utils/AppError';

interface TemplateData {
    name: string;
    categoryId: string;
    description?: string;
    structure: object;
    created_by_user_id: string;
    organization_id: string;
    is_public?: boolean;
}

export class PhysicalSessionTemplateService {
    async createTemplate(data: TemplateData): Promise<PhysicalSessionTemplate> {
        if (!data.name || !data.categoryId || !data.structure || !data.created_by_user_id || !data.organization_id) {
            throw new AppError('VALIDATION_ERROR', 'Missing required fields for template', 400);
        }

        return physicalSessionTemplateRepository.createTemplate(data);
    }

    async getAllTemplates(filters: {
        organizationId?: string;
        categoryId?: string;
        searchTerm?: string;
    }, page: number = 1, limit: number = 20): Promise<{ templates: PhysicalSessionTemplate[]; total: number }> {
        const offset = (page - 1) * limit;
        
        const [templates, total] = await Promise.all([
            physicalSessionTemplateRepository.findTemplates(filters, limit, offset),
            physicalSessionTemplateRepository.countTemplates(filters)
        ]);

        return { templates, total };
    }

    async getTemplateById(id: string, organizationId?: string): Promise<PhysicalSessionTemplate> {
        if (!id) {
            throw new AppError('VALIDATION_ERROR', 'Template ID is required', 400);
        }

        const template = await physicalSessionTemplateRepository.findTemplateById(id, organizationId);
        if (!template) {
            throw new AppError('NOT_FOUND', `Template with ID ${id} not found`, 404);
        }
        return template;
    }

    async updateTemplate(id: string, updates: Partial<TemplateData>): Promise<PhysicalSessionTemplate> {
        // Prevent changing creator or organization
        delete updates.created_by_user_id;
        delete updates.organization_id;

        const updatedTemplate = await physicalSessionTemplateRepository.updateTemplate(id, updates);
        if (!updatedTemplate) {
            throw new AppError('NOT_FOUND', `Template with ID ${id} not found`, 404);
        }

        return updatedTemplate;
    }

    async deleteTemplate(id: string): Promise<void> {
        const deleted = await physicalSessionTemplateRepository.deleteTemplate(id);
        if (!deleted) {
            throw new AppError('NOT_FOUND', `Template with ID ${id} not found for deletion`, 404);
        }
    }
}