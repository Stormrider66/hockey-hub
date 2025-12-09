import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { SessionTemplate, TemplateVisibility, WorkoutSession } from '../entities';
import { Logger } from '@hockey-hub/shared-lib';

export interface CreateSessionTemplateDto {
  name: string;
  description?: string;
  category: string;
  type: string;
  difficulty: string;
  visibility: string;
  organizationId: string;
  teamId?: string;
  createdBy: string;
  estimatedDuration: number;
  exercises: any[];
  warmup?: any;
  cooldown?: any;
  equipment?: string[];
  targetGroups?: any;
  goals?: string[];
  tags?: string[];
  permissions?: any;
}

export interface UpdateSessionTemplateDto extends Partial<CreateSessionTemplateDto> {
  id: string;
}

export interface SessionTemplateFilter {
  organizationId?: string;
  teamId?: string;
  category?: string;
  type?: string;
  difficulty?: string;
  visibility?: string;
  createdBy?: string;
  search?: string;
  tags?: string[];
  isActive?: boolean;
}

export class SessionTemplateService {
  private repository: Repository<SessionTemplate>;
  private logger: Logger;

  constructor() {
    this.repository = AppDataSource.getRepository(SessionTemplate);
    this.logger = new Logger('SessionTemplateService');
  }

  async create(data: CreateSessionTemplateDto): Promise<SessionTemplate> {
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
    } catch (error) {
      this.logger.error('Error creating session template', error);
      throw error;
    }
  }

  async findAll(filter: SessionTemplateFilter, userId: string, page = 1, limit = 20): Promise<{
    data: SessionTemplate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const query = this.repository.createQueryBuilder('template')
        .where('template.isActive = :isActive', { isActive: filter.isActive ?? true });

      // Visibility filter based on user access
      const visibilityConditions = ['template.visibility = :public'];
      const params: any = { public: TemplateVisibility.PUBLIC };

      if (filter.organizationId) {
        visibilityConditions.push(
          '(template.organizationId = :orgId AND template.visibility IN (:...orgVisibility))'
        );
        params.orgId = filter.organizationId;
        params.orgVisibility = [TemplateVisibility.ORGANIZATION, TemplateVisibility.TEAM];
      }

      if (filter.teamId) {
        visibilityConditions.push(
          '(template.teamId = :teamId AND template.visibility = :teamVisibility)'
        );
        params.teamId = filter.teamId;
        params.teamVisibility = TemplateVisibility.TEAM;
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
        query.andWhere(
          '(LOWER(template.name) LIKE LOWER(:search) OR LOWER(template.description) LIKE LOWER(:search))',
          { search: `%${filter.search}%` }
        );
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
    } catch (error) {
      this.logger.error('Error fetching session templates', error);
      throw error;
    }
  }

  async findById(id: string, userId: string): Promise<SessionTemplate | null> {
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
    } catch (error) {
      this.logger.error('Error fetching session template', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<UpdateSessionTemplateDto>, userId: string): Promise<SessionTemplate> {
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
    } catch (error) {
      this.logger.error('Error updating session template', error);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
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
    } catch (error) {
      this.logger.error('Error deleting session template', error);
      throw error;
    }
  }

  async incrementUsageCount(id: string): Promise<void> {
    try {
      await this.repository.increment({ id }, 'usageCount', 1);
      await this.repository.update({ id }, { lastUsedAt: new Date() });
    } catch (error) {
      this.logger.error('Error incrementing usage count', error);
      // Don't throw, this is not critical
    }
  }

  async createFromWorkoutSession(workoutSessionId: string, data: Partial<CreateSessionTemplateDto>): Promise<SessionTemplate> {
    try {
      // Get the workout session repository
      const workoutSessionRepo = AppDataSource.getRepository(WorkoutSession);
      
      // Fetch the workout session with exercises
      const workoutSession = await workoutSessionRepo.findOne({
        where: { id: workoutSessionId },
        relations: ['exercises']
      });
      
      if (!workoutSession) {
        throw new Error('Workout session not found');
      }
      
      // Convert exercises to template format
      const templateExercises = workoutSession.exercises
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(exercise => ({
          name: exercise.name,
          category: exercise.category,
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          restDuration: exercise.restDuration,
          unit: exercise.unit,
          targetValue: exercise.targetValue,
          equipment: exercise.equipment,
          notes: exercise.notes,
          videoUrl: exercise.videoUrl
        }));
      
      // Create the template data
      const templateData: CreateSessionTemplateDto = {
        name: data.name || `Template from ${workoutSession.title}`,
        description: data.description || workoutSession.description || `Template created from workout session: ${workoutSession.title}`,
        category: data.category || workoutSession.type,
        type: data.type || workoutSession.type,
        difficulty: data.difficulty || 'intermediate',
        visibility: data.visibility || TemplateVisibility.PRIVATE,
        organizationId: data.organizationId || '',
        teamId: data.teamId || workoutSession.teamId,
        createdBy: data.createdBy || workoutSession.createdBy,
        estimatedDuration: workoutSession.estimatedDuration,
        exercises: templateExercises,
        equipment: [...new Set(templateExercises.filter(e => e.equipment).map(e => e.equipment))],
        goals: data.goals || [],
        tags: data.tags || [],
        permissions: data.permissions || {
          canView: [],
          canUse: [],
          canEdit: []
        }
      };
      
      // Create the template
      return await this.create(templateData);
    } catch (error) {
      Logger.error('Failed to create template from workout session', error);
      throw error;
    }
  }

  async duplicateTemplate(id: string, userId: string, newName: string): Promise<SessionTemplate> {
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
        visibility: TemplateVisibility.PRIVATE,
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
    } catch (error) {
      this.logger.error('Error duplicating session template', error);
      throw error;
    }
  }

  async getPopularTemplates(organizationId: string, limit = 10): Promise<SessionTemplate[]> {
    try {
      const templates = await this.repository.createQueryBuilder('template')
        .where('template.isActive = true')
        .andWhere('template.visibility IN (:...visibility)', {
          visibility: [TemplateVisibility.PUBLIC, TemplateVisibility.ORGANIZATION],
        })
        .andWhere('(template.organizationId = :orgId OR template.visibility = :public)', {
          orgId: organizationId,
          public: TemplateVisibility.PUBLIC,
        })
        .orderBy('template.usageCount', 'DESC')
        .addOrderBy('template.averageRating', 'DESC')
        .limit(limit)
        .getMany();

      return templates;
    } catch (error) {
      this.logger.error('Error fetching popular templates', error);
      throw error;
    }
  }

  async bulkAssignToWorkouts(templateId: string, assignmentData: {
    playerIds: string[];
    teamId: string;
    scheduledDates: Date[];
    userId: string;
  }): Promise<{ created: number; errors: any[] }> {
    const errors: any[] = [];
    let created = 0;
    
    try {
      // Get the template
      const template = await this.findById(templateId, assignmentData.userId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Import the workout service
      const { CachedWorkoutSessionService } = await import('./CachedWorkoutSessionService');
      const workoutService = new CachedWorkoutSessionService();
      
      // Create workout sessions for each date
      for (const scheduledDate of assignmentData.scheduledDates) {
        try {
          // Convert template exercises to workout exercises
          const exercises = template.exercises.map((ex: any, index: number) => ({
            name: ex.name,
            category: ex.category,
            orderIndex: ex.orderIndex || index,
            sets: ex.sets,
            reps: ex.reps,
            duration: ex.duration,
            restDuration: ex.restDuration,
            unit: ex.unit,
            targetValue: ex.targetValue,
            equipment: ex.equipment,
            notes: ex.notes,
            videoUrl: ex.videoUrl
          }));
          
          // Create workout session from template
          const workoutData = {
            title: `${template.name} - ${scheduledDate.toLocaleDateString()}`,
            description: template.description,
            type: template.type,
            scheduledDate,
            location: '', // Would need to be provided or defaulted
            teamId: assignmentData.teamId,
            playerIds: assignmentData.playerIds,
            createdBy: assignmentData.userId,
            exercises,
            estimatedDuration: template.estimatedDuration,
            settings: {
              allowIndividualLoads: true,
              displayMode: 'grid' as const,
              showMetrics: true,
              autoRotation: false,
              rotationInterval: 30
            }
          };
          
          await workoutService.createWorkoutSession(workoutData);
          created++;
          
          // Update template usage
          await this.incrementUsageCount(templateId);
        } catch (error) {
          errors.push({
            date: scheduledDate,
            error: error.message || 'Failed to create workout session'
          });
          Logger.error(`Failed to create workout for date ${scheduledDate}`, error);
        }
      }
      
      return { created, errors };
    } catch (error) {
      Logger.error('Failed to bulk assign template to workouts', error);
      throw error;
    }
  }

  private hasAccess(template: SessionTemplate, userId: string): boolean {
    // Public templates are accessible to all
    if (template.visibility === TemplateVisibility.PUBLIC) {
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

  private canEdit(template: SessionTemplate, userId: string): boolean {
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