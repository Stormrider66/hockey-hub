import { Request, Response, NextFunction } from 'express';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { getRepository } from 'typeorm';
import { Drill, DrillType, DrillDifficulty } from '../../entities/Drill';
import { DrillCategory } from '../../entities/DrillCategory';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import { IsEnum, IsString, IsUUID, IsOptional, IsArray, IsObject, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

const logger = new Logger('DrillLibraryController');

// DTOs for validation
export class CreateDrillDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(DrillType)
  type: DrillType;

  @IsEnum(DrillDifficulty)
  difficulty: DrillDifficulty;

  @IsInt()
  @Min(1)
  duration: number;

  @IsInt()
  @Min(1)
  minPlayers: number;

  @IsInt()
  @Min(1)
  maxPlayers: number;

  @IsArray()
  @IsString({ each: true })
  equipment: string[];

  @IsObject()
  setup: {
    rinkArea: 'full' | 'half' | 'zone' | 'corner' | 'neutral';
    diagram?: string;
    cones?: number;
    pucks?: number;
    otherEquipment?: string[];
  };

  @IsArray()
  instructions: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ageGroups?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  animationUrl?: string;
}

export class UpdateDrillDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(DrillType)
  type?: DrillType;

  @IsOptional()
  @IsEnum(DrillDifficulty)
  difficulty?: DrillDifficulty;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPlayers?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsObject()
  setup?: {
    rinkArea: 'full' | 'half' | 'zone' | 'corner' | 'neutral';
    diagram?: string;
    cones?: number;
    pucks?: number;
    otherEquipment?: string[];
  };

  @IsOptional()
  @IsArray()
  instructions?: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyPoints?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ageGroups?: string[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  animationUrl?: string;
}

export class DrillSearchQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(DrillType)
  type?: DrillType;

  @IsOptional()
  @IsEnum(DrillDifficulty)
  difficulty?: DrillDifficulty;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDuration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  playerCount?: number;

  @IsOptional()
  @IsString()
  rinkArea?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class RateDrillDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}

export class DrillLibraryController {
  
