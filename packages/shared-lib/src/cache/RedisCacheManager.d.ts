import { CacheManager, CacheConfig } from './CacheManager';
export interface RedisCacheConfig extends CacheConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    url?: string;
}
export declare class RedisCacheManager extends CacheManager {
    private static instance;
    private client;
    private connected;
    constructor(config?: RedisCacheConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(pattern?: string): Promise<string[]>;
    increment(key: string, amount?: number): Promise<number>;
    decrement(key: string, amount?: number): Promise<number>;
    expire(key: string, ttl: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    lpush<T>(key: string, ...values: T[]): Promise<number>;
    rpush<T>(key: string, ...values: T[]): Promise<number>;
    lrange<T>(key: string, start: number, stop: number): Promise<T[]>;
    llen(key: string): Promise<number>;
    sadd<T>(key: string, ...members: T[]): Promise<number>;
    srem<T>(key: string, ...members: T[]): Promise<number>;
    smembers<T>(key: string): Promise<T[]>;
    sismember<T>(key: string, member: T): Promise<boolean>;
    hset<T>(key: string, field: string, value: T): Promise<number>;
    hget<T>(key: string, field: string): Promise<T | null>;
    hgetall<T>(key: string): Promise<Record<string, T>>;
    hdel(key: string, ...fields: string[]): Promise<number>;
    static getInstance(config?: RedisCacheConfig): RedisCacheManager;
    static initializeInstance(config?: RedisCacheConfig): Promise<RedisCacheManager>;
    initialize(): Promise<void>;
}
//# sourceMappingURL=RedisCacheManager.d.ts.map