"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedRepository = void 0;
const cacheConfig_1 = require("./cacheConfig");
const logger_1 = require("../logger");
const logger = (0, logger_1.createLogger)('CachedRepository');
/**
 * Base class for cached repositories
 * Provides caching capabilities for common repository operations
 */
class CachedRepository {
    constructor(repository, entityName, defaultTTL) {
        this.defaultTTL = 300; // 5 minutes default
        this.repository = repository;
        this.entityName = entityName;
        if (defaultTTL) {
            this.defaultTTL = defaultTTL;
        }
    }
    /**
     * Find one entity with caching
     */
    async findOne(options, cacheOptions) {
        const cacheKey = cacheOptions?.key || this.generateCacheKey('findOne', options);
        const cache = (0, cacheConfig_1.getCacheManager)();
        try {
            // Try cache first
            const cached = await cache.get(cacheKey);
            if (cached) {
                logger.debug('Cache hit', { key: cacheKey });
                return cached;
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
        }
        catch (error) {
            logger.error('Error in cached findOne', { error, cacheKey });
            // Fallback to direct database query
            return this.repository.findOne(options);
        }
    }
    /**
     * Find many entities with caching
     */
    async findMany(options, cacheOptions) {
        const cacheKey = cacheOptions?.key || this.generateCacheKey('findMany', options);
        const cache = (0, cacheConfig_1.getCacheManager)();
        try {
            // Try cache first
            const cached = await cache.get(cacheKey);
            if (cached) {
                logger.debug('Cache hit', { key: cacheKey });
                return cached;
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
        }
        catch (error) {
            logger.error('Error in cached findMany', { error, cacheKey });
            // Fallback to direct database query
            return this.repository.find(options);
        }
    }
    /**
     * Count entities with caching
     */
    async count(options, cacheOptions) {
        const cacheKey = cacheOptions?.key || this.generateCacheKey('count', options || {});
        const cache = (0, cacheConfig_1.getCacheManager)();
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
        }
        catch (error) {
            logger.error('Error in cached count', { error, cacheKey });
            // Fallback to direct database query
            return this.repository.count(options);
        }
    }
    /**
     * Execute a query builder with caching
     */
    async executeQuery(queryBuilder, cacheOptions) {
        const queryType = cacheOptions?.type || 'getMany';
        const cacheKey = cacheOptions?.key || this.generateQueryCacheKey(queryBuilder, queryType);
        const cache = (0, cacheConfig_1.getCacheManager)();
        try {
            // Try cache first
            const cached = await cache.get(cacheKey);
            if (cached) {
                logger.debug('Cache hit', { key: cacheKey });
                return cached;
            }
            // Execute query
            let result;
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
        }
        catch (error) {
            logger.error('Error in cached query execution', { error, cacheKey });
            // Fallback to direct query execution
            switch (queryType) {
                case 'getOne':
                    return await queryBuilder.getOne();
                case 'getRawMany':
                    return await queryBuilder.getRawMany();
                case 'getRawOne':
                    return await queryBuilder.getRawOne();
                default:
                    return await queryBuilder.getMany();
            }
        }
    }
    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags) {
        const cache = (0, cacheConfig_1.getCacheManager)();
        try {
            await cache.invalidateTags(tags);
            logger.debug('Invalidated cache by tags', { tags });
        }
        catch (error) {
            logger.error('Error invalidating cache by tags', { error, tags });
        }
    }
    /**
     * Invalidate all cache for this entity
     */
    async invalidateAll() {
        const cache = (0, cacheConfig_1.getCacheManager)();
        try {
            const pattern = `${this.entityName}:*`;
            const keys = await cache.keys(pattern);
            if (keys.length > 0) {
                await cache.mdel(keys);
                logger.debug('Invalidated all cache for entity', { entity: this.entityName, count: keys.length });
            }
        }
        catch (error) {
            logger.error('Error invalidating all cache', { error, entity: this.entityName });
        }
    }
    /**
     * Save entity and invalidate related cache
     */
    async save(entity, tags) {
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
    async remove(entity, tags) {
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
    generateCacheKey(operation, options) {
        const optionsHash = this.hashObject(options);
        return `${this.entityName}:${operation}:${optionsHash}`;
    }
    /**
     * Generate cache key for query builder
     */
    generateQueryCacheKey(queryBuilder, type) {
        const sql = queryBuilder.getQuery();
        const params = queryBuilder.getParameters();
        const queryHash = this.hashObject({ sql, params });
        return `${this.entityName}:query:${type}:${queryHash}`;
    }
    /**
     * Create a simple hash of an object for cache key generation
     */
    hashObject(obj) {
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
    async setTags(key, tags) {
        const cache = (0, cacheConfig_1.getCacheManager)();
        for (const tag of tags) {
            await cache.sadd(`tag:${tag}`, key);
        }
    }
}
exports.CachedRepository = CachedRepository;
//# sourceMappingURL=CachedRepository.js.map