import { CacheManager } from './CacheManager';

// Global cache manager instance (to be set by the application)
let globalCacheManager: CacheManager | null = null;

export function setGlobalCacheManager(manager: CacheManager) {
  globalCacheManager = manager;
}

export function getGlobalCacheManager(): CacheManager | null {
  return globalCacheManager;
}

// Cache decorator options
export interface CacheOptions {
  ttl?: number;
  key?: string | ((target: any, propertyKey: string, ...args: any[]) => string);
  tags?: string[];
  condition?: (...args: any[]) => boolean;
}

// Method decorator for caching
export function Cacheable(options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
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
      const cacheKey = generateCacheKey(
        target,
        propertyKey,
        args,
        options?.key
      );

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

// Method decorator for cache eviction
export function CacheEvict(options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = getGlobalCacheManager();
      
      // Execute method first
      const result = await originalMethod.apply(this, args);

      if (!cacheManager) {
        return result;
      }

      // Generate cache key
      const cacheKey = generateCacheKey(
        target,
        propertyKey,
        args,
        options?.key
      );

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

// Method decorator for cache put (update cache after method execution)
export function CachePut(options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
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
      const cacheKey = generateCacheKey(
        target,
        propertyKey,
        args,
        options?.key
      );

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

// Helper function to generate cache keys
function generateCacheKey(
  target: any,
  propertyKey: string,
  args: any[],
  keyOption?: string | ((target: any, propertyKey: string, ...args: any[]) => string)
): string {
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
export class CacheKeyBuilder {
  private parts: string[] = [];

  static create(): CacheKeyBuilder {
    return new CacheKeyBuilder();
  }

  add(part: string | number | boolean): CacheKeyBuilder {
    this.parts.push(String(part));
    return this;
  }

  addIf(condition: boolean, part: string | number): CacheKeyBuilder {
    if (condition) {
      this.parts.push(String(part));
    }
    return this;
  }

  build(): string {
    return this.parts.join(':');
  }
}

// Common cache tags
export const CacheTags = {
  USER: (userId: string) => `user:${userId}`,
  ORGANIZATION: (orgId: string) => `org:${orgId}`,
  TEAM: (teamId: string) => `team:${teamId}`,
  PLAYER: (playerId: string) => `player:${playerId}`,
  WORKOUT: (workoutId: string) => `workout:${workoutId}`,
  ALL_USERS: 'all-users',
  ALL_TEAMS: 'all-teams',
  ALL_ORGANIZATIONS: 'all-organizations',
} as const;