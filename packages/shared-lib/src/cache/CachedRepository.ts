import { Repository, SelectQueryBuilder, FindManyOptions, FindOneOptions, ObjectLiteral } from 'typeorm';
import { getCacheManager } from './cacheConfig';
import { LoggerFactory } from '../utils/Logger';

const logger = LoggerFactory.getLogger('CachedRepository');

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
}

/**
 * Base class for cached repositories
 * Provides caching capabilities for common repository operations
 */
export class CachedRepository<Entity extends ObjectLiteral> {
  protected repository: Repository<Entity>;
  protected entityName: string;
  protected defaultTTL: number = 300; // 5 minutes default

  constructor(repository: Repository<Entity> | any, entityName: string, defaultTTL?: number) {
    // Accept either a TypeORM Repository or a plain object with compatible methods (for tests/e2e)
    this.repository = repository as Repository<Entity>;
    this.entityName = entityName;
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
  }

  /**
   * Helper to cache arbitrary query results with optional TTL and tags
   */
  protected async cacheQueryResult<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttlSeconds?: number,
    tags?: string[]
  ): Promise<T> {
    const cache = getCacheManager();
    try {
      const cached = await cache.get<T>(cacheKey as unknown as string);
      if (cached !== null && cached !== undefined) {
        return cached as T;
      }
    } catch (error) {
      logger.warn('Cache get failed, proceeding without cache', { cacheKey, error: (error as any)?.message });
    }

    const result = await queryFn();

    try {
      const ttl = ttlSeconds || this.defaultTTL;
      await cache.set(cacheKey as unknown as string, result as any, ttl);
      if (tags && tags.length > 0) {
        if (typeof (cache as any).tag === 'function') {
          await (cache as any).tag(cacheKey as unknown as string, tags);
        }
      }
    } catch (error) {
      logger.warn('Cache set failed, continuing', { cacheKey, error: (error as any)?.message });
    }

    return result;
  }

  /**
   * Find one entity with caching
   */
  async findOne(
    options: FindOneOptions<Entity>,
    cacheOptions?: CacheOptions
  ): Promise<Entity | null> {
    const cacheKey = cacheOptions?.key || this.generateCacheKey('findOne', options);
    const cache = getCacheManager();

    try {
      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return cached as Entity;
      }

      // Fetch from database
      const result = await this.repository.findOne(options);
      
      if (result) {
        // Store in cache
        const ttl = cacheOptions?.ttl || this.defaultTTL;
        await cache.set(cacheKey, result, ttl);
        
        if (cacheOptions?.tags) {
          // Associate tags for later invalidation
          await this.setTags(cacheKey, cacheOptions.tags);
        }
      }

      return result;
    } catch (error) {
      logger.error('Error in cached findOne', { error, cacheKey });
      // Fallback to direct database query
      return this.repository.findOne(options);
    }
  }

  /**
   * Find many entities with caching
   */
  async findMany(
    options: FindManyOptions<Entity>,
    cacheOptions?: CacheOptions
  ): Promise<Entity[]> {
    const cacheKey = cacheOptions?.key || this.generateCacheKey('findMany', options);
    const cache = getCacheManager();

    try {
      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return cached as Entity[];
      }

      // Fetch from database
      const result = await this.repository.find(options);
      
      // Store in cache
      const ttl = cacheOptions?.ttl || this.defaultTTL;
      await cache.set(cacheKey, result, ttl);
      
      if (cacheOptions?.tags) {
        await this.setTags(cacheKey, cacheOptions.tags);
      }

      return result;
    } catch (error) {
      logger.error('Error in cached findMany', { error, cacheKey });
      // Fallback to direct database query
      return this.repository.find(options);
    }
  }

  /**
   * Count entities with caching
   */
  async count(
    options?: FindManyOptions<Entity>,
    cacheOptions?: CacheOptions
  ): Promise<number> {
    const cacheKey = cacheOptions?.key || this.generateCacheKey('count', options || {});
    const cache = getCacheManager();

    try {
      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        logger.debug('Cache hit', { key: cacheKey });
        return Number(cached);
      }

      // Fetch from database
      const result = await this.repository.count(options);
      
      // Store in cache
      const ttl = cacheOptions?.ttl || Math.min(this.defaultTTL, 60); // Counts cached for shorter time
      await cache.set(cacheKey, result, ttl);
      
      if (cacheOptions?.tags) {
        await this.setTags(cacheKey, cacheOptions.tags);
      }

      return result;
    } catch (error) {
      logger.error('Error in cached count', { error, cacheKey });
      // Fallback to direct database query
      return this.repository.count(options);
    }
  }

  /**
   * Execute a query builder with caching
   */
  async executeQuery<T = any>(
    queryBuilder: SelectQueryBuilder<Entity>,
    cacheOptions?: CacheOptions & { type?: 'getMany' | 'getOne' | 'getRawMany' | 'getRawOne' }
  ): Promise<T> {
    const queryType = cacheOptions?.type || 'getMany';
    const cacheKey = cacheOptions?.key || this.generateQueryCacheKey(queryBuilder, queryType);
    const cache = getCacheManager();

    try {
      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return cached as T;
      }

      // Execute query
      let result: any;
      switch (queryType) {
        case 'getOne':
          result = await queryBuilder.getOne();
          break;
        case 'getRawMany':
          result = await queryBuilder.getRawMany();
          break;
        case 'getRawOne':
          result = await queryBuilder.getRawOne();
          break;
        default:
          result = await queryBuilder.getMany();
      }
      
      // Store in cache
      const ttl = cacheOptions?.ttl || this.defaultTTL;
      await cache.set(cacheKey, result, ttl);
      
      if (cacheOptions?.tags) {
        await this.setTags(cacheKey, cacheOptions.tags);
      }

      return result;
    } catch (error) {
      logger.error('Error in cached query execution', { error, cacheKey });
      // Fallback to direct query execution
      switch (queryType) {
        case 'getOne':
          return await queryBuilder.getOne() as T;
        case 'getRawMany':
          return await queryBuilder.getRawMany() as T;
        case 'getRawOne':
          return await queryBuilder.getRawOne() as T;
        default:
          return await queryBuilder.getMany() as T;
      }
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const cache = getCacheManager();
    try {
      await cache.invalidateTags(tags);
      logger.debug('Invalidated cache by tags', { tags });
    } catch (error) {
      logger.error('Error invalidating cache by tags', { error, tags });
    }
  }

  /**
   * Invalidate all cache for this entity
   */
  async invalidateAll(): Promise<void> {
    const cache = getCacheManager();
    try {
      const pattern = `${this.entityName}:*`;
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        if (typeof (cache as any).mdelete === 'function') {
          await (cache as any).mdelete(keys);
        } else {
          for (const k of keys) {
            await cache.delete(k);
          }
        }
        logger.debug('Invalidated all cache for entity', { entity: this.entityName, count: keys.length });
      }
    } catch (error) {
      logger.error('Error invalidating all cache', { error, entity: this.entityName });
    }
  }

  /**
   * Save entity and invalidate related cache
   */
  async save(entity: Entity, tags?: string[]): Promise<Entity> {
    const result = await this.repository.save(entity);
    
    // Invalidate cache
    await this.invalidateAll();
    if (tags) {
      await this.invalidateByTags(tags);
    }
    
    return result;
  }

  /**
   * Remove entity and invalidate related cache
   */
  async remove(entity: Entity, tags?: string[]): Promise<Entity> {
    const result = await this.repository.remove(entity);
    
    // Invalidate cache
    await this.invalidateAll();
    if (tags) {
      await this.invalidateByTags(tags);
    }
    
    return result;
  }

  /**
   * Generate cache key for repository operations
   */
  private generateCacheKey(operation: string, options: any): string {
    const optionsHash = this.hashObject(options);
    return `${this.entityName}:${operation}:${optionsHash}`;
  }

  /**
   * Generate cache key for query builder
   */
  private generateQueryCacheKey(queryBuilder: SelectQueryBuilder<Entity>, type: string): string {
    const sql = queryBuilder.getQuery();
    const params = queryBuilder.getParameters();
    const queryHash = this.hashObject({ sql, params });
    return `${this.entityName}:query:${type}:${queryHash}`;
  }

  /**
   * Create a simple hash of an object for cache key generation
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Associate tags with a cache key
   */
  private async setTags(key: string, tags: string[]): Promise<void> {
    const cache = getCacheManager();
    for (const tag of tags) {
      if (typeof (cache as any).sadd === 'function') {
        await (cache as any).sadd(`tag:${tag}`, key);
      }
    }
  }
}