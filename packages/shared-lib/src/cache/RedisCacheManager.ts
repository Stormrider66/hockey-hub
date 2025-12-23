// Fallback type for environments missing @types/redis
type RedisClientType = any;
let createClient: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ createClient } = require('redis'));
} catch {
  createClient = () => ({
    on: () => {},
    connect: async () => {},
    quit: async () => {},
    get: async () => null,
    setEx: async () => {},
    set: async () => {},
    del: async () => 0,
    exists: async () => 0,
    keys: async () => [],
    ttl: async () => -1,
    lPush: async () => 0,
    rPush: async () => 0,
    lRange: async () => [],
    lLen: async () => 0,
    sAdd: async () => 0,
    sRem: async () => 0,
    sMembers: async () => [],
    sIsMember: async () => 0,
    hSet: async () => 0,
    hGet: async () => null,
    hGetAll: async () => ({}),
    hDel: async () => 0,
    incrBy: async () => 0,
    decrBy: async () => 0,
    expire: async () => true,
  });
}
import { CacheManager, CacheConfig } from './CacheManager';

export interface RedisCacheConfig extends CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  url?: string;
}

export class RedisCacheManager extends CacheManager {
  private static instance: RedisCacheManager | null = null;
  private client: RedisClientType;
  private connected: boolean = false;

  constructor(config?: RedisCacheConfig) {
    super(config);
    
    // Create Redis client
    if (config?.url) {
      this.client = createClient({ url: config.url });
    } else {
      this.client = createClient({
        socket: {
          host: config?.host || 'localhost',
          port: config?.port || 6379,
        },
        password: config?.password,
        database: config?.db || 0,
      });
    }

    // Error handling
    this.client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
      this.connected = true;
    });

    this.client.on('end', () => {
      console.log('Redis Client Disconnected');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      try {
        await this.client.connect();
        this.connected = true;
      } catch (err) {
        console.error('Redis connect failed, continuing without cache:', err);
        this.connected = false;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.connected) return null;
      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.connected) return;
      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.config.ttl;

      if (expiry) {
        await this.client.setEx(fullKey, expiry, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.connected) return false;
      const fullKey = this.getFullKey(key);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.connected) return false;
      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      console.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const pattern = `${this.config.prefix}:*`;
      const keys = await this.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      if (!this.connected) return [];
      const searchPattern = pattern || `${this.config.prefix}:*`;
      return await this.client.keys(searchPattern);
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  // Redis-specific operations
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    return await this.client.incrBy(fullKey, amount);
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    return await this.client.decrBy(fullKey, amount);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.connected) return true;
    const fullKey = this.getFullKey(key);
    return await this.client.expire(fullKey, ttl);
  }

  async ttl(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return await this.client.ttl(fullKey);
  }

  // List operations
  async lpush<T>(key: string, ...values: T[]): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    const serialized = values.map(v => JSON.stringify(v));
    return await this.client.lPush(fullKey, serialized);
  }

  async rpush<T>(key: string, ...values: T[]): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    const serialized = values.map(v => JSON.stringify(v));
    return await this.client.rPush(fullKey, serialized);
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    if (!this.connected) return [];
    const fullKey = this.getFullKey(key);
    const values = await this.client.lRange(fullKey, start, stop);
    return values.map((v: string) => JSON.parse(v) as T);
  }

  async llen(key: string): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    return await this.client.lLen(fullKey);
  }

  // Set operations
  async sadd<T>(key: string, ...members: T[]): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    const serialized = members.map(m => JSON.stringify(m));
    return await this.client.sAdd(fullKey, serialized);
  }

  async srem<T>(key: string, ...members: T[]): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    const serialized = members.map(m => JSON.stringify(m));
    return await this.client.sRem(fullKey, serialized);
  }

  async smembers<T>(key: string): Promise<T[]> {
    if (!this.connected) return [];
    const fullKey = this.getFullKey(key);
    const members = await this.client.sMembers(fullKey);
    return members.map((m: string) => JSON.parse(m) as T);
  }

  async sismember<T>(key: string, member: T): Promise<boolean> {
    if (!this.connected) return false;
    const fullKey = this.getFullKey(key);
    const serialized = JSON.stringify(member);
    return await this.client.sIsMember(fullKey, serialized);
  }

  // Hash operations
  async hset<T>(key: string, field: string, value: T): Promise<number> {
    if (!this.connected) return 0;
    const fullKey = this.getFullKey(key);
    return await this.client.hSet(fullKey, field, JSON.stringify(value));
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.connected) return null;
    const fullKey = this.getFullKey(key);
    const value = await this.client.hGet(fullKey, field);
    return value ? JSON.parse(value) as T : null;
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    if (!this.connected) return {} as Record<string, T>;
    const fullKey = this.getFullKey(key);
    const hash = await this.client.hGetAll(fullKey);
    const result: Record<string, T> = {};
    
    for (const [field, value] of Object.entries(hash)) {
      result[field] = JSON.parse(value as string) as T;
    }
    
    return result;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    return await this.client.hDel(fullKey, fields);
  }

  // Alias methods for compatibility with calendar-service
  async invalidateByPattern(pattern: string): Promise<number> {
    return this.invalidatePattern(pattern);
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    return this.invalidateTags(tags);
  }

  // Singleton pattern methods
  static getInstance(config?: RedisCacheConfig): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager(config);
    }
    return RedisCacheManager.instance;
  }

  static async initializeInstance(config?: RedisCacheConfig): Promise<RedisCacheManager> {
    const instance = RedisCacheManager.getInstance(config);
    if (!instance.connected) {
      await instance.connect();
    }
    return instance;
  }

  // Public method to initialize connection (for compatibility)
  async initialize(): Promise<void> {
    await this.connect();
  }
}