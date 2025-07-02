export interface CacheConfig {
    ttl?: number;
    prefix?: string;
    maxSize?: number;
}
export interface CacheEntry<T> {
    value: T;
    expiresAt?: number;
    createdAt: number;
}
export declare abstract class CacheManager {
    protected config: CacheConfig;
    constructor(config?: CacheConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract get<T>(key: string): Promise<T | null>;
    abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
    abstract delete(key: string): Promise<boolean>;
    abstract exists(key: string): Promise<boolean>;
    abstract clear(): Promise<void>;
    abstract keys(pattern?: string): Promise<string[]>;
    protected getFullKey(key: string): string;
    protected isExpired(entry: CacheEntry<any>): boolean;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset<T>(entries: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<void>;
    mdelete(keys: string[]): Promise<boolean[]>;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
    invalidatePattern(pattern: string): Promise<number>;
    tag(key: string, tags: string[]): Promise<void>;
    invalidateTags(tags: string[]): Promise<number>;
    getStats(): Promise<{
        hits: number;
        misses: number;
        hitRate: number;
        size: number;
    }>;
}
//# sourceMappingURL=CacheManager.d.ts.map