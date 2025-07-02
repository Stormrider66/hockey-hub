import { Repository } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { PlanTemplate, TemplateCategory } from '../entities/PlanTemplate';
import { Logger } from '@hockey-hub/shared-lib/utils/logger';

export class CachedTemplateRepository {
  private repository: Repository<PlanTemplate>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'template:';
  private readonly CACHE_TTL = 43200; // 12 hours for templates

  constructor() {
    this.repository = AppDataSource.getRepository(PlanTemplate);
    this.logger = new Logger('CachedTemplateRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async findById(id: string): Promise<PlanTemplate | null> {
    const cacheKey = this.getCacheKey(`id:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for template ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const template = await this.repository.findOne({ where: { id } });

    if (template && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(template));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return template;
  }

  async findByOrganization(organizationId: string, includePublic: boolean = true): Promise<PlanTemplate[]> {
    const cacheKey = this.getCacheKey(`org:${organizationId}:public:${includePublic}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization ${organizationId} templates`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository.createQueryBuilder('template');

    if (includePublic) {
      query.where('(template.organizationId = :organizationId OR template.isPublic = true)', { organizationId });
    } else {
      query.where('template.organizationId = :organizationId', { organizationId });
    }

    const templates = await query
      .orderBy('template.usageCount', 'DESC')
      .addOrderBy('template.rating', 'DESC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(templates));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return templates;
  }

  async findByCategory(category: TemplateCategory, organizationId?: string): Promise<PlanTemplate[]> {
    const cacheKey = this.getCacheKey(`category:${category}:org:${organizationId || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for category ${category} templates`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('template')
      .where('template.category = :category', { category });

    if (organizationId) {
      query.andWhere('(template.organizationId = :organizationId OR template.isPublic = true)', { organizationId });
    } else {
      query.andWhere('template.isPublic = true');
    }

    const templates = await query
      .orderBy('template.rating', 'DESC')
      .addOrderBy('template.usageCount', 'DESC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(templates));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return templates;
  }

  async getPopularTemplates(limit: number = 10): Promise<PlanTemplate[]> {
    const cacheKey = this.getCacheKey(`popular:${limit}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for popular templates');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const templates = await this.repository
      .createQueryBuilder('template')
      .where('template.isPublic = true')
      .orderBy('template.usageCount', 'DESC')
      .addOrderBy('template.rating', 'DESC')
      .limit(limit)
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(templates)); // 1 hour
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return templates;
  }

  async searchTemplates(params: {
    organizationId?: string;
    category?: TemplateCategory;
    ageGroup?: string;
    skillLevel?: string;
    durationWeeks?: { min?: number; max?: number };
    searchText?: string;
  }): Promise<PlanTemplate[]> {
    const cacheKey = this.getCacheKey(`search:${JSON.stringify(params)}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for template search');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository.createQueryBuilder('template');

    // Organization filter
    if (params.organizationId) {
      query.where('(template.organizationId = :organizationId OR template.isPublic = true)', { 
        organizationId: params.organizationId 
      });
    } else {
      query.where('template.isPublic = true');
    }

    // Category filter
    if (params.category) {
      query.andWhere('template.category = :category', { category: params.category });
    }

    // Age group filter
    if (params.ageGroup) {
      query.andWhere('(template.ageGroup = :ageGroup OR template.ageGroup IS NULL)', { 
        ageGroup: params.ageGroup 
      });
    }

    // Skill level filter
    if (params.skillLevel) {
      query.andWhere('(template.skillLevel = :skillLevel OR template.skillLevel IS NULL)', { 
        skillLevel: params.skillLevel 
      });
    }

    // Duration filter
    if (params.durationWeeks) {
      if (params.durationWeeks.min !== undefined) {
        query.andWhere('template.durationWeeks >= :minWeeks', { minWeeks: params.durationWeeks.min });
      }
      if (params.durationWeeks.max !== undefined) {
        query.andWhere('template.durationWeeks <= :maxWeeks', { maxWeeks: params.durationWeeks.max });
      }
    }

    // Text search
    if (params.searchText) {
      query.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)', 
        { search: `%${params.searchText}%` }
      );
    }

    const templates = await query
      .orderBy('template.rating', 'DESC')
      .addOrderBy('template.usageCount', 'DESC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(templates)); // 1 hour for searches
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return templates;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.repository.increment({ id }, 'usageCount', 1);
    await this.invalidateTemplateCache(id);
  }

  async updateRating(id: string, rating: number): Promise<void> {
    const template = await this.findById(id);
    if (!template) return;

    const newTotalRating = template.rating + rating;
    const newCount = template.ratingCount + 1;

    await this.repository.update(id, {
      rating: newTotalRating,
      ratingCount: newCount
    });

    await this.invalidateTemplateCache(id);
  }

  async create(templateData: Partial<PlanTemplate>): Promise<PlanTemplate> {
    const template = await this.repository.save(templateData);
    await this.invalidateOrganizationCache(template.organizationId);
    return template;
  }

  async update(id: string, templateData: Partial<PlanTemplate>): Promise<PlanTemplate | null> {
    await this.repository.update(id, templateData);
    const template = await this.findById(id);
    if (template) {
      await this.invalidateTemplateCache(id);
      await this.invalidateOrganizationCache(template.organizationId);
    }
    return template;
  }

  private async invalidateTemplateCache(id: string): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const template = await this.repository.findOne({ where: { id } });
      if (!template) return;

      const keys = [
        this.getCacheKey(`id:${id}`),
        this.getCacheKey(`category:${template.category}:org:all`),
        this.getCacheKey(`category:${template.category}:org:${template.organizationId}`),
        this.getCacheKey('popular:10'),
        this.getCacheKey('popular:20')
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for template ${id}`);
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