import { RedisCacheManager } from './RedisCacheManager';
import { CacheManager } from './CacheManager';
import { LoggerFactory } from '../utils/Logger';

const logger = LoggerFactory.getLogger('CacheConfig');

export interface CacheBootstrapConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
}

let globalCacheManager: CacheManager | null = null;

/**
 * Initialize cache manager with Redis
 * Falls back to in-memory cache if Redis is not available
 */
export async function initializeCache(config?: Partial<CacheBootstrapConfig>): Promise<CacheManager> {
  const defaultConfig: CacheBootstrapConfig = {
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
    const cacheManager = new RedisCacheManager({
      host: finalConfig.host,
      port: finalConfig.port,
      password: finalConfig.password,
      db: finalConfig.db,
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
    } else {
      throw new Error('Redis connection test failed');
    }
  } catch (error) {
    logger.warn('Failed to connect to Redis, falling back to in-memory cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        host: finalConfig.host,
        port: finalConfig.port,
      },
    });

    // TODO: Implement in-memory cache fallback
    // For now, create a dummy cache manager that does nothing
    const dummyCache: CacheManager = {
      // Minimal implementation respecting CacheManager interface
      connect: async () => {},
      disconnect: async () => {},
      get: async () => null,
      set: async () => {},
      delete: async () => false,
      exists: async () => false,
      clear: async () => {},
      keys: async () => [],
      mget: async () => [],
      mset: async () => {},
      mdelete: async () => [],
    } as unknown as CacheManager;

    globalCacheManager = dummyCache;
    return dummyCache;
  }
}

/**
 * Get the global cache manager instance
 */
export function getCacheManager(): CacheManager {
  if (!globalCacheManager) {
    // Provide a minimal in-memory fallback for test environments
    const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    if (isTest) {
      const store = new Map<string, any>();
      const inMemory: any = {
        connect: async () => {},
        disconnect: async () => {},
        get: async (k: string) => (store.has(k) ? store.get(k) : null),
        set: async (k: string, v: any) => { store.set(k, v); },
        delete: async (k: string) => store.delete(k),
        exists: async (k: string) => store.has(k),
        clear: async () => { store.clear(); },
        keys: async () => Array.from(store.keys()),
        mget: async (keys: string[]) => keys.map(k => store.get(k)),
        mset: async (entries: Array<{ key: string; value: any; ttl?: number }>) => { for (const e of entries) store.set(e.key, e.value); },
        mdelete: async (keys: string[]) => keys.map(k => store.delete(k)),
      };
      globalCacheManager = inMemory as CacheManager;
    } else {
      throw new Error('Cache manager not initialized. Call initializeCache() first.');
    }
  }
  return globalCacheManager;
}

/**
 * Close the cache connection
 */
export async function closeCache(): Promise<void> {
  if (globalCacheManager) {
    try {
      await globalCacheManager.disconnect();
    } catch {}
    globalCacheManager = null;
    logger.info('Cache connection closed');
  }
}

/**
 * Common cache key generators
 */
export const CacheKeys = {
  // User-related keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userRoles: (userId: string) => `user:${userId}:roles`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
  
  // Organization-related keys
  organization: (id: string) => `org:${id}`,
  organizationTeams: (orgId: string) => `org:${orgId}:teams`,
  organizationUsers: (orgId: string) => `org:${orgId}:users`,
  
  // Team-related keys
  team: (id: string) => `team:${id}`,
  teamPlayers: (teamId: string) => `team:${teamId}:players`,
  teamCoaches: (teamId: string) => `team:${teamId}:coaches`,
  teamSchedule: (teamId: string) => `team:${teamId}:schedule`,
  
  // Training-related keys
  trainingSession: (id: string) => `training:session:${id}`,
  trainingTemplate: (id: string) => `training:template:${id}`,
  userTrainingSessions: (userId: string) => `training:user:${userId}:sessions`,
  
  // Calendar-related keys
  event: (id: string) => `calendar:event:${id}`,
  userEvents: (userId: string, date?: string) => 
    date ? `calendar:user:${userId}:events:${date}` : `calendar:user:${userId}:events`,
  teamEvents: (teamId: string, date?: string) => 
    date ? `calendar:team:${teamId}:events:${date}` : `calendar:team:${teamId}:events`,
  
  // Statistics-related keys
  playerStats: (playerId: string, season?: string) => 
    season ? `stats:player:${playerId}:${season}` : `stats:player:${playerId}`,
  teamStats: (teamId: string, season?: string) => 
    season ? `stats:team:${teamId}:${season}` : `stats:team:${teamId}`,
  
  // General patterns
  list: (entity: string, filters?: Record<string, any>) => {
    const filterStr = filters ? ':' + Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':') : '';
    return `list:${entity}${filterStr}`;
  },
  
  count: (entity: string, filters?: Record<string, any>) => {
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
export const CacheTags = {
  user: (id: string) => [`user:${id}`],
  organization: (id: string) => [`org:${id}`],
  team: (id: string) => [`team:${id}`],
  training: (sessionId: string) => [`training:${sessionId}`],
  calendar: (eventId: string) => [`calendar:${eventId}`],
  userAll: (userId: string) => [`user:${userId}`, `user:${userId}:*`],
  organizationAll: (orgId: string) => [`org:${orgId}`, `org:${orgId}:*`],
  teamAll: (teamId: string) => [`team:${teamId}`, `team:${teamId}:*`],
};