// Shim for @hockey-hub/shared-lib that deliberately avoids importing the DTO barrel
// to prevent initialization of training.dto in medical-service tests.

const entities = require('../../packages/shared-lib/src/entities');
const validation = require('../../packages/shared-lib/src/validation');
const cache = require('../../packages/shared-lib/src/cache');
const middleware = require('../../packages/shared-lib/src/middleware');
const errors = require('../../packages/shared-lib/src/errors');
const utils = require('../../packages/shared-lib/src/utils');
const saga = require('../../packages/shared-lib/src/saga');
const socketEvents = require('../../packages/shared-lib/src/types/socket-events');
const eventBus = require('../../packages/shared-lib/src/events/EventBus');
const eventFactory = require('../../packages/shared-lib/src/events/EventFactory');
const eventPublisher = require('../../packages/shared-lib/src/events/EventPublisher');
const trainingEvents = require('../../packages/shared-lib/src/events/training-events');
const trainingEventListeners = require('../../packages/shared-lib/src/events/training-event-listeners');
let testing;
try {
  testing = require('../../packages/shared-lib/src/testing');
} catch {
  testing = {};
}

// Provide a deterministic in-memory cache manager to avoid Redis in tests
class InMemoryCacheManager {
  constructor() {
    this.store = new Map();
  }
  async connect() {}
  async disconnect() { this.store.clear(); }
  async get(key) { return this.store.has(key) ? this.store.get(key) : null; }
  async set(key, value, _ttl) { this.store.set(key, value); }
  async delete(key) { return this.store.delete(key); }
  async exists(key) { return this.store.has(key); }
  async clear() { this.store.clear(); }
  async keys(pattern) {
    const all = Array.from(this.store.keys());
    if (!pattern) return all;
    const normalized = pattern.replace(/\*/g, '');
    return all.filter(k => k.includes(normalized));
  }
  async mdelete(keys) { for (const k of keys) this.store.delete(k); return keys.map(() => true); }
  async tag(key, tags) {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const list = this.store.get(tagKey) || [];
      if (!list.includes(key)) list.push(key);
      this.store.set(tagKey, list);
    }
  }
  async invalidateTags(tags) {
    let invalidated = 0;
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const list = this.store.get(tagKey) || [];
      for (const key of list) {
        if (this.store.delete(key)) invalidated++;
      }
      this.store.delete(tagKey);
    }
    return invalidated;
  }
  async sadd(tagKey, key) {
    const list = this.store.get(tagKey) || [];
    if (!list.includes(key)) list.push(key);
    this.store.set(tagKey, list);
  }
  async smembers(tagKey) { return this.store.get(tagKey) || []; }
  async deletePattern(pattern) {
    const normalized = pattern.replace(/\*/g, '');
    const keys = await this.keys(normalized);
    keys.forEach(k => this.store.delete(k));
    return keys.length;
  }
}

const inMemoryCache = new InMemoryCacheManager();

// Provide CacheKeyBuilder with a static build helper for compatibility
const decorators = require('../../packages/shared-lib/src/cache/decorators');
const RealCacheKeyBuilder = decorators.CacheKeyBuilder;
class CacheKeyBuilder extends RealCacheKeyBuilder {
  static build(...parts) {
    const builder = RealCacheKeyBuilder.create ? RealCacheKeyBuilder.create() : new RealCacheKeyBuilder();
    for (const part of parts) {
      const value = typeof part === 'object' ? JSON.stringify(part) : String(part);
      builder.add(value);
    }
    return builder.build();
  }
}

module.exports = {
  __esModule: true,
  // Base entities
  ...entities,
  // Validation
  ...validation,
  // Cache (includes CachedRepository, cacheConfig helpers)
  ...cache,
  // Middleware
  ...middleware,
  // Errors
  ...errors,
  // Utilities
  ...utils,
  // Saga
  ...saga,
  // Socket events
  ...socketEvents,
  // Events
  ...eventBus,
  ...eventFactory,
  ...eventPublisher,
  ...trainingEvents,
  ...trainingEventListeners,
  // Testing utilities
  ...testing,
  MockFactory: testing.MockFactory || { resetIdCounter: () => {}, generateId: () => 'mock-id-1' },
  testing,
  // Also expose named re-exports expected by tests
  testHelpers: testing,
  // Cache facade
  RedisCacheManager: class RedisCacheManager extends InMemoryCacheManager {
    static instance = inMemoryCache;
    constructor() { super(); return inMemoryCache; }
    static getInstance() { return inMemoryCache; }
    static async initializeInstance() { return inMemoryCache; }
    async initialize() {}
  },
  getCacheManager: () => inMemoryCache,
  initializeCache: async () => inMemoryCache,
  closeCache: async () => { await inMemoryCache.clear(); },
  CacheKeys: {
    list: (entity, filters) => {
      const filterStr = filters ? ':' + Object.entries(filters)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([k,v]) => `${k}:${v}`)
        .join(':') : '';
      return `${entity}:list:${JSON.stringify(filters || { type: 'all' })}`;
    }
  },
  CacheKeyBuilder,
  // Provide auth middleware compatible exports used by tests
  authMiddleware: (req, _res, next) => {
    // Try to decode a simple JWT created by test helpers; fallback to headers
    try {
      const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
      if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        // The tests' token payload mirrors createTestUser; we can't verify without key, so parse base64 if possible
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          req.user = {
            userId: payload.id || payload.userId || payload.sub || 'user-1',
            email: payload.email || 'test@example.com',
            roles: Array.isArray(payload.roles) ? payload.roles : (payload.role ? [payload.role] : []),
            permissions: payload.permissions || [],
            organizationId: payload.organizationId,
            teamIds: payload.teamIds || [],
            lang: payload.lang || 'en',
          };
        }
      }
    } catch {}
    next();
  },
  // Minimal auth and validation no-ops for routing
  authenticate: (req, _res, next) => next(),
  authorize: (roles) => (req, res, next) => {
    // Enforce minimal role-based restrictions for critical tests
    const reqUser = (req && (req.user || {}));
    const userRole = reqUser.role || (Array.isArray(reqUser.roles) ? reqUser.roles[0] : undefined);
    const normalize = (r) => (r || '').replace(/[\- ]/g, '_').toLowerCase();
    const role = normalize(userRole);
    const allowed = Array.isArray(roles) ? roles.map((r) => normalize(r)) : [];
    if (allowed.length > 0 && role && !allowed.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  },
  validationMiddleware: (_schema) => (req, _res, next) => next(),
  // Intentionally do NOT export anything from './dto' to avoid loading training.dto
};

// Ensure default export mirrors named exports for ESM interop
module.exports.default = module.exports;


