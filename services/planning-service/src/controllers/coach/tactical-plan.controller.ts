import { Request, Response, NextFunction } from 'express';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { getRepository } from 'typeorm';
import { TacticalPlan, TacticalCategory, FormationType } from '../../entities/TacticalPlan';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import { IsEnum, IsString, IsUUID, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

const logger = new Logger('TacticalPlanController');

// DTOs for validation
export class CreateTacticalPlanDto {
  @IsString()
  name: string;

  @IsUUID()
  teamId: string;

  @IsEnum(TacticalCategory)
  category: TacticalCategory;

  @IsObject()
  formation: any;

  @IsArray()
  playerAssignments: any[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  triggers?: any[];

  @IsOptional()
  @IsArray()
  videoReferences?: any[];
}

export class UpdateTacticalPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TacticalCategory)
  category?: TacticalCategory;

  @IsOptional()
  @IsObject()
  formation?: any;

  @IsOptional()
  @IsArray()
  playerAssignments?: any[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  triggers?: any[];

  @IsOptional()
  @IsArray()
  videoReferences?: any[];
}

export class TacticalPlanQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(TacticalCategory)
  category?: TacticalCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class TacticalPlanController {
  
  /**
   * Create a new tactical plan
   * POST /api/planning/tactical-plans
   */
  static async create(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { name, teamId, category, formation, playerAssignments, description, triggers, videoReferences } = req.body as CreateTacticalPlanDto;
      const coachId = req.user!.userId;
      const organizationId = req.user!.organizationId;

      logger.info(`Creating tactical plan ${name} for team ${teamId} by coach ${coachId}`);

      const repository = getRepository(TacticalPlan);
      const tacticalPlan = repository.create({
        name,
        organizationId,
        coachId,
        teamId,
        category,
        formation,
        playerAssignments,
        description,
        triggers,
        videoReferences,
        isActive: true
      });

      const savedPlan = await repository.save(tacticalPlan);
      
      logger.info(`Tactical plan created with id: ${savedPlan.id}`);
      res.status(201).json(savedPlan);
    } catch (error) {
      logger.error('Error creating tactical plan:', error);
      next(error);
    }
  }

  /**
   * Get tactical plans with filtering and pagination
   * GET /api/planning/tactical-plans?teamId=xxx&category=xxx&search=xxx&page=1&pageSize=20
   */
  static async list(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { teamId, category, search, page = 1, pageSize = 20 } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting tactical plans for organization ${organizationId}`);

      const repository = getRepository(TacticalPlan);
      const queryBuilder = repository.createQueryBuilder('plan')
        .where('plan.organizationId = :organizationId', { organizationId })
        .andWhere('plan.isActive = :isActive', { isActive: true });

      // Apply filters
      if (teamId) {
        queryBuilder.andWhere('plan.teamId = :teamId', { teamId });
      }

      if (category) {
        queryBuilder.andWhere('plan.category = :category', { category });
      }

      if (search) {
        queryBuilder.andWhere('(plan.name ILIKE :search OR plan.description ILIKE :search)', { 
          search: `%${search}%` 
        });
      }

      // Add ordering
      queryBuilder.orderBy('plan.updatedAt', 'DESC');

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [plans, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(plans, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error getting tactical plans:', error);
      next(error);
    }
  }

  /**
   * Get a single tactical plan by ID
   * GET /api/planning/tactical-plans/:id
   */
  static async getById(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting tactical plan ${id}`);

      const repository = getRepository(TacticalPlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId,
          isActive: true 
        },
        relations: ['plays']
      });

      if (!plan) {
        return res.status(404).json({ error: 'Tactical plan not found' });
      }

      res.json(plan);
    } catch (error) {
      logger.error('Error getting tactical plan by ID:', error);
      next(error);
    }
  }

  /**
   * Update a tactical plan
   * PUT /api/planning/tactical-plans/:id
   */
  static async update(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateTacticalPlanDto;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating tactical plan ${id} by coach ${coachId}`);

      const repository = getRepository(TacticalPlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId, // Only coach who created can update
          isActive: true 
        }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Tactical plan not found or no permission to update' });
      }

      // Apply updates
      Object.assign(plan, updates);
      const updatedPlan = await repository.save(plan);

      logger.info(`Tactical plan ${id} updated successfully`);
      res.json(updatedPlan);
    } catch (error) {
      logger.error('Error updating tactical plan:', error);
      next(error);
    }
  }

  /**
   * Delete (soft delete) a tactical plan
   * DELETE /api/planning/tactical-plans/:id
   */
  static async delete(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Deleting tactical plan ${id} by coach ${coachId}`);

      const repository = getRepository(TacticalPlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId, // Only coach who created can delete
          isActive: true 
        }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Tactical plan not found or no permission to delete' });
      }

      // Soft delete by setting isActive to false
      plan.isActive = false;
      await repository.save(plan);

      logger.info(`Tactical plan ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting tactical plan:', error);
      next(error);
    }
  }

  /**
   * Bulk operations for tactical plans
   * POST /api/planning/tactical-plans/bulk
   */
  static async bulk(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { action, planIds } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Performing bulk ${action} on tactical plans by coach ${coachId}`);

      const repository = getRepository(TacticalPlan);
      
      if (action === 'delete') {
        await repository.update(
          { 
            id: { $in: planIds } as any,
            organizationId,
            coachId,
            isActive: true
          },
          { isActive: false }
        );
      } else if (action === 'duplicate') {
        const plansToClone = await repository.find({
          where: { 
            id: { $in: planIds } as any,
            organizationId,
            isActive: true
          }
        });

        const clonedPlans = plansToClone.map(plan => {
          const { id, createdAt, updatedAt, ...planData } = plan as any;
          return repository.create({
            ...planData,
            name: `${plan.name} (Copy)`,
            coachId
          });
        });

        await repository.save(clonedPlans);
      }

      res.json({ success: true, affectedCount: planIds.length });
    } catch (error) {
      logger.error('Error performing bulk operation on tactical plans:', error);
      next(error);
    }
  }

  /**
   * Search tactical plans
   * GET /api/planning/tactical-plans/search?q=searchTerm
   */
  static async search(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { q } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Searching tactical plans with query: ${q}`);

      const repository = getRepository(TacticalPlan);
      const plans = await repository.createQueryBuilder('plan')
        .where('plan.organizationId = :organizationId', { organizationId })
        .andWhere('plan.isActive = :isActive', { isActive: true })
        .andWhere('(plan.name ILIKE :search OR plan.description ILIKE :search)', { 
          search: `%${q}%` 
        })
        .orderBy('plan.updatedAt', 'DESC')
        .limit(50) // Limit search results
        .getMany();

      res.json(plans);
    } catch (error) {
      logger.error('Error searching tactical plans:', error);
      next(error);
    }
  }
}