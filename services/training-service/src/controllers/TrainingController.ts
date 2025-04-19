import { Request, Response, NextFunction } from 'express';
import { ExerciseService } from '../services/ExerciseService';
import { PhysicalSessionTemplateService } from '../services/PhysicalSessionTemplateService';

// Extend Express Request to include user property
declare module 'express' {
    interface Request {
        user?: {
            id: string;
            organizationId: string;
        };
    }
}

export class TrainingController {
    private exerciseService: ExerciseService;
    private templateService: PhysicalSessionTemplateService;

    constructor() {
        this.exerciseService = new ExerciseService();
        this.templateService = new PhysicalSessionTemplateService();
        this.createExercise = this.createExercise.bind(this);
        this.getExercises = this.getExercises.bind(this);
        this.getExerciseById = this.getExerciseById.bind(this);
        this.updateExercise = this.updateExercise.bind(this);
        this.deleteExercise = this.deleteExercise.bind(this);
        this.createTemplate = this.createTemplate.bind(this);
        this.getTemplates = this.getTemplates.bind(this);
        this.getTemplateById = this.getTemplateById.bind(this);
        this.updateTemplate = this.updateTemplate.bind(this);
        this.deleteTemplate = this.deleteTemplate.bind(this);
    }

    async createExercise(req: Request, res: Response, next: NextFunction) {
        try {
            const created_by_user_id = req.user?.id || 'mock-user-id';
            const organization_id = req.user?.organizationId;

            const exerciseData = { ...req.body, created_by_user_id, organization_id };
            const exercise = await this.exerciseService.createExercise(exerciseData);
            res.status(201).json({ success: true, data: exercise });
        } catch (error) {
            next(error);
        }
    }

    async getExercises(req: Request, res: Response, next: NextFunction) {
        try {
            const { category, search, page = '1', limit = '20' } = req.query;
            const organizationId = req.user?.organizationId;

            const filters = {
                organizationId,
                category: category as string | undefined,
                searchTerm: search as string | undefined
            };

            const { exercises, total } = await this.exerciseService.getAllExercises(
                filters,
                parseInt(page as string, 10),
                parseInt(limit as string, 10)
            );

            res.json({
                success: true,
                data: exercises,
                meta: {
                    pagination: {
                        page: parseInt(page as string, 10),
                        limit: parseInt(limit as string, 10),
                        total,
                        pages: Math.ceil(total / parseInt(limit as string, 10))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getExerciseById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            const exercise = await this.exerciseService.getExerciseById(id, organizationId);
            res.json({ success: true, data: exercise });
        } catch (error) {
            next(error);
        }
    }

    async updateExercise(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { created_by_user_id, organization_id, ...updates } = req.body;
            const updatedExercise = await this.exerciseService.updateExercise(id, updates);
            res.json({ success: true, data: updatedExercise });
        } catch (error) {
            next(error);
        }
    }

    async deleteExercise(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await this.exerciseService.deleteExercise(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async createTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const created_by_user_id = req.user?.id || 'mock-user-id';
            const organization_id = req.user?.organizationId || 'mock-org-id';

            const templateData = { ...req.body, created_by_user_id, organization_id };
            const template = await this.templateService.createTemplate(templateData);
            res.status(201).json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    }

    async getTemplates(req: Request, res: Response, next: NextFunction) {
        try {
            const { categoryId, search, page = '1', limit = '20' } = req.query;
            const organizationId = req.user?.organizationId;

            const filters = {
                organizationId,
                categoryId: categoryId as string | undefined,
                searchTerm: search as string | undefined
            };

            const { templates, total } = await this.templateService.getAllTemplates(
                filters,
                parseInt(page as string, 10),
                parseInt(limit as string, 10)
            );

            res.json({
                success: true,
                data: templates,
                meta: {
                    pagination: {
                        page: parseInt(page as string, 10),
                        limit: parseInt(limit as string, 10),
                        total,
                        pages: Math.ceil(total / parseInt(limit as string, 10))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getTemplateById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const organizationId = req.user?.organizationId;
            const template = await this.templateService.getTemplateById(id, organizationId);
            res.json({ success: true, data: template });
        } catch (error) {
            next(error);
        }
    }

    async updateTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { created_by_user_id, organization_id, ...updates } = req.body;
            const updatedTemplate = await this.templateService.updateTemplate(id, updates);
            res.json({ success: true, data: updatedTemplate });
        } catch (error) {
            next(error);
        }
    }

    async deleteTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await this.templateService.deleteTemplate(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
} 