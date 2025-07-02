"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTags = exports.CacheKeyBuilder = exports.CachePut = exports.CacheEvict = exports.Cacheable = exports.getGlobalCacheManager = exports.setGlobalCacheManager = void 0;
// Global cache manager instance (to be set by the application)
let globalCacheManager = null;
function setGlobalCacheManager(manager) {
    globalCacheManager = manager;
}
exports.setGlobalCacheManager = setGlobalCacheManager;
function getGlobalCacheManager() {
    return globalCacheManager;
}
exports.getGlobalCacheManager = getGlobalCacheManager;
// Method decorator for caching
function Cacheable(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheManager = getGlobalCacheManager();
            if (!cacheManager) {
                // No cache manager, execute method normally
                return originalMethod.apply(this, args);
            }
            // Check condition
            if (options?.condition && !options.condition(...args)) {
                return originalMethod.apply(this, args);
            }
            // Generate cache key
            const cacheKey = generateCacheKey(target, propertyKey, args, options?.key);
            // Try to get from cache
            const cached = await cacheManager.get(cacheKey);
            if (cached !== null) {
                return cached;
            }
            // Execute method
            const result = await originalMethod.apply(this, args);
            // Store in cache
            await cacheManager.set(cacheKey, result, options?.ttl);
            // Tag if specified
            if (options?.tags) {
                await cacheManager.tag(cacheKey, options.tags);
            }
            return result;
        };
        return descriptor;
    };
}
exports.Cacheable = Cacheable;
// Method decorator for cache eviction
function CacheEvict(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheManager = getGlobalCacheManager();
            // Execute method first
            const result = await originalMethod.apply(this, args);
            if (!cacheManager) {
                return result;
            }
            // Generate cache key
            const cacheKey = generateCacheKey(target, propertyKey, args, options?.key);
            // Evict from cache
            await cacheManager.delete(cacheKey);
            // Invalidate tags if specified
            if (options?.tags) {
                await cacheManager.invalidateTags(options.tags);
            }
            return result;
        };
        return descriptor;
    };
}
exports.CacheEvict = CacheEvict;
// Method decorator for cache put (update cache after method execution)
function CachePut(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const cacheManager = getGlobalCacheManager();
            // Execute method
            const result = await originalMethod.apply(this, args);
            if (!cacheManager) {
                return result;
            }
            // Check condition
            if (options?.condition && !options.condition(...args)) {
                return result;
            }
            // Generate cache key
            const cacheKey = generateCacheKey(target, propertyKey, args, options?.key);
            // Update cache
            await cacheManager.set(cacheKey, result, options?.ttl);
            // Tag if specified
            if (options?.tags) {
                await cacheManager.tag(cacheKey, options.tags);
            }
            return result;
        };
        return descriptor;
    };
}
exports.CachePut = CachePut;
// Helper function to generate cache keys
function generateCacheKey(target, propertyKey, args, keyOption) {
    if (typeof keyOption === 'function') {
        return keyOption(target, propertyKey, ...args);
    }
    if (typeof keyOption === 'string') {
        return keyOption;
    }
    // Default key generation
    const className = target.constructor.name;
    const argsKey = args.map(arg => {
        if (typeof arg === 'object') {
            return JSON.stringify(arg);
        }
        return String(arg);
    }).join(':');
    return `${className}:${propertyKey}:${argsKey}`;
}
// Cache key builders
class CacheKeyBuilder {
    constructor() {
        this.parts = [];
    }
    static create() {
        return new CacheKeyBuilder();
    }
    add(part) {
        this.parts.push(String(part));
        return this;
    }
    addIf(condition, part) {
        if (condition) {
            this.parts.push(String(part));
        }
        return this;
    }
    build() {
        return this.parts.join(':');
    }
}
exports.CacheKeyBuilder = CacheKeyBuilder;
// Common cache tags
exports.CacheTags = {
    USER: (userId) => `user:${userId}`,
    ORGANIZATION: (orgId) => `org:${orgId}`,
    TEAM: (teamId) => `team:${teamId}`,
    PLAYER: (playerId) => `player:${playerId}`,
    WORKOUT: (workoutId) => `workout:${workoutId}`,
    ALL_USERS: 'all-users',
    ALL_TEAMS: 'all-teams',
    ALL_ORGANIZATIONS: 'all-organizations',
};