  /**
   * Create a new drill
   * POST /api/planning/drill-library
   */
  static async create(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const drillData = req.body as CreateDrillDto;
      const organizationId = req.user!.organizationId;

      logger.info(`Creating drill ${drillData.name} for organization ${organizationId}`);

      const repository = getRepository(Drill);
      
      // Validate category exists
      const categoryRepo = getRepository(DrillCategory);
      const category = await categoryRepo.findOne({ where: { id: drillData.categoryId } });
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      const drill = repository.create({
        ...drillData,
        organizationId,
        isPublic: false,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const savedDrill = await repository.save(drill);
      
      logger.info(`Drill created with id: ${savedDrill.id}`);
      res.status(201).json(savedDrill);
    } catch (error) {
      logger.error('Error creating drill:', error);
      next(error);
    }
  }

  /**
   * Search drills with advanced filtering
   * GET /api/planning/drill-library/search?categoryId=xxx&type=xxx&difficulty=xxx&ageGroup=xxx&search=xxx&tags=xxx&page=1&pageSize=20
   */
  static async search(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { 
        categoryId, 
        type, 
        difficulty, 
        ageGroup, 
        minDuration, 
        maxDuration, 
        playerCount, 
        rinkArea, 
        search, 
        tags, 
        sortBy = 'rating', 
        order = 'desc', 
        page = 1, 
        pageSize = 20 
      } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Searching drills for organization ${organizationId}`);

      const repository = getRepository(Drill);
      const queryBuilder = repository.createQueryBuilder('drill')
        .leftJoinAndSelect('drill.category', 'category')
        .where('(drill.organizationId = :organizationId OR drill.isPublic = :isPublic)', { 
          organizationId, 
          isPublic: true 
        });

      // Apply filters
      if (categoryId) {
        queryBuilder.andWhere('drill.categoryId = :categoryId', { categoryId });
      }

      if (type) {
        queryBuilder.andWhere('drill.type = :type', { type });
      }

      if (difficulty) {
        queryBuilder.andWhere('drill.difficulty = :difficulty', { difficulty });
      }

      if (ageGroup) {
        queryBuilder.andWhere(':ageGroup = ANY(drill.ageGroups)', { ageGroup });
      }

      if (minDuration) {
        queryBuilder.andWhere('drill.duration >= :minDuration', { minDuration: Number(minDuration) });
      }

      if (maxDuration) {
        queryBuilder.andWhere('drill.duration <= :maxDuration', { maxDuration: Number(maxDuration) });
      }

      if (playerCount) {
        const count = Number(playerCount);
        queryBuilder.andWhere('drill.minPlayers <= :playerCount AND drill.maxPlayers >= :playerCount', { playerCount: count });
      }

      if (rinkArea) {
        queryBuilder.andWhere("drill.setup->>'rinkArea' = :rinkArea", { rinkArea });
      }

      if (search) {
        queryBuilder.andWhere(
          '(drill.name ILIKE :search OR drill.description ILIKE :search OR array_to_string(drill.objectives, \' \') ILIKE :search)', 
          { search: `%${search}%` }
        );
      }

      if (tags && Array.isArray(tags)) {
        queryBuilder.andWhere('drill.tags && :tags', { tags });
      }

      // Add sorting
      let orderBy = 'drill.rating';
      if (sortBy === 'name') orderBy = 'drill.name';
      else if (sortBy === 'duration') orderBy = 'drill.duration';
      else if (sortBy === 'usageCount') orderBy = 'drill.usageCount';
      else if (sortBy === 'createdAt') orderBy = 'drill.createdAt';
      
      queryBuilder.orderBy(orderBy, order.toUpperCase() as 'ASC' | 'DESC');

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [drills, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(drills, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error searching drills:', error);
      next(error);
    }
  }

  /**
   * Get all drills for organization with basic filtering
   * GET /api/planning/drill-library?type=xxx&difficulty=xxx&page=1&pageSize=20
   */
  static async list(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { type, difficulty, page = 1, pageSize = 20 } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting drills for organization ${organizationId}`);

      const repository = getRepository(Drill);
      const queryBuilder = repository.createQueryBuilder('drill')
        .leftJoinAndSelect('drill.category', 'category')
        .where('(drill.organizationId = :organizationId OR drill.isPublic = :isPublic)', { 
          organizationId, 
          isPublic: true 
        });

      if (type) {
        queryBuilder.andWhere('drill.type = :type', { type });
      }

      if (difficulty) {
        queryBuilder.andWhere('drill.difficulty = :difficulty', { difficulty });
      }

      queryBuilder.orderBy('drill.rating', 'DESC');

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [drills, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(drills, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error getting drills:', error);
      next(error);
    }
  }

  /**
   * Get a single drill by ID
   * GET /api/planning/drill-library/:id
   */
  static async getById(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting drill ${id}`);

      const repository = getRepository(Drill);
      const drill = await repository.findOne({
        where: [
          { id, organizationId },
          { id, isPublic: true }
        ],
        relations: ['category']
      });

      if (!drill) {
        return res.status(404).json({ error: 'Drill not found' });
      }

      // Increment usage count if it's not a public drill or belongs to the organization
      if (!drill.isPublic || drill.organizationId === organizationId) {
        drill.usageCount += 1;
        await repository.save(drill);
      }

      res.json(drill);
    } catch (error) {
      logger.error('Error getting drill by ID:', error);
      next(error);
    }
  }

  /**
   * Update a drill
   * PUT /api/planning/drill-library/:id
   */
  static async update(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateDrillDto;
      const organizationId = req.user!.organizationId;

      logger.info(`Updating drill ${id}`);

      const repository = getRepository(Drill);
      const drill = await repository.findOne({
        where: { 
          id, 
          organizationId // Only organization's drills can be updated
        }
      });

      if (!drill) {
        return res.status(404).json({ error: 'Drill not found or no permission to update' });
      }

      // Validate category if provided
      if (updates.categoryId) {
        const categoryRepo = getRepository(DrillCategory);
        const category = await categoryRepo.findOne({ where: { id: updates.categoryId } });
        if (!category) {
          return res.status(400).json({ error: 'Invalid category ID' });
        }
      }

      // Apply updates
      Object.assign(drill, updates);
      const updatedDrill = await repository.save(drill);

      logger.info(`Drill ${id} updated successfully`);
      res.json(updatedDrill);
    } catch (error) {
      logger.error('Error updating drill:', error);
      next(error);
    }
  }

  /**
   * Delete a drill
   * DELETE /api/planning/drill-library/:id
   */
  static async delete(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Deleting drill ${id}`);

      const repository = getRepository(Drill);
      const result = await repository.delete({
        id,
        organizationId // Only organization's drills can be deleted
      });

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Drill not found or no permission to delete' });
      }

      logger.info(`Drill ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting drill:', error);
      next(error);
    }
  }

  /**
   * Rate a drill
   * POST /api/planning/drill-library/:id/rate
   */
  static async rateDrill(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating } = req.body as RateDrillDto;
      const organizationId = req.user!.organizationId;

      logger.info(`Rating drill ${id} with ${rating} stars`);

      const repository = getRepository(Drill);
      const drill = await repository.findOne({
        where: [
          { id, organizationId },
          { id, isPublic: true }
        ]
      });

      if (!drill) {
        return res.status(404).json({ error: 'Drill not found' });
      }

      // Update rating (simple average for now)
      drill.rating = ((drill.rating * drill.ratingCount) + rating) / (drill.ratingCount + 1);
      drill.ratingCount += 1;
      
      const updatedDrill = await repository.save(drill);

      logger.info(`Drill ${id} rated successfully`);
      res.json({ 
        message: 'Rating submitted successfully',
        averageRating: drill.rating,
        ratingCount: drill.ratingCount
      });
    } catch (error) {
      logger.error('Error rating drill:', error);
      next(error);
    }
  }

  /**
   * Get popular drills
   * GET /api/planning/drill-library/popular?limit=10
   */
  static async getPopular(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { limit = 10 } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting popular drills for organization ${organizationId}`);

