import { Repository } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { Drill, DrillType, DrillDifficulty } from '../entities/Drill';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';

export class CachedDrillRepository {
  private repository: Repository<Drill>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'drill:';
  private readonly CACHE_TTL = 86400; // 24 hours for drill library

  constructor() {
    this.repository = AppDataSource.getRepository(Drill);
    this.logger = new Logger('CachedDrillRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async findById(id: string): Promise<Drill | null> {
    const cacheKey = this.getCacheKey(`id:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for drill ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const drill = await this.repository.findOne({
      where: { id: id as any },
      relations: ['category']
    });

    if (drill && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(drill));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return drill;
  }

  async findByOrganization(organizationId: string, includePublic: boolean = true): Promise<Drill[]> {
    const cacheKey = this.getCacheKey(`org:${organizationId}:public:${includePublic}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization ${organizationId} drills`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('drill')
      .leftJoinAndSelect('drill.category', 'category');

    if (includePublic) {
      query.where('(drill.organizationId = :organizationId OR drill.isPublic = true)', { organizationId });
    } else {
      query.where('drill.organizationId = :organizationId', { organizationId });
    }

    const drills = await query
      .orderBy('drill.usageCount', 'DESC')
      .addOrderBy('drill.name', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(drills));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return drills;
  }

  async findByCategory(categoryId: string, organizationId?: string): Promise<Drill[]> {
    const cacheKey = this.getCacheKey(`category:${categoryId}:org:${organizationId || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for category ${categoryId} drills`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('drill')
      .leftJoinAndSelect('drill.category', 'category')
      .where('drill.categoryId = :categoryId', { categoryId });

    if (organizationId) {
      query.andWhere('(drill.organizationId = :organizationId OR drill.isPublic = true)', { organizationId });
    }

    const drills = await query
      .orderBy('drill.name', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(drills));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return drills;
  }

  async searchDrills(params: {
    organizationId?: string;
    type?: DrillType;
    difficulty?: DrillDifficulty;
    ageGroup?: string;
    tags?: string[];
    minPlayers?: number;
    maxPlayers?: number;
    duration?: number;
    searchText?: string;
  }): Promise<Drill[]> {
    const cacheKey = this.getCacheKey(`search:${JSON.stringify(params)}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for drill search');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('drill')
      .leftJoinAndSelect('drill.category', 'category');

    // Organization filter
    if (params.organizationId) {
      query.where('(drill.organizationId = :organizationId OR drill.isPublic = true)', { 
        organizationId: params.organizationId 
      });
    }

    // Type filter
    if (params.type) {
      query.andWhere('drill.type = :type', { type: params.type });
    }

    // Difficulty filter
    if (params.difficulty) {
      query.andWhere('drill.difficulty = :difficulty', { difficulty: params.difficulty });
    }

    // Age group filter
    if (params.ageGroup) {
      query.andWhere(':ageGroup = ANY(drill.ageGroups)', { ageGroup: params.ageGroup });
    }

    // Tags filter
    if (params.tags && params.tags.length > 0) {
      query.andWhere('drill.tags && :tags', { tags: params.tags });
    }

    // Player count filter
    if (params.minPlayers !== undefined) {
      query.andWhere('drill.maxPlayers >= :minPlayers', { minPlayers: params.minPlayers });
    }
    if (params.maxPlayers !== undefined) {
      query.andWhere('drill.minPlayers <= :maxPlayers', { maxPlayers: params.maxPlayers });
    }

    // Duration filter
    if (params.duration !== undefined) {
      query.andWhere('drill.duration <= :duration', { duration: params.duration });
    }

    // Text search
    if (params.searchText) {
      query.andWhere(
        '(drill.name ILIKE :search OR drill.description ILIKE :search)', 
        { search: `%${params.searchText}%` }
      );
    }

    const drills = await query
      .orderBy('drill.rating', 'DESC')
      .addOrderBy('drill.usageCount', 'DESC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(drills)); // 1 hour for searches
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return drills;
  }

  async getPopularDrills(organizationId: string, limit: number = 10): Promise<Drill[]> {
    const cacheKey = this.getCacheKey(`popular:${organizationId}:${limit}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for popular drills');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const drills = await this.repository
      .createQueryBuilder('drill')
      .leftJoinAndSelect('drill.category', 'category')
      .where('(drill.organizationId = :organizationId OR drill.isPublic = true)', { organizationId })
      .orderBy('drill.usageCount', 'DESC')
      .addOrderBy('drill.rating', 'DESC')
      .limit(limit)
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(drills)); // 1 hour
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return drills;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.repository.increment({ id: id as any }, 'usageCount', 1);
    await this.invalidateDrillCache(id);
  }

  async updateRating(id: string, rating: number): Promise<void> {
    const drill = await this.findById(id);
    if (!drill) return;

    const newTotalRating = drill.rating + rating;
    const newCount = drill.ratingCount + 1;

    await this.repository.update(id, {
      rating: newTotalRating,
      ratingCount: newCount
    });

    await this.invalidateDrillCache(id);
  }

  async create(drillData: Partial<Drill>): Promise<Drill> {
    const drill = await this.repository.save(drillData);
    await this.invalidateOrganizationCache(drill.organizationId);
    return drill;
  }

  async update(id: string, drillData: Partial<Drill>): Promise<Drill | null> {
    await this.repository.update(id, drillData);
    const drill = await this.findById(id);
    if (drill) {
      await this.invalidateDrillCache(id);
      await this.invalidateOrganizationCache(drill.organizationId);
    }
    return drill;
  }

  private async invalidateDrillCache(id: string): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const drill = await this.repository.findOne({ where: { id: id as any } });
      if (!drill) return;

      const keys = [
        this.getCacheKey(`id:${id}`),
        this.getCacheKey(`category:${drill.categoryId}:org:all`),
        this.getCacheKey(`category:${drill.categoryId}:org:${drill.organizationId}`),
        this.getCacheKey(`popular:${drill.organizationId}:10`),
        this.getCacheKey(`popular:${drill.organizationId}:20`)
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for drill ${id}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }

  private async invalidateOrganizationCache(organizationId?: string): Promise<void> {
    if (!isRedisConnected || !organizationId) return;

    try {
      const keys = await redisClient.keys(this.getCacheKey(`org:${organizationId}:*`));
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redisClient.del(key)));
      }
      this.logger.debug(`Cache invalidated for organization ${organizationId}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }
}