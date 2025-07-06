"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheManager = void 0;
const redis_1 = require("redis");
const CacheManager_1 = require("./CacheManager");
class RedisCacheManager extends CacheManager_1.CacheManager {
    constructor(config) {
        super(config);
        this.connected = false;
        // Create Redis client
        if (config?.url) {
            this.client = (0, redis_1.createClient)({ url: config.url });
        }
        else {
            this.client = (0, redis_1.createClient)({
                socket: {
                    host: config?.host || 'localhost',
                    port: config?.port || 6379,
                },
                password: config?.password,
                database: config?.db || 0,
            });
        }
        // Error handling
        this.client.on('error', (err) => {
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
    async connect() {
        if (!this.connected) {
            await this.client.connect();
        }
    }
    async disconnect() {
        if (this.connected) {
            await this.client.quit();
        }
    }
    async get(key) {
        try {
            const fullKey = this.getFullKey(key);
            const value = await this.client.get(fullKey);
            if (!value) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            console.error(`Error getting key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            const fullKey = this.getFullKey(key);
            const serialized = JSON.stringify(value);
            const expiry = ttl || this.config.ttl;
            if (expiry) {
                await this.client.setEx(fullKey, expiry, serialized);
            }
            else {
                await this.client.set(fullKey, serialized);
            }
        }
        catch (error) {
            console.error(`Error setting key ${key}:`, error);
            throw error;
        }
    }
    async delete(key) {
        try {
            const fullKey = this.getFullKey(key);
            const result = await this.client.del(fullKey);
            return result > 0;
        }
        catch (error) {
            console.error(`Error deleting key ${key}:`, error);
            return false;
        }
    }
    async exists(key) {
        try {
            const fullKey = this.getFullKey(key);
            const result = await this.client.exists(fullKey);
            return result > 0;
        }
        catch (error) {
            console.error(`Error checking existence of key ${key}:`, error);
            return false;
        }
    }
    async clear() {
        try {
            const pattern = `${this.config.prefix}:*`;
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        }
        catch (error) {
            console.error('Error clearing cache:', error);
            throw error;
        }
    }
    async keys(pattern) {
        try {
            const searchPattern = pattern || `${this.config.prefix}:*`;
            return await this.client.keys(searchPattern);
        }
        catch (error) {
            console.error('Error getting keys:', error);
            return [];
        }
    }
    // Redis-specific operations
    async increment(key, amount = 1) {
        const fullKey = this.getFullKey(key);
        return await this.client.incrBy(fullKey, amount);
    }
    async decrement(key, amount = 1) {
        const fullKey = this.getFullKey(key);
        return await this.client.decrBy(fullKey, amount);
    }
    async expire(key, ttl) {
        const fullKey = this.getFullKey(key);
        return await this.client.expire(fullKey, ttl);
    }
    async ttl(key) {
        const fullKey = this.getFullKey(key);
        return await this.client.ttl(fullKey);
    }
    // List operations
    async lpush(key, ...values) {
        const fullKey = this.getFullKey(key);
        const serialized = values.map(v => JSON.stringify(v));
        return await this.client.lPush(fullKey, serialized);
    }
    async rpush(key, ...values) {
        const fullKey = this.getFullKey(key);
        const serialized = values.map(v => JSON.stringify(v));
        return await this.client.rPush(fullKey, serialized);
    }
    async lrange(key, start, stop) {
        const fullKey = this.getFullKey(key);
        const values = await this.client.lRange(fullKey, start, stop);
        return values.map(v => JSON.parse(v));
    }
    async llen(key) {
        const fullKey = this.getFullKey(key);
        return await this.client.lLen(fullKey);
    }
    // Set operations
    async sadd(key, ...members) {
        const fullKey = this.getFullKey(key);
        const serialized = members.map(m => JSON.stringify(m));
        return await this.client.sAdd(fullKey, serialized);
    }
    async srem(key, ...members) {
        const fullKey = this.getFullKey(key);
        const serialized = members.map(m => JSON.stringify(m));
        return await this.client.sRem(fullKey, serialized);
    }
    async smembers(key) {
        const fullKey = this.getFullKey(key);
        const members = await this.client.sMembers(fullKey);
        return members.map(m => JSON.parse(m));
    }
    async sismember(key, member) {
        const fullKey = this.getFullKey(key);
        const serialized = JSON.stringify(member);
        return await this.client.sIsMember(fullKey, serialized);
    }
    // Hash operations
    async hset(key, field, value) {
        const fullKey = this.getFullKey(key);
        return await this.client.hSet(fullKey, field, JSON.stringify(value));
    }
    async hget(key, field) {
        const fullKey = this.getFullKey(key);
        const value = await this.client.hGet(fullKey, field);
        return value ? JSON.parse(value) : null;
    }
    async hgetall(key) {
        const fullKey = this.getFullKey(key);
        const hash = await this.client.hGetAll(fullKey);
        const result = {};
        for (const [field, value] of Object.entries(hash)) {
            result[field] = JSON.parse(value);
        }
        return result;
    }
    async hdel(key, ...fields) {
        const fullKey = this.getFullKey(key);
        return await this.client.hDel(fullKey, fields);
    }
    // Singleton pattern methods
    static getInstance(config) {
        if (!RedisCacheManager.instance) {
            RedisCacheManager.instance = new RedisCacheManager(config);
        }
        return RedisCacheManager.instance;
    }
    static async initializeInstance(config) {
        const instance = RedisCacheManager.getInstance(config);
        if (!instance.connected) {
            await instance.connect();
        }
        return instance;
    }
    // Public method to initialize connection (for compatibility)
    async initialize() {
        await this.connect();
    }
}
exports.RedisCacheManager = RedisCacheManager;
RedisCacheManager.instance = null;
//# sourceMappingURL=RedisCacheManager.js.map