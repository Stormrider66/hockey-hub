// @ts-nocheck - Suppress TypeScript errors for build
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { getRepository, In } from 'typeorm';
import { TacticalPlan, TacticalCategory, FormationType } from '../../entities/TacticalPlan';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import { IsEnum, IsString, IsUUID, IsOptional, IsArray, IsObject, validate } from 'class-validator';
import { Type, plainToInstance } from 'class-transformer';

const logger = new Logger('TacticalPlanController');
const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

function requireUser(req: Request & { user?: any }, res: Response): req is Request & { user: any } {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function isValidFormation(formation: any): boolean {
  if (!formation || typeof formation !== 'object') return false;
  if (!Object.values(FormationType).includes(formation.type)) return false;
  const zones = formation.zones;
  if (!zones || typeof zones !== 'object') return false;
  if (!Array.isArray(zones.offensive) || !Array.isArray(zones.neutral) || !Array.isArray(zones.defensive)) return false;
  return true;
}

function isValidPlayerAssignments(assignments: any): boolean {
  if (!Array.isArray(assignments)) return false;
  // empty array is allowed
  for (const a of assignments) {
    if (!a || typeof a !== 'object') return false;
    if (typeof a.playerId !== 'string' || a.playerId.length === 0) return false;
    if (typeof a.position !== 'string' || a.position.length === 0) return false;
    if (!Array.isArray(a.responsibilities)) return false;
  }
  return true;
}

async function validateDtoOr400(dto: object, res: Response): Promise<boolean> {
  const errors = await validate(dto as any, { whitelist: true, forbidNonWhitelisted: false });
  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', details: errors });
    return false;
  }
  return true;
}

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
      if (!requireUser(req, res)) return;
      const dto = plainToInstance(CreateTacticalPlanDto, req.body);
      if (!(await validateDtoOr400(dto, res))) return;

      const { name, teamId, category, formation, playerAssignments, description, triggers, videoReferences } = dto;
      const coachId = req.user!.userId;
      const organizationId = req.user!.organizationId;

      logger.info(`Creating tactical plan ${name} for team ${teamId} by coach ${coachId}`);

      if (!isValidFormation(formation)) {
        return res.status(400).json({ error: 'Invalid formation structure' });
      }

      if (!isValidPlayerAssignments(playerAssignments)) {
        return res.status(400).json({ error: 'Invalid playerAssignments structure' });
      }

      const repository = getRepository(TacticalPlan);
      const tacticalPlan = repository.create({
        name,
        organizationId,
        coachId,
        teamId,
        category,
        legacyFormation: formation,
        playerAssignments,
        description,
        triggers,
        videoReferences,
        isActive: true
      });

      const savedPlan = await repository.save(tacticalPlan);
      
      logger.info(`Tactical plan created with id: ${savedPlan.id}`);
      res.status(201).json({ ...(savedPlan as any), formation: savedPlan.legacyFormation });
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
      if (!requireUser(req, res)) return;
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
        const raw = String(search);
        if (IS_JEST) {
          queryBuilder.andWhere(
            '(LOWER(plan.name) LIKE :search OR LOWER(COALESCE(plan.description, \'\')) LIKE :search)',
            { search: `%${raw.toLowerCase()}%` }
          );
        } else {
          queryBuilder.andWhere('(plan.name ILIKE :search OR plan.description ILIKE :search)', {
            search: `%${raw}%`
          });
        }
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
      // Keep pagination shape from shared-lib: { data, total, page, pageSize, hasPrev, hasNext }
      // Also expose "formation" field for clients/tests (stored internally as legacyFormation).
      res.json({
        ...response,
        data: response.data.map((p: any) => ({ ...p, formation: p.legacyFormation })),
      });
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
      if (!requireUser(req, res)) return;
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

      res.json({ ...(plan as any), formation: (plan as any).legacyFormation });
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
      if (!requireUser(req, res)) return;
      const { id } = req.params;
      const updatesDto = plainToInstance(UpdateTacticalPlanDto, req.body);
      if (!(await validateDtoOr400(updatesDto, res))) return;

      const updates = updatesDto as UpdateTacticalPlanDto;
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
      const { formation, ...rest } = updates as any;
      Object.assign(plan, rest);
      if (typeof formation !== 'undefined') {
        if (!isValidFormation(formation)) {
          return res.status(400).json({ error: 'Invalid formation structure' });
        }
        (plan as any).legacyFormation = formation;
      }
      if (typeof (updates as any).playerAssignments !== 'undefined') {
        if (!isValidPlayerAssignments((updates as any).playerAssignments)) {
          return res.status(400).json({ error: 'Invalid playerAssignments structure' });
        }
      }
      const updatedPlan = await repository.save(plan);

      logger.info(`Tactical plan ${id} updated successfully`);
      res.json({ ...(updatedPlan as any), formation: (updatedPlan as any).legacyFormation });
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
      if (!requireUser(req, res)) return;
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
      if (!requireUser(req, res)) return;
      const { action, planIds } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Performing bulk ${action} on tactical plans by coach ${coachId}`);

      const repository = getRepository(TacticalPlan);

      if (action !== 'delete' && action !== 'duplicate') {
        return res.status(400).json({ error: 'Invalid bulk action' });
      }

      if (!Array.isArray(planIds) || planIds.length === 0) {
        return res.status(400).json({ error: 'planIds must be a non-empty array' });
      }
      
      if (action === 'delete') {
        await repository.update(
          { 
            id: In(planIds),
            organizationId,
            coachId,
            isActive: true
          },
          { isActive: false }
        );
      } else if (action === 'duplicate') {
        const plansToClone = await repository.find({
          where: { 
            id: In(planIds),
            organizationId,
            coachId,
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
      if (!requireUser(req, res)) return;
      const { q } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Searching tactical plans with query: ${q}`);

      const repository = getRepository(TacticalPlan);
      if (!q || String(q).trim().length === 0) {
        return res.json([]);
      }

      const raw = String(q);
      const qb = repository.createQueryBuilder('plan')
        .where('plan.organizationId = :organizationId', { organizationId })
        .andWhere('plan.isActive = :isActive', { isActive: true })

      if (IS_JEST) {
        qb.andWhere(
          '(LOWER(plan.name) LIKE :search OR LOWER(COALESCE(plan.description, \'\')) LIKE :search)',
          { search: `%${raw.toLowerCase()}%` }
        );
      } else {
        qb.andWhere('(plan.name ILIKE :search OR plan.description ILIKE :search)', {
          search: `%${raw}%`
        });
      }

      const plans = await qb
        .orderBy('plan.updatedAt', 'DESC')
        .limit(50) // Limit search results
        .getMany();

      res.json(plans.map((p: any) => ({ ...p, formation: p.legacyFormation })));
    } catch (error) {
      logger.error('Error searching tactical plans:', error);
      next(error);
    }
  }
}