"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTemplateService = void 0;
const database_1 = require("../config/database");
const entities_1 = require("../entities");
const shared_lib_1 = require("@hockey-hub/shared-lib");
class SessionTemplateService {
    constructor() {
        this.repository = database_1.AppDataSource.getRepository(entities_1.SessionTemplate);
        this.logger = new shared_lib_1.Logger('SessionTemplateService');
    }
    async create(data) {
        try {
            const template = this.repository.create({
                ...data,
                usageCount: 0,
                isActive: true,
                metadata: {
                    source: 'manual',
                    version: 1,
                    lastModifiedBy: data.createdBy,
                },
            });
            const savedTemplate = await this.repository.save(template);
            this.logger.info('Session template created', { templateId: savedTemplate.id });
            return savedTemplate;
        }
        catch (error) {
            this.logger.error('Error creating session template', error);
            throw error;
        }
    }
    async findAll(filter, userId, page = 1, limit = 20) {
        try {
            const query = this.repository.createQueryBuilder('template')
                .where('template.isActive = :isActive', { isActive: filter.isActive ?? true });
            // Visibility filter based on user access
            const visibilityConditions = ['template.visibility = :public'];
            const params = { public: entities_1.TemplateVisibility.PUBLIC };
            if (filter.organizationId) {
                visibilityConditions.push('(template.organizationId = :orgId AND template.visibility IN (:...orgVisibility))');
                params.orgId = filter.organizationId;
                params.orgVisibility = [entities_1.TemplateVisibility.ORGANIZATION, entities_1.TemplateVisibility.TEAM];
            }
            if (filter.teamId) {
                visibilityConditions.push('(template.teamId = :teamId AND template.visibility = :teamVisibility)');
                params.teamId = filter.teamId;
                params.teamVisibility = entities_1.TemplateVisibility.TEAM;
            }
            // Always include templates created by the user
            visibilityConditions.push('template.createdBy = :userId');
            params.userId = userId;
            // Include templates where user has explicit permissions
            visibilityConditions.push(`template.permissions::jsonb -> 'canView' ? :userIdJson`);
            params.userIdJson = userId;
            query.andWhere(`(${visibilityConditions.join(' OR ')})`, params);
            // Apply other filters
            if (filter.category) {
                query.andWhere('template.category = :category', { category: filter.category });
            }
            if (filter.type) {
                query.andWhere('template.type = :type', { type: filter.type });
            }
            if (filter.difficulty) {
                query.andWhere('template.difficulty = :difficulty', { difficulty: filter.difficulty });
            }
            if (filter.search) {
                query.andWhere('(LOWER(template.name) LIKE LOWER(:search) OR LOWER(template.description) LIKE LOWER(:search))', { search: `%${filter.search}%` });
            }
            if (filter.tags && filter.tags.length > 0) {
                query.andWhere(`template.tags::jsonb ?| array[:...tags]`, { tags: filter.tags });
            }
            if (filter.createdBy) {
                query.andWhere('template.createdBy = :createdBy', { createdBy: filter.createdBy });
            }
            // Order by usage count and creation date
            query.orderBy('template.usageCount', 'DESC')
                .addOrderBy('template.createdAt', 'DESC');
            // Apply pagination
            const skip = (page - 1) * limit;
            query.skip(skip).take(limit);
            const [data, total] = await query.getManyAndCount();
            const totalPages = Math.ceil(total / limit);
            return {
                data,
                total,
                page,
                limit,
                totalPages,
            };
        }
        catch (error) {
            this.logger.error('Error fetching session templates', error);
            throw error;
        }
    }
    async findById(id, userId) {
        try {
            const template = await this.repository.findOne({
                where: { id, isActive: true },
            });
            if (!template) {
                return null;
            }
            // Check if user has access to this template
            if (!this.hasAccess(template, userId)) {
                throw new Error('Access denied to this template');
            }
            return template;
        }
        catch (error) {
            this.logger.error('Error fetching session template', error);
            throw error;
        }
    }
    async update(id, data, userId) {
        try {
            const template = await this.findById(id, userId);
            if (!template) {
                throw new Error('Template not found');
            }
            // Check if user can edit
            if (!this.canEdit(template, userId)) {
                throw new Error('Permission denied to edit this template');
            }
            // Update metadata
            const updatedMetadata = {
                ...template.metadata,
                lastModifiedBy: userId,
                version: (template.metadata?.version || 1) + 1,
            };
            const updatedTemplate = await this.repository.save({
                ...template,
                ...data,
                metadata: updatedMetadata,
            });
            this.logger.info('Session template updated', { templateId: id });
            return updatedTemplate;
        }
        catch (error) {
            this.logger.error('Error updating session template', error);
            throw error;
        }
    }
    async delete(id, userId) {
        try {
            const template = await this.findById(id, userId);
            if (!template) {
                throw new Error('Template not found');
            }
            // Check if user can delete
            if (!this.canEdit(template, userId)) {
                throw new Error('Permission denied to delete this template');
            }
            // Soft delete
            await this.repository.save({
                ...template,
                isActive: false,
                deletedAt: new Date(),
            });
            this.logger.info('Session template deleted', { templateId: id });
        }
        catch (error) {
            this.logger.error('Error deleting session template', error);
            throw error;
        }
    }
    async incrementUsageCount(id) {
        try {
            await this.repository.increment({ id }, 'usageCount', 1);
            await this.repository.update({ id }, { lastUsedAt: new Date() });
        }
        catch (error) {
            this.logger.error('Error incrementing usage count', error);
            // Don't throw, this is not critical
        }
    }
    async createFromWorkoutSession(workoutSessionId, data) {
        // This method would create a template from an existing workout session
        // Implementation would fetch the workout session and convert it to a template
        throw new Error('Not implemented yet');
    }
    async duplicateTemplate(id, userId, newName) {
        try {
            const original = await this.findById(id, userId);
            if (!original) {
                throw new Error('Template not found');
            }
            const duplicate = this.repository.create({
                ...original,
                id: undefined,
                name: newName,
                createdBy: userId,
                visibility: entities_1.TemplateVisibility.PRIVATE,
                usageCount: 0,
                averageRating: null,
                ratingCount: 0,
                createdAt: undefined,
                updatedAt: undefined,
                lastUsedAt: null,
                metadata: {
                    source: 'duplicated',
                    version: 1,
                    lastModifiedBy: userId,
                    notes: `Duplicated from template: ${original.name}`,
                },
            });
            const savedTemplate = await this.repository.save(duplicate);
            this.logger.info('Session template duplicated', {
                originalId: id,
                newId: savedTemplate.id
            });
            return savedTemplate;
        }
        catch (error) {
            this.logger.error('Error duplicating session template', error);
            throw error;
        }
    }
    async getPopularTemplates(organizationId, limit = 10) {
        try {
            const templates = await this.repository.createQueryBuilder('template')
                .where('template.isActive = true')
                .andWhere('template.visibility IN (:...visibility)', {
                visibility: [entities_1.TemplateVisibility.PUBLIC, entities_1.TemplateVisibility.ORGANIZATION],
            })
                .andWhere('(template.organizationId = :orgId OR template.visibility = :public)', {
                orgId: organizationId,
                public: entities_1.TemplateVisibility.PUBLIC,
            })
                .orderBy('template.usageCount', 'DESC')
                .addOrderBy('template.averageRating', 'DESC')
                .limit(limit)
                .getMany();
            return templates;
        }
        catch (error) {
            this.logger.error('Error fetching popular templates', error);
            throw error;
        }
    }
    async bulkAssignToWorkouts(templateId, assignmentData) {
        // This would create workout sessions for multiple players/dates based on the template
        // Implementation would interface with WorkoutSession creation
        throw new Error('Not implemented yet - requires WorkoutSession service integration');
    }
    hasAccess(template, userId) {
        // Public templates are accessible to all
        if (template.visibility === entities_1.TemplateVisibility.PUBLIC) {
            return true;
        }
        // Creator always has access
        if (template.createdBy === userId) {
            return true;
        }
        // Check explicit permissions
        if (template.permissions?.canView?.includes(userId)) {
            return true;
        }
        // Organization and team visibility would require checking user's organization/team
        // This would need to be implemented with actual user context
        return false;
    }
    canEdit(template, userId) {
        // System templates cannot be edited
        if (template.isSystemTemplate) {
            return false;
        }
        // Creator can always edit their templates
        if (template.createdBy === userId) {
            return true;
        }
        // Check explicit edit permissions
        if (template.permissions?.canEdit?.includes(userId)) {
            return true;
        }
        return false;
    }
}
exports.SessionTemplateService = SessionTemplateService;
//# sourceMappingURL=SessionTemplateService.js.map