      const repository = getRepository(Drill);
      const drills = await repository.createQueryBuilder('drill')
        .leftJoinAndSelect('drill.category', 'category')
        .where('(drill.organizationId = :organizationId OR drill.isPublic = :isPublic)', { 
          organizationId, 
          isPublic: true 
        })
        .orderBy('drill.usageCount', 'DESC')
        .addOrderBy('drill.rating', 'DESC')
        .limit(Number(limit))
        .getMany();

      res.json(drills);
    } catch (error) {
      logger.error('Error getting popular drills:', error);
      next(error);
    }
  }

  /**
   * Get drills by category
   * GET /api/planning/drill-library/category/:categoryId?page=1&pageSize=20
   */
  static async getByCategory(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const { page = 1, pageSize = 20 } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting drills for category ${categoryId}`);

      const repository = getRepository(Drill);
      const queryBuilder = repository.createQueryBuilder('drill')
        .leftJoinAndSelect('drill.category', 'category')
        .where('drill.categoryId = :categoryId', { categoryId })
        .andWhere('(drill.organizationId = :organizationId OR drill.isPublic = :isPublic)', { 
          organizationId, 
          isPublic: true 
        })
        .orderBy('drill.rating', 'DESC');

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [drills, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(drills, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error getting drills by category:', error);
      next(error);
    }
  }

  /**
   * Duplicate a drill
   * POST /api/planning/drill-library/:id/duplicate
   */
  static async duplicate(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newName } = req.body;
      const organizationId = req.user!.organizationId;

      logger.info(`Duplicating drill ${id}`);

      const repository = getRepository(Drill);
      const originalDrill = await repository.findOne({
        where: [
          { id, organizationId },
          { id, isPublic: true }
        ]
      });

      if (!originalDrill) {
        return res.status(404).json({ error: 'Drill not found' });
      }

      // Create duplicate
      const { id: _, createdAt, updatedAt, usageCount, rating, ratingCount, ...drillData } = originalDrill as any;
      const duplicatedDrill = repository.create({
        ...drillData,
        name: newName || `${originalDrill.name} (Copy)`,
        organizationId,
        isPublic: false,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      });

      const savedDrill = await repository.save(duplicatedDrill);

      logger.info(`Drill duplicated with id: ${savedDrill.id}`);
      res.status(201).json(savedDrill);
    } catch (error) {
      logger.error('Error duplicating drill:', error);
      next(error);
    }
  }

  /**
   * Bulk operations for drills
   * POST /api/planning/drill-library/bulk
   */
  static async bulk(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { action, drillIds } = req.body;
      const organizationId = req.user!.organizationId;

      logger.info(`Performing bulk ${action} on drills`);

      const repository = getRepository(Drill);
      
      if (action === 'delete') {
        const result = await repository.delete({
          id: { $in: drillIds } as any,
          organizationId
        });
        res.json({ success: true, affectedCount: result.affected || 0 });
      } else if (action === 'make_public') {
        const result = await repository.update(
          { 
            id: { $in: drillIds } as any,
            organizationId
          },
          { isPublic: true }
        );
        res.json({ success: true, affectedCount: result.affected || 0 });
      } else if (action === 'make_private') {
        const result = await repository.update(
          { 
            id: { $in: drillIds } as any,
            organizationId
          },
          { isPublic: false }
        );
        res.json({ success: true, affectedCount: result.affected || 0 });
      } else {
        res.status(400).json({ error: 'Invalid bulk action' });
      }
    } catch (error) {
      logger.error('Error performing bulk operation on drills:', error);
      next(error);
    }
  }

  /**
   * Get drill statistics
   * GET /api/planning/drill-library/stats
   */
  static async getStats(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;

      logger.info(`Getting drill statistics for organization ${organizationId}`);

      const repository = getRepository(Drill);
      const drills = await repository.find({
        where: { organizationId }
      });

      const stats = {
        totalDrills: drills.length,
        byType: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
        averageRating: 0,
        totalUsage: 0,
        mostPopularTags: {} as Record<string, number>
      };

      let totalRating = 0;
      let ratedDrills = 0;

      drills.forEach(drill => {
        // Count by type
        stats.byType[drill.type] = (stats.byType[drill.type] || 0) + 1;
        
        // Count by difficulty
        stats.byDifficulty[drill.difficulty] = (stats.byDifficulty[drill.difficulty] || 0) + 1;
        
        // Sum usage
        stats.totalUsage += drill.usageCount;
        
        // Calculate average rating
        if (drill.ratingCount > 0) {
          totalRating += drill.rating;
          ratedDrills++;
        }
        
        // Count popular tags
        if (drill.tags) {
          drill.tags.forEach(tag => {
            stats.mostPopularTags[tag] = (stats.mostPopularTags[tag] || 0) + 1;
          });
        }
      });

      stats.averageRating = ratedDrills > 0 ? totalRating / ratedDrills : 0;

      res.json(stats);
    } catch (error) {
      logger.error('Error getting drill statistics:', error);
      next(error);
    }
  }
}