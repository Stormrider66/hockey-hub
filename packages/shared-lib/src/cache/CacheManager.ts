export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
  maxSize?: number; // Maximum number of items in cache
}

export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  createdAt: number;
}

export abstract class CacheManager {
  protected config: CacheConfig;

  constructor(config?: CacheConfig) {
    this.config = {
      ttl: 3600, // 1 hour default
      prefix: 'cache',
      maxSize: 1000,
      ...config,
    };
  }

  // Abstract methods to be implemented
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
  abstract exists(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract keys(pattern?: string): Promise<string[]>;
  // Optional capabilities (not all implementations must support these)
  // They are provided as concrete methods using base versions built on core primitives
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const results: (T | null)[] = [];
    for (const key of keys) {
      results.push(await this.get<T>(key));
    }
    return results;
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  async mdelete(keys: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    for (const key of keys) {
      results.push(await this.delete(key));
    }
    return results;
  }

  // Helper methods
  protected getFullKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  protected isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }

  // Cache-aside pattern helpers
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, get from factory
    const value = await factory();
    
    // Store in cache
    await this.set(key, value, ttl);
    
    return value;
  }

  // Invalidation patterns
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    const results = await this.mdelete(keys);
    return results.filter(r => r).length;
  }

  // Tagged invalidation
  async tag(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        await this.set(tagKey, taggedKeys);
      }
    }
  }

  async invalidateTags(tags: string[]): Promise<number> {
    let invalidated = 0;
    
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey) || [];
      
      for (const key of taggedKeys) {
        if (await this.delete(key)) {
          invalidated++;
        }
      }
      
      await this.delete(tagKey);
    }
    
    return invalidated;
  }

  // Statistics
  async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  }> {
    // This would need to be implemented with actual tracking
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
    };
  }
}