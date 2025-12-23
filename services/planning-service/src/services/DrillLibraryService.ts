// @ts-nocheck - Complex drill library service
import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { AppDataSource } from '../config/database';
import { 
  Drill, 
  DrillType, 
  DrillDifficulty 
} from '../entities/Drill';
import { DrillCategory } from '../entities/DrillCategory';

export interface CreateDrillDto {
  name: string;
  description: string;
  organizationId?: string;
  isPublic?: boolean;
  categoryId: string;
  type: DrillType;
  difficulty: DrillDifficulty;
  duration: number;
  minPlayers: number;
  maxPlayers: number;
  equipment: string[];
  setup: {
    rinkArea: 'full' | 'half' | 'zone' | 'corner' | 'neutral';
    diagram?: string;
    cones?: number;
    pucks?: number;
    otherEquipment?: string[];
  };
  instructions: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>;
  objectives?: string[];
  keyPoints?: string[];
  variations?: string[];
  tags?: string[];
  ageGroups?: string[];
  videoUrl?: string;
  animationUrl?: string;
}

export interface UpdateDrillDto {
  name?: string;
  description?: string;
  categoryId?: string;
  type?: DrillType;
  difficulty?: DrillDifficulty;
  duration?: number;
  minPlayers?: number;
  maxPlayers?: number;
  equipment?: string[];
  setup?: {
    rinkArea?: 'full' | 'half' | 'zone' | 'corner' | 'neutral';
    diagram?: string;
    cones?: number;
    pucks?: number;
    otherEquipment?: string[];
  };
  instructions?: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>;
  objectives?: string[];
  keyPoints?: string[];
  variations?: string[];
  tags?: string[];
  ageGroups?: string[];
  videoUrl?: string;
  animationUrl?: string;
  isPublic?: boolean;
}

export interface DrillFilters {
  organizationId?: string;
  categoryId?: string;
  type?: DrillType;
  difficulty?: DrillDifficulty;
  isPublic?: boolean;
  ageGroup?: string;
  minPlayers?: number;
  maxPlayers?: number;
  duration?: { min: number; max: number };
  equipment?: string[];
  tags?: string[];
  rinkArea?: string;
  hasVideo?: boolean;
}

export interface DrillSearchParams {
  query?: string;
  type?: DrillType;
  difficulty?: DrillDifficulty;
  playerCount?: number;
  maxDuration?: number;
  equipment?: string[];
  tags?: string[];
  ageGroup?: string;
}

export interface DrillRating {
  drillId: string;
  userId: string;
  rating: number; // 1-5 stars
  comment?: string;
}

class DrillRepository extends CachedRepository<Drill> {
  constructor() {
    super(AppDataSource.getRepository(Drill), 'drill', 1800); // 30 minutes cache
  }

  async findByCategory(
    categoryId: string, 
    organizationId?: string,
    isPublic?: boolean
  ): Promise<Drill[]> {
    const cacheKey = `drill:category:${categoryId}:org:${organizationId || 'all'}:public:${isPublic || 'all'}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('drill')
          .leftJoinAndSelect('drill.category', 'category')
          .where('drill.categoryId = :categoryId', { categoryId });

        if (organizationId) {
          query.andWhere('(drill.organizationId = :organizationId OR drill.isPublic = true)', { 
            organizationId 
          });
        }

        if (isPublic !== undefined) {
          query.andWhere('drill.isPublic = :isPublic', { isPublic });
        }

        return query
          .orderBy('drill.usageCount', 'DESC')
          .addOrderBy('drill.rating', 'DESC')
          .getMany();
      },
      900, // 15 minutes
      [`category:${categoryId}`, organizationId ? `organization:${organizationId}` : 'public']
    );
  }

  async findByTypeAndDifficulty(
    type: DrillType,
    difficulty: DrillDifficulty,
    organizationId?: string
  ): Promise<Drill[]> {
    const cacheKey = `drill:type:${type}:difficulty:${difficulty}:org:${organizationId || 'all'}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('drill')
          .leftJoinAndSelect('drill.category', 'category')
          .where('drill.type = :type', { type })
          .andWhere('drill.difficulty = :difficulty', { difficulty });

        if (organizationId) {
          query.andWhere('(drill.organizationId = :organizationId OR drill.isPublic = true)', { 
            organizationId 
          });
        } else {
          query.andWhere('drill.isPublic = true');
        }

        return query
          .orderBy('drill.usageCount', 'DESC')
          .addOrderBy('drill.rating', 'DESC')
          .getMany();
      },
      600, // 10 minutes
      [`type:${type}`, `difficulty:${difficulty}`]
    );
  }

  async searchDrills(
    organizationId: string,
    searchParams: DrillSearchParams
  ): Promise<Drill[]> {
    const cacheKey = `drill:search:${organizationId}:${JSON.stringify(searchParams)}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('drill')
          .leftJoinAndSelect('drill.category', 'category')
          .where('(drill.organizationId = :organizationId OR drill.isPublic = true)', { 
            organizationId 
          });

        if (searchParams.query) {
          query.andWhere(
            '(drill.name ILIKE :query OR drill.description ILIKE :query OR :query = ANY(drill.tags))', 
            { query: `%${searchParams.query}%` }
          );
        }

        if (searchParams.type) {
          query.andWhere('drill.type = :type', { type: searchParams.type });
        }

        if (searchParams.difficulty) {
          query.andWhere('drill.difficulty = :difficulty', { difficulty: searchParams.difficulty });
        }

        if (searchParams.playerCount) {
          query.andWhere('drill.minPlayers <= :playerCount AND drill.maxPlayers >= :playerCount', {
            playerCount: searchParams.playerCount
          });
        }

        if (searchParams.maxDuration) {
          query.andWhere('drill.duration <= :maxDuration', { maxDuration: searchParams.maxDuration });
        }

        if (searchParams.equipment && searchParams.equipment.length > 0) {
          query.andWhere('drill.equipment && :equipment', { equipment: searchParams.equipment });
        }

        if (searchParams.tags && searchParams.tags.length > 0) {
          query.andWhere('drill.tags && :tags', { tags: searchParams.tags });
        }

        if (searchParams.ageGroup) {
          query.andWhere('(:ageGroup = ANY(drill.ageGroups) OR drill.ageGroups IS NULL)', {
            ageGroup: searchParams.ageGroup
          });
        }

        return query
          .orderBy('drill.usageCount', 'DESC')
          .addOrderBy('drill.rating', 'DESC')
          .limit(50)
          .getMany();
      },
      300, // 5 minutes
      [`organization:${organizationId}`, 'search']
    );
  }

  async getPopularDrills(
    organizationId?: string,
    limit: number = 20
  ): Promise<Drill[]> {
    const cacheKey = `drill:popular:${organizationId || 'all'}:${limit}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('drill')
          .leftJoinAndSelect('drill.category', 'category');

        if (organizationId) {
          query.where('(drill.organizationId = :organizationId OR drill.isPublic = true)', { 
            organizationId 
          });
        } else {
          query.where('drill.isPublic = true');
        }

        return query
          .orderBy('drill.usageCount', 'DESC')
          .addOrderBy('drill.rating', 'DESC')
          .limit(limit)
          .getMany();
      },
      900, // 15 minutes
      [organizationId ? `organization:${organizationId}` : 'public', 'popular']
    );
  }

  async getTopRatedDrills(
    organizationId?: string,
    limit: number = 20
  ): Promise<Drill[]> {
    const cacheKey = `drill:top-rated:${organizationId || 'all'}:${limit}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('drill')
          .leftJoinAndSelect('drill.category', 'category')
          .where('drill.ratingCount >= 5'); // Minimum ratings for credibility

        if (organizationId) {
          query.andWhere('(drill.organizationId = :organizationId OR drill.isPublic = true)', { 
            organizationId 
          });
        } else {
          query.andWhere('drill.isPublic = true');
        }

        return query
          .orderBy('(drill.rating / drill.ratingCount)', 'DESC')
          .addOrderBy('drill.ratingCount', 'DESC')
          .limit(limit)
          .getMany();
      },
      1800, // 30 minutes
      [organizationId ? `organization:${organizationId}` : 'public', 'top-rated']
    );
  }

  async getDrillAnalytics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const cacheKey = `drill:analytics:${organizationId}:${startDate?.toISOString()}:${endDate?.toISOString()}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const baseQuery = this.repository
          .createQueryBuilder('drill')
          .where('drill.organizationId = :organizationId', { organizationId });

        if (startDate && endDate) {
          baseQuery.andWhere('drill.createdAt BETWEEN :startDate AND :endDate', {
            startDate, endDate
          });
        }

        const [
          totalDrills,
          publicDrills,
          drillsByType,
          drillsByDifficulty,
          averageRating,
          mostUsedDrills
        ] = await Promise.all([
          baseQuery.getCount(),
          baseQuery.clone().andWhere('drill.isPublic = true').getCount(),
          baseQuery.clone()
            .select('drill.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('drill.type')
            .getRawMany(),
          baseQuery.clone()
            .select('drill.difficulty', 'difficulty')
            .addSelect('COUNT(*)', 'count')
            .groupBy('drill.difficulty')
            .getRawMany(),
          baseQuery.clone()
            .select('AVG(drill.rating / NULLIF(drill.ratingCount, 0))', 'avgRating')
            .where('drill.ratingCount > 0')
            .getRawOne(),
          baseQuery.clone()
            .orderBy('drill.usageCount', 'DESC')
            .limit(10)
            .getMany()
        ]);

        return {
          totalDrills,
          publicDrills,
          privateDrills: totalDrills - publicDrills,
          typeDistribution: drillsByType.reduce((acc, item) => {
            acc[item.type] = parseInt(item.count);
            return acc;
          }, {} as Record<DrillType, number>),
          difficultyDistribution: drillsByDifficulty.reduce((acc, item) => {
            acc[item.difficulty] = parseInt(item.count);
            return acc;
          }, {} as Record<DrillDifficulty, number>),
          averageRating: parseFloat(averageRating?.avgRating || '0'),
          mostUsedDrills: mostUsedDrills.map(drill => ({
            id: drill.id,
            name: drill.name,
            usageCount: drill.usageCount,
            rating: drill.getAverageRating()
          })),
          lastUpdated: new Date()
        };
      },
      1800, // 30 minutes
      [`organization:${organizationId}`, 'analytics']
    );
  }

  async incrementUsageCount(drillId: string): Promise<void> {
    await this.repository.increment({ id: drillId } as any, 'usageCount', 1);
    
    // Invalidate related caches
    await this.invalidateByTags([
      `drill:${drillId}`,
      'popular',
      'analytics'
    ]);
  }

  async updateRating(drillId: string, newRating: number): Promise<void> {
    await this.repository.createQueryBuilder()
      .update(Drill)
      .set({
        rating: () => 'rating + :newRating',
        ratingCount: () => 'ratingCount + 1'
      })
      .where('id = :drillId', { drillId })
      .setParameter('newRating', newRating)
      .execute();

    // Invalidate related caches
    await this.invalidateByTags([
      `drill:${drillId}`,
      'top-rated',
      'analytics'
    ]);
  }
}

export class DrillLibraryService {
  private repository: DrillRepository;
  private categoryRepository: Repository<DrillCategory>;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.repository = new DrillRepository();
    this.categoryRepository = AppDataSource.getRepository(DrillCategory);
    this.logger = new Logger('DrillLibraryService');
    this.eventBus = EventBus.getInstance();
  }

  async createDrill(data: CreateDrillDto): Promise<Drill> {
    this.logger.info('Creating drill', { name: data.name, type: data.type });

    try {
      // Validate category exists
      await this.validateCategory(data.categoryId);

      // Validate instructions
      this.validateInstructions(data.instructions);

      const drill = await this.repository.save({
        ...data,
        usageCount: 0,
        rating: 0,
        ratingCount: 0
      } as any);

      // Publish event for cross-service integration
      await this.eventBus.publish('drill.created', {
        drillId: drill.id,
        name: data.name,
        type: data.type,
        difficulty: data.difficulty,
        organizationId: data.organizationId,
        isPublic: data.isPublic || false
      });

      this.logger.info('Drill created successfully', { 
        id: drill.id, 
        name: data.name 
      });

      return drill;
    } catch (error) {
      this.logger.error('Error creating drill', { error: error.message, data });
      throw error;
    }
  }

  async updateDrill(id: string, data: UpdateDrillDto): Promise<Drill> {
    this.logger.info('Updating drill', { id });

    try {
      const existingDrill = await this.repository.findOne({ where: { id } as any });
      if (!existingDrill) {
        throw new Error('Drill not found');
      }

      // Validate category if changed
      if (data.categoryId) {
        await this.validateCategory(data.categoryId);
      }

      // Validate instructions if provided
      if (data.instructions) {
        this.validateInstructions(data.instructions);
      }

      Object.assign(existingDrill, data);
      const updatedDrill = await this.repository.save(existingDrill);

      // Invalidate related caches
      await this.repository.invalidateByTags([
        `drill:${id}`,
        `organization:${existingDrill.organizationId}`,
        `category:${existingDrill.categoryId}`
      ]);

      // Publish update event
      await this.eventBus.publish('drill.updated', {
        drillId: id,
        name: updatedDrill.name,
        changes: Object.keys(data)
      });

      this.logger.info('Drill updated successfully', { id });
      return updatedDrill;
    } catch (error) {
      this.logger.error('Error updating drill', { error: error.message, id, data });
      throw error;
    }
  }

  async deleteDrill(id: string): Promise<void> {
    this.logger.info('Deleting drill', { id });

    try {
      const drill = await this.repository.findOne({ where: { id } as any });
      if (!drill) {
        throw new Error('Drill not found');
      }

      await this.repository.remove(drill);

      // Publish delete event
      await this.eventBus.publish('drill.deleted', {
        drillId: id,
        name: drill.name,
        organizationId: drill.organizationId
      });

      this.logger.info('Drill deleted successfully', { id });
    } catch (error) {
      this.logger.error('Error deleting drill', { error: error.message, id });
      throw error;
    }
  }

  async getDrillById(id: string): Promise<Drill | null> {
    const drill = await this.repository.findOne({
      where: { id } as any,
      relations: ['category']
    });

    if (drill) {
      // Increment usage count asynchronously
      this.repository.incrementUsageCount(id).catch(err =>
        this.logger.error('Failed to increment drill usage count', { error: err.message, drillId: id })
      );
    }

    return drill;
  }

  async getDrillsByCategory(
    categoryId: string,
    organizationId?: string,
    isPublic?: boolean
  ): Promise<Drill[]> {
    return this.repository.findByCategory(categoryId, organizationId, isPublic);
  }

  async getDrillsByTypeAndDifficulty(
    type: DrillType,
    difficulty: DrillDifficulty,
    organizationId?: string
  ): Promise<Drill[]> {
    return this.repository.findByTypeAndDifficulty(type, difficulty, organizationId);
  }

  async searchDrills(
    organizationId: string,
    searchParams: DrillSearchParams
  ): Promise<Drill[]> {
    return this.repository.searchDrills(organizationId, searchParams);
  }

  async getPopularDrills(
    organizationId?: string,
    limit: number = 20
  ): Promise<Drill[]> {
    return this.repository.getPopularDrills(organizationId, limit);
  }

  async getTopRatedDrills(
    organizationId?: string,
    limit: number = 20
  ): Promise<Drill[]> {
    return this.repository.getTopRatedDrills(organizationId, limit);
  }

  async getDrillAnalytics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    return this.repository.getDrillAnalytics(organizationId, startDate, endDate);
  }

  async duplicateDrill(
    id: string,
    newName: string,
    organizationId?: string
  ): Promise<Drill> {
    this.logger.info('Duplicating drill', { id, newName });

    try {
      const originalDrill = await this.getDrillById(id);
      if (!originalDrill) {
        throw new Error('Drill not found');
      }

      const duplicateData: CreateDrillDto = {
        name: newName,
        description: originalDrill.description,
        organizationId: organizationId || originalDrill.organizationId,
        isPublic: false, // Duplicates are private by default
        categoryId: originalDrill.categoryId,
        type: originalDrill.type,
        difficulty: originalDrill.difficulty,
        duration: originalDrill.duration,
        minPlayers: originalDrill.minPlayers,
        maxPlayers: originalDrill.maxPlayers,
        equipment: [...originalDrill.equipment],
        setup: { ...originalDrill.setup },
        instructions: [...originalDrill.instructions],
        objectives: originalDrill.objectives ? [...originalDrill.objectives] : undefined,
        keyPoints: originalDrill.keyPoints ? [...originalDrill.keyPoints] : undefined,
        variations: originalDrill.variations ? [...originalDrill.variations] : undefined,
        tags: originalDrill.tags ? [...originalDrill.tags] : undefined,
        ageGroups: originalDrill.ageGroups ? [...originalDrill.ageGroups] : undefined,
        videoUrl: originalDrill.videoUrl,
        animationUrl: originalDrill.animationUrl
      };

      const duplicatedDrill = await this.createDrill(duplicateData);

      this.logger.info('Drill duplicated successfully', { 
        originalId: id, 
        duplicateId: duplicatedDrill.id 
      });

      return duplicatedDrill;
    } catch (error) {
      this.logger.error('Error duplicating drill', { error: error.message, id });
      throw error;
    }
  }

  async rateDrill(
    drillId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    this.logger.info('Rating drill', { drillId, userId, rating });

    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const drill = await this.repository.findOne({ where: { id: drillId } as any });
      if (!drill) {
        throw new Error('Drill not found');
      }

      await this.repository.updateRating(drillId, rating);

      // Publish rating event
      await this.eventBus.publish('drill.rated', {
        drillId,
        userId,
        rating,
        comment,
        newAverageRating: drill.getAverageRating()
      });

      this.logger.info('Drill rated successfully', { drillId, rating });
    } catch (error) {
      this.logger.error('Error rating drill', { error: error.message, drillId, userId, rating });
      throw error;
    }
  }

  async getDrillsForPractice(
    organizationId: string,
    practiceParams: {
      duration: number;
      playerCount: number;
      ageGroup?: string;
      focus?: DrillType[];
      equipment?: string[];
      rinkArea?: string;
    }
  ): Promise<{
    warmUp: Drill[];
    main: Drill[];
    coolDown: Drill[];
    totalDuration: number;
  }> {
    this.logger.info('Getting drills for practice', { organizationId, practiceParams });

    try {
      const { duration, playerCount, ageGroup, focus, equipment, rinkArea } = practiceParams;

      // Allocate time: 10% warm-up, 80% main, 10% cool-down
      const warmUpTime = Math.floor(duration * 0.1);
      const mainTime = Math.floor(duration * 0.8);
      const coolDownTime = Math.floor(duration * 0.1);

      // Search for appropriate drills
      const [warmUpDrills, coolDownDrills] = await Promise.all([
        this.searchDrills(organizationId, {
          type: DrillType.WARM_UP,
          playerCount,
          maxDuration: warmUpTime,
          equipment,
          ageGroup
        }),
        this.searchDrills(organizationId, {
          type: DrillType.COOL_DOWN,
          playerCount,
          maxDuration: coolDownTime,
          equipment,
          ageGroup
        })
      ]);

      // Search for main drills based on focus
      let mainDrills: Drill[] = [];
      if (focus && focus.length > 0) {
        const drillPromises = focus.map(type =>
          this.searchDrills(organizationId, {
            type,
            playerCount,
            maxDuration: Math.floor(mainTime / focus.length),
            equipment,
            ageGroup
          })
        );
        const drillResults = await Promise.all(drillPromises);
        mainDrills = drillResults.flat();
      } else {
        // Default to skill and tactical drills
        mainDrills = await this.searchDrills(organizationId, {
          playerCount,
          maxDuration: Math.floor(mainTime / 2),
          equipment,
          ageGroup
        });
      }

      // Select best drills based on rating and usage
      const selectedWarmUp = this.selectBestDrills(warmUpDrills, warmUpTime);
      const selectedMain = this.selectBestDrills(mainDrills, mainTime);
      const selectedCoolDown = this.selectBestDrills(coolDownDrills, coolDownTime);

      const totalDuration = 
        selectedWarmUp.reduce((sum, drill) => sum + drill.duration, 0) +
        selectedMain.reduce((sum, drill) => sum + drill.duration, 0) +
        selectedCoolDown.reduce((sum, drill) => sum + drill.duration, 0);

      return {
        warmUp: selectedWarmUp,
        main: selectedMain,
        coolDown: selectedCoolDown,
        totalDuration
      };
    } catch (error) {
      this.logger.error('Error getting drills for practice', { 
        error: error.message, 
        organizationId, 
        practiceParams 
      });
      throw error;
    }
  }

  async getRecommendedDrills(
    organizationId: string,
    playerCount: number,
    previousDrillIds: string[] = [],
    ageGroup?: string,
    focus?: DrillType
  ): Promise<Drill[]> {
    this.logger.info('Getting recommended drills', { organizationId, playerCount });

    try {
      const searchParams: DrillSearchParams = {
        playerCount,
        ageGroup,
        type: focus
      };

      const allDrills = await this.searchDrills(organizationId, searchParams);
      
      // Filter out recently used drills
      const availableDrills = allDrills.filter(drill => 
        !previousDrillIds.includes(drill.id as any)
      );

      // Score drills based on rating, usage, and variety
      const scoredDrills = availableDrills.map(drill => ({
        drill,
        score: this.calculateDrillScore(drill, previousDrillIds)
      }));

      // Sort by score and return top recommendations
      return scoredDrills
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.drill);
    } catch (error) {
      this.logger.error('Error getting recommended drills', { 
        error: error.message, 
        organizationId 
      });
      throw error;
    }
  }

  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId } as any
    });

    if (!category) {
      throw new Error('Drill category not found');
    }
  }

  private validateInstructions(instructions: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>): void {
    if (!instructions || instructions.length === 0) {
      throw new Error('Drill must have at least one instruction');
    }

    // Validate step numbers are sequential
    const steps = instructions.map(inst => inst.step).sort((a, b) => a - b);
    for (let i = 0; i < steps.length; i++) {
      if (steps[i] !== i + 1) {
        throw new Error('Instruction steps must be sequential starting from 1');
      }
    }

    // Validate descriptions
    instructions.forEach((instruction, index) => {
      if (!instruction.description || instruction.description.trim().length === 0) {
        throw new Error(`Instruction ${index + 1} must have a description`);
      }
    });
  }

  private selectBestDrills(drills: Drill[], targetDuration: number): Drill[] {
    if (drills.length === 0) return [];

    // Sort by score (rating and usage)
    const scoredDrills = drills
      .map(drill => ({
        drill,
        score: drill.getAverageRating() * 0.7 + (drill.usageCount / 100) * 0.3
      }))
      .sort((a, b) => b.score - a.score);

    const selected: Drill[] = [];
    let remainingTime = targetDuration;

    for (const { drill } of scoredDrills) {
      if (drill.duration <= remainingTime) {
        selected.push(drill);
        remainingTime -= drill.duration;
      }
      
      if (remainingTime <= 0) break;
    }

    return selected;
  }

  private calculateDrillScore(drill: Drill, previousDrillIds: string[]): number {
    let score = 0;

    // Base score from rating
    score += drill.getAverageRating() * 20;

    // Popularity score (normalized usage count)
    score += Math.min(drill.usageCount / 10, 10);

    // Variety bonus (penalize similar types/difficulties used recently)
    // This would require more complex logic to track drill history
    score += 5; // Base variety bonus

    // Recency penalty (avoid recently used drills)
    if (previousDrillIds.length > 0) {
      // This is a simplified check - in practice, you'd want to track
      // when drills were last used and apply graduated penalties
      score += 10; // Bonus for not being recently used
    }

    return score;
  }
}