"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTags = exports.CacheKeys = exports.closeCache = exports.getCacheManager = exports.initializeCache = void 0;
const index_1 = require("./index");
const logger_1 = require("../logger");
const logger = (0, logger_1.createLogger)('CacheConfig');
let globalCacheManager = null;
/**
 * Initialize cache manager with Redis
 * Falls back to in-memory cache if Redis is not available
 */
async function initializeCache(config) {
    const defaultConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour default
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
    };
    const finalConfig = { ...defaultConfig, ...config };
    try {
        // Try to connect to Redis
        const cacheManager = new index_1.RedisCacheManager({
            host: finalConfig.host,
            port: finalConfig.port,
            password: finalConfig.password,
            db: finalConfig.db,
            maxRetriesPerRequest: finalConfig.maxRetriesPerRequest,
            enableReadyCheck: finalConfig.enableReadyCheck,
            enableOfflineQueue: finalConfig.enableOfflineQueue,
        });
        // Test connection
        await cacheManager.set('test:connection', 'ok', 1);
        const testValue = await cacheManager.get('test:connection');
        if (testValue === 'ok') {
            logger.info('Redis cache initialized successfully', {
                host: finalConfig.host,
                port: finalConfig.port,
                db: finalConfig.db,
            });
            globalCacheManager = cacheManager;
            return cacheManager;
        }
        else {
            throw new Error('Redis connection test failed');
        }
    }
    catch (error) {
        logger.warn('Failed to connect to Redis, falling back to in-memory cache', {
            error: error instanceof Error ? error.message : 'Unknown error',
            config: {
                host: finalConfig.host,
                port: finalConfig.port,
            },
        });
        // TODO: Implement in-memory cache fallback
        // For now, create a dummy cache manager that does nothing
        const dummyCache = {
            get: async () => null,
            set: async () => { },
            delete: async () => { },
            exists: async () => false,
            clear: async () => { },
            getTTL: async () => null,
            keys: async () => [],
            mget: async () => [],
            mset: async () => { },
            mdel: async () => { },
            increment: async () => 1,
            decrement: async () => 0,
            expire: async () => true,
            lpush: async () => 1,
            rpush: async () => 1,
            lpop: async () => null,
            rpop: async () => null,
            lrange: async () => [],
            llen: async () => 0,
            sadd: async () => 1,
            srem: async () => 1,
            smembers: async () => [],
            sismember: async () => false,
            hset: async () => { },
            hget: async () => null,
            hgetall: async () => ({}),
            hdel: async () => 1,
            invalidateTags: async () => { },
            close: async () => { },
        };
        globalCacheManager = dummyCache;
        return dummyCache;
    }
}
exports.initializeCache = initializeCache;
/**
 * Get the global cache manager instance
 */
function getCacheManager() {
    if (!globalCacheManager) {
        throw new Error('Cache manager not initialized. Call initializeCache() first.');
    }
    return globalCacheManager;
}
exports.getCacheManager = getCacheManager;
/**
 * Close the cache connection
 */
async function closeCache() {
    if (globalCacheManager) {
        await globalCacheManager.close();
        globalCacheManager = null;
        logger.info('Cache connection closed');
    }
}
exports.closeCache = closeCache;
/**
 * Common cache key generators
 */
exports.CacheKeys = {
    // User-related keys
    user: (id) => `user:${id}`,
    userByEmail: (email) => `user:email:${email}`,
    userPermissions: (userId) => `user:${userId}:permissions`,
    userRoles: (userId) => `user:${userId}:roles`,
    userSessions: (userId) => `user:${userId}:sessions`,
    // Organization-related keys
    organization: (id) => `org:${id}`,
    organizationTeams: (orgId) => `org:${orgId}:teams`,
    organizationUsers: (orgId) => `org:${orgId}:users`,
    // Team-related keys
    team: (id) => `team:${id}`,
    teamPlayers: (teamId) => `team:${teamId}:players`,
    teamCoaches: (teamId) => `team:${teamId}:coaches`,
    teamSchedule: (teamId) => `team:${teamId}:schedule`,
    // Training-related keys
    trainingSession: (id) => `training:session:${id}`,
    trainingTemplate: (id) => `training:template:${id}`,
    userTrainingSessions: (userId) => `training:user:${userId}:sessions`,
    // Calendar-related keys
    event: (id) => `calendar:event:${id}`,
    userEvents: (userId, date) => date ? `calendar:user:${userId}:events:${date}` : `calendar:user:${userId}:events`,
    teamEvents: (teamId, date) => date ? `calendar:team:${teamId}:events:${date}` : `calendar:team:${teamId}:events`,
    // Statistics-related keys
    playerStats: (playerId, season) => season ? `stats:player:${playerId}:${season}` : `stats:player:${playerId}`,
    teamStats: (teamId, season) => season ? `stats:team:${teamId}:${season}` : `stats:team:${teamId}`,
    // General patterns
    list: (entity, filters) => {
        const filterStr = filters ? ':' + Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':') : '';
        return `list:${entity}${filterStr}`;
    },
    count: (entity, filters) => {
        const filterStr = filters ? ':' + Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(':') : '';
        return `count:${entity}${filterStr}`;
    },
};
/**
 * Common cache tags for invalidation
 */
exports.CacheTags = {
    user: (id) => [`user:${id}`],
    organization: (id) => [`org:${id}`],
    team: (id) => [`team:${id}`],
    training: (sessionId) => [`training:${sessionId}`],
    calendar: (eventId) => [`calendar:${eventId}`],
    userAll: (userId) => [`user:${userId}`, `user:${userId}:*`],
    organizationAll: (orgId) => [`org:${orgId}`, `org:${orgId}:*`],
    teamAll: (teamId) => [`team:${teamId}`, `team:${teamId}:*`],
};
//# sourceMappingURL=cacheConfig.js.map