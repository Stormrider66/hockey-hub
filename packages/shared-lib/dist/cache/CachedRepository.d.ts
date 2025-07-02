import { Repository, SelectQueryBuilder, FindManyOptions, FindOneOptions, ObjectLiteral } from 'typeorm';
export interface CacheOptions {
    ttl?: number;
    key?: string;
    tags?: string[];
}
/**
 * Base class for cached repositories
 * Provides caching capabilities for common repository operations
 */
export declare class CachedRepository<Entity extends ObjectLiteral> {
    protected repository: Repository<Entity>;
    protected entityName: string;
    protected defaultTTL: number;
    constructor(repository: Repository<Entity>, entityName: string, defaultTTL?: number);
    /**
     * Find one entity with caching
     */
    findOne(options: FindOneOptions<Entity>, cacheOptions?: CacheOptions): Promise<Entity | null>;
    /**
     * Find many entities with caching
     */
    findMany(options: FindManyOptions<Entity>, cacheOptions?: CacheOptions): Promise<Entity[]>;
    /**
     * Count entities with caching
     */
    count(options?: FindManyOptions<Entity>, cacheOptions?: CacheOptions): Promise<number>;
    /**
     * Execute a query builder with caching
     */
    executeQuery<T = any>(queryBuilder: SelectQueryBuilder<Entity>, cacheOptions?: CacheOptions & {
        type?: 'getMany' | 'getOne' | 'getRawMany' | 'getRawOne';
    }): Promise<T>;
    /**
     * Invalidate cache by tags
     */
    invalidateByTags(tags: string[]): Promise<void>;
    /**
     * Invalidate all cache for this entity
     */
    invalidateAll(): Promise<void>;
    /**
     * Save entity and invalidate related cache
     */
    save(entity: Entity, tags?: string[]): Promise<Entity>;
    /**
     * Remove entity and invalidate related cache
     */
    remove(entity: Entity, tags?: string[]): Promise<Entity>;
    /**
     * Generate cache key for repository operations
     */
    private generateCacheKey;
    /**
     * Generate cache key for query builder
     */
    private generateQueryCacheKey;
    /**
     * Create a simple hash of an object for cache key generation
     */
    private hashObject;
    /**
     * Associate tags with a cache key
     */
    private setTags;
}
//# sourceMappingURL=CachedRepository.d.ts.map