import { Request, Response, NextFunction } from 'express';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { getRepository } from 'typeorm';
import { Formation, FormationType, ZoneType } from '../../entities/Formation';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import { 
  IsEnum, 
  IsString, 
  IsUUID, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsObject,
  IsBoolean,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';

const logger = new Logger('FormationController');

// DTOs for validation
export class FormationPositionDto {
  @IsString()
  role: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @IsEnum(ZoneType)
  zone: ZoneType;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class FormationMetadataDto {
  @IsNumber()
  @Min(1)
  @Max(20)
  playerCount: number;

  @IsEnum(['beginner', 'intermediate', 'advanced'])
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';

  @IsArray()
  @IsString({ each: true })
  gameStates: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opposingFormations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videoReferences?: string[];

  @IsOptional()
  @IsString()
  diagramUrl?: string;
}

export class CreateFormationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsEnum(FormationType)
  type: FormationType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormationPositionDto)
  positions: FormationPositionDto[];

  @IsArray()
  @IsString({ each: true })
  strengths: string[];

  @IsArray()
  @IsString({ each: true })
  weaknesses: string[];

  @IsArray()
  @IsString({ each: true })
  situational_use: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FormationMetadataDto)
  metadata?: FormationMetadataDto;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateFormationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(FormationType)
  type?: FormationType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormationPositionDto)
  positions?: FormationPositionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weaknesses?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  situational_use?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FormationMetadataDto)
  metadata?: FormationMetadataDto;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class FormationQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(FormationType)
  type?: FormationType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsEnum(['name', 'updatedAt', 'successRate', 'usageCount', 'type'])
  sortBy?: 'name' | 'updatedAt' | 'successRate' | 'usageCount' | 'type';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class FormationUsageDto {
  @IsBoolean()
  successful: boolean;

  @IsOptional()
  @IsString()
  gameId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FormationController {
  
  /**
   * Create a new formation
   * POST /api/planning/formations
   */
  static async create(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const formationData = req.body as CreateFormationDto;
      const coachId = req.user!.userId;
      const organizationId = req.user!.organizationId;

      logger.info(`Creating formation ${formationData.name} by coach ${coachId}`);

      const repository = getRepository(Formation);
      
      // Validate positions
      const validationErrors = Formation.prototype.validatePositions.call({ positions: formationData.positions });
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationErrors
        });
      }

      const formation = repository.create({
        ...formationData,
        organizationId,
        coachId,
        isActive: true,
        usageCount: 0,
        successRate: 0
      });

      const savedFormation = await repository.save(formation);
      
      logger.info(`Formation created with id: ${savedFormation.id}`);
      res.status(201).json(savedFormation);
    } catch (error) {
      logger.error('Error creating formation:', error);
      next(error);
    }
  }

  /**
   * Get formations with filtering and pagination
   * GET /api/planning/formations?type=xxx&teamId=xxx&search=xxx&page=1&pageSize=20
   */
  static async list(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { 
        teamId, 
        type, 
        isTemplate,
        search, 
        page = 1, 
        pageSize = 20,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting formations for organization ${organizationId}`);

      const repository = getRepository(Formation);
      const queryBuilder = repository.createQueryBuilder('formation')
        .where('formation.organizationId = :organizationId', { organizationId })
        .andWhere('formation.isActive = :isActive', { isActive: true });

      // Apply filters
      if (teamId) {
        queryBuilder.andWhere('(formation.teamId = :teamId OR formation.teamId IS NULL)', { teamId });
      }

      if (type) {
        queryBuilder.andWhere('formation.type = :type', { type });
      }

      if (isTemplate !== undefined) {
        queryBuilder.andWhere('formation.isTemplate = :isTemplate', { isTemplate });
      }

      if (search) {
        queryBuilder.andWhere(
          '(formation.name ILIKE :search OR formation.description ILIKE :search)', 
          { search: `%${search}%` }
        );
      }

      // Add ordering
      const validSortColumns = ['name', 'updatedAt', 'successRate', 'usageCount', 'type'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'updatedAt';
      const order = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      queryBuilder.orderBy(`formation.${sortColumn}`, order);

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [formations, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(formations, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error getting formations:', error);
      next(error);
    }
  }

  /**
   * Get a single formation by ID
   * GET /api/planning/formations/:id
   */
  static async getById(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting formation ${id}`);

      const repository = getRepository(Formation);
      const formation = await repository.findOne({
        where: { 
          id, 
          organizationId,
          isActive: true 
        },
        relations: ['tacticalPlans']
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation not found' });
      }

      res.json(formation);
    } catch (error) {
      logger.error('Error getting formation by ID:', error);
      next(error);
    }
  }

  /**
   * Update a formation
   * PUT /api/planning/formations/:id
   */
  static async update(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateFormationDto;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating formation ${id} by coach ${coachId}`);

      const repository = getRepository(Formation);
      const formation = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId, // Only coach who created can update
          isActive: true 
        }
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation not found or no permission to update' });
      }

      // Validate positions if provided
      if (updates.positions) {
        const validationErrors = Formation.prototype.validatePositions.call({ positions: updates.positions });
        if (validationErrors.length > 0) {
          return res.status(400).json({ 
            error: 'Validation failed',
            details: validationErrors
          });
        }
      }

      // Apply updates
      Object.assign(formation, updates);
      const updatedFormation = await repository.save(formation);

      logger.info(`Formation ${id} updated successfully`);
      res.json(updatedFormation);
    } catch (error) {
      logger.error('Error updating formation:', error);
      next(error);
    }
  }

  /**
   * Delete (soft delete) a formation
   * DELETE /api/planning/formations/:id
   */
  static async delete(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Deleting formation ${id} by coach ${coachId}`);

      const repository = getRepository(Formation);
      const formation = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId, // Only coach who created can delete
          isActive: true 
        }
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation not found or no permission to delete' });
      }

      // Soft delete by setting isActive to false
      formation.isActive = false;
      await repository.save(formation);

      logger.info(`Formation ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting formation:', error);
      next(error);
    }
  }

  /**
   * Clone/duplicate a formation
   * POST /api/planning/formations/:id/clone
   */
  static async clone(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Cloning formation ${id} by coach ${coachId}`);

      const repository = getRepository(Formation);
      const originalFormation = await repository.findOne({
        where: { 
          id, 
          organizationId,
          isActive: true 
        }
      });

      if (!originalFormation) {
        return res.status(404).json({ error: 'Formation not found' });
      }

      const clonedData = originalFormation.clone(name);
      clonedData.coachId = coachId; // Set current coach as owner
      
      const clonedFormation = repository.create(clonedData);
      const savedClone = await repository.save(clonedFormation);

      logger.info(`Formation cloned successfully with id: ${savedClone.id}`);
      res.status(201).json(savedClone);
    } catch (error) {
      logger.error('Error cloning formation:', error);
      next(error);
    }
  }

  /**
   * Record formation usage in game
   * POST /api/planning/formations/:id/usage
   */
  static async recordUsage(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { successful, gameId, notes } = req.body as FormationUsageDto;
      const organizationId = req.user!.organizationId;

      logger.info(`Recording usage for formation ${id}`);

      const repository = getRepository(Formation);
      const formation = await repository.findOne({
        where: { 
          id, 
          organizationId,
          isActive: true 
        }
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation not found' });
      }

      formation.addUsage(successful);
      await repository.save(formation);

      // Could also log to a separate FormationUsage entity for detailed tracking
      // if (gameId) {
      //   const usageLog = usageRepository.create({
      //     formationId: id,
      //     gameId,
      //     successful,
      //     notes,
      //     timestamp: new Date()
      //   });
      //   await usageRepository.save(usageLog);
      // }

      logger.info(`Usage recorded for formation ${id}: ${successful ? 'successful' : 'unsuccessful'}`);
      res.json({ 
        success: true,
        usageCount: formation.usageCount,
        successRate: formation.successRate
      });
    } catch (error) {
      logger.error('Error recording formation usage:', error);
      next(error);
    }
  }

  /**
   * Get formation analytics
   * GET /api/planning/formations/:id/analytics
   */
  static async getAnalytics(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting analytics for formation ${id}`);

      const repository = getRepository(Formation);
      const formation = await repository.findOne({
        where: { 
          id, 
          organizationId,
          isActive: true 
        },
        relations: ['tacticalPlans']
      });

      if (!formation) {
        return res.status(404).json({ error: 'Formation not found' });
      }

      const analytics = {
        basic: {
          usageCount: formation.usageCount,
          successRate: formation.successRate,
          totalPlayers: formation.getTotalPlayerCount(),
          isBalanced: formation.isBalanced()
        },
        coverage: formation.getFormationCoverage(),
        tacticalPlansCount: formation.tacticalPlans?.length || 0,
        positions: {
          offensive: formation.getOffensivePositions().length,
          defensive: formation.getDefensivePositions().length,
          neutral: formation.getNeutralPositions().length
        },
        strengths: formation.strengths,
        weaknesses: formation.weaknesses,
        situationalUse: formation.situational_use,
        metadata: formation.metadata
      };

      res.json(analytics);
    } catch (error) {
      logger.error('Error getting formation analytics:', error);
      next(error);
    }
  }

  /**
   * Get formation templates (system-wide formations)
   * GET /api/planning/formations/templates
   */
  static async getTemplates(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { type, search } = req.query as any;

      logger.info('Getting formation templates');

      const repository = getRepository(Formation);
      const queryBuilder = repository.createQueryBuilder('formation')
        .where('formation.isTemplate = :isTemplate', { isTemplate: true })
        .andWhere('formation.isActive = :isActive', { isActive: true });

      if (type) {
        queryBuilder.andWhere('formation.type = :type', { type });
      }

      if (search) {
        queryBuilder.andWhere(
          '(formation.name ILIKE :search OR formation.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      queryBuilder.orderBy('formation.name', 'ASC');

      const templates = await queryBuilder.getMany();
      res.json(templates);
    } catch (error) {
      logger.error('Error getting formation templates:', error);
      next(error);
    }
  }

  /**
   * Bulk operations on formations
   * POST /api/planning/formations/bulk
   */
  static async bulk(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { action, formationIds, options } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Performing bulk ${action} on formations by coach ${coachId}`);

      const repository = getRepository(Formation);
      
      if (action === 'delete') {
        await repository.update(
          { 
            id: { $in: formationIds } as any,
            organizationId,
            coachId,
            isActive: true
          },
          { isActive: false }
        );
      } else if (action === 'duplicate') {
        const formationsToClone = await repository.find({
          where: { 
            id: { $in: formationIds } as any,
            organizationId,
            isActive: true
          }
        });

        const clonedFormations = formationsToClone.map(formation => {
          const clonedData = formation.clone(`${formation.name} (Copy)`);
          clonedData.coachId = coachId;
          return repository.create(clonedData);
        });

        await repository.save(clonedFormations);
      }

      res.json({ success: true, affectedCount: formationIds.length });
    } catch (error) {
      logger.error('Error performing bulk operation on formations:', error);
      next(error);
    }
  }
}