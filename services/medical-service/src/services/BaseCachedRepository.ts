import { Repository } from 'typeorm';
import { getCacheManager } from '@hockey-hub/shared-lib';

/**
 * Base class for cached repositories in medical service
 */
export abstract class BaseCachedRepository<T> {
  protected repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  /**
   * Cache a query result with automatic fallback
   */
  protected async cacheQueryResult<R>(
    cacheKey: string,
    queryFn: () => Promise<R>,
    ttl: number = 300,
    tags: string[] = []
  ): Promise<R> {
    try {
      const cache = getCacheManager();
      
      // Try cache first
      const cached = await cache.get<R>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute query
      const result = await queryFn();
      
      // Store in cache
      await cache.set(cacheKey, result, ttl);
      
      // Associate tags for invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
          await cache.sadd(`tag:${tag}`, cacheKey);
        }
      }

      return result;
    } catch (error) {
      console.error('Cache error:', error);
      // Fallback to direct query
      return queryFn();
    }
  }

  /**
   * Invalidate cache by tags
   */
  protected async invalidateTags(tags: string[]): Promise<void> {
    try {
      const cache = getCacheManager();
      for (const tag of tags) {
        const keys = await cache.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await cache.mdel(keys);
          await cache.delete(`tag:${tag}`);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Save entity and invalidate related cache
   */
  async save(entity: Partial<T>, invalidationTags: string[] = []): Promise<T> {
    const result = await this.repository.save(entity as any);
    
    // Invalidate cache
    if (invalidationTags.length > 0) {
      await this.invalidateTags(invalidationTags);
    }
    
    return result;
  }
}