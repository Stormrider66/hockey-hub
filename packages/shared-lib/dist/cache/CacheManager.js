"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
class CacheManager {
    constructor(config) {
        this.config = {
            ttl: 3600, // 1 hour default
            prefix: 'cache',
            maxSize: 1000,
            ...config,
        };
    }
    // Helper methods
    getFullKey(key) {
        return `${this.config.prefix}:${key}`;
    }
    isExpired(entry) {
        if (!entry.expiresAt)
            return false;
        return Date.now() > entry.expiresAt;
    }
    // Batch operations
    async mget(keys) {
        const results = [];
        for (const key of keys) {
            results.push(await this.get(key));
        }
        return results;
    }
    async mset(entries) {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttl);
        }
    }
    async mdelete(keys) {
        const results = [];
        for (const key of keys) {
            results.push(await this.delete(key));
        }
        return results;
    }
    // Cache-aside pattern helpers
    async getOrSet(key, factory, ttl) {
        // Try to get from cache
        const cached = await this.get(key);
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
    async invalidatePattern(pattern) {
        const keys = await this.keys(pattern);
        const results = await this.mdelete(keys);
        return results.filter(r => r).length;
    }
    // Tagged invalidation
    async tag(key, tags) {
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const taggedKeys = await this.get(tagKey) || [];
            if (!taggedKeys.includes(key)) {
                taggedKeys.push(key);
                await this.set(tagKey, taggedKeys);
            }
        }
    }
    async invalidateTags(tags) {
        let invalidated = 0;
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const taggedKeys = await this.get(tagKey) || [];
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
    async getStats() {
        // This would need to be implemented with actual tracking
        return {
            hits: 0,
            misses: 0,
            hitRate: 0,
            size: 0,
        };
    }
}
exports.CacheManager = CacheManager;
