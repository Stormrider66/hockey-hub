// @ts-nocheck
/// <reference types="jest" />
// Jest setup file for training-service
import 'reflect-metadata';

// Increase timeout for async operations
jest.setTimeout(10000);

// Only silence console in non-E2E runs
if (process.env.NODE_ENV !== 'e2e') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Mock environment variables for unit/integration, but preserve E2E
if (process.env.NODE_ENV !== 'e2e') {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
}

// Apply mocks only for unit/integration, not E2E
if (process.env.NODE_ENV !== 'e2e') {
  // Shim DTOs to avoid shared-lib circular decorator issues in tests
  jest.mock('../../packages/shared-lib/src/dto', () => {
    const actual = jest.requireActual('../../packages/shared-lib/src/dto');
    return {
      ...actual,
      WorkoutSettingsDto: class {},
    };
  });

  // Lightweight inline stub for @hockey-hub/shared-lib to avoid loading services/NATS
  jest.mock('@hockey-hub/shared-lib', () => {
    class CachedRepository<T> {
      protected repository: any;
      protected cacheManager: any;
      constructor(repo: any, _entityName?: string) {
        this.repository = repo;
        this.cacheManager = { get: async () => null, set: async () => {}, delete: async () => {} };
      }
      async save(entity: any) { return this.repository.save(entity); }
      async remove(entity: any) { return this.repository.remove(entity); }
      async invalidateByTags(_tags: string[]) {}
    }
    const parsePaginationParams = (query: any, defaults: any = {}) => {
      const page = Math.max(1, parseInt(query?.page as string) || defaults.page || 1);
      const requestedLimit = parseInt(query?.limit as string) || defaults.limit || 20;
      const maxLimit = defaults.maxLimit || 100;
      const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
      const skip = (page - 1) * limit;
      return { page, limit, skip, take: limit };
    };
    const createPaginationResponse = (data: any[], page: number, pageSize: number, total?: number) => {
      const safePage = Math.max(1, Number(page) || 1);
      const safeSize = Math.max(1, Number(pageSize) || 1);
      const computedTotal = total ?? data.length;
      const hasPrev = safePage > 1;
      const hasNext = computedTotal > safePage * safeSize;
      return { data, total: computedTotal, page: safePage, pageSize: safeSize, hasPrev, hasNext };
    };
    const CacheKeyBuilder = { build: (...parts: any[]) => parts.map((p) => (typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p))).join(':') };
    const RedisCacheManager = { getInstance: jest.fn(() => ({ get: jest.fn(async () => null), set: jest.fn(async () => {}), delete: jest.fn(async () => {}) })) };
    const errorHandler = (_err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: 'Test error' });
    const initializeCache = async () => {};
    const closeCache = async () => {};
    return {
      parsePaginationParams,
      createPaginationResponse,
      RedisCacheManager,
      CacheKeyBuilder,
      CachedRepository,
      MockFactory: { resetIdCounter: () => {} },
      errorHandler,
      initializeCache,
      closeCache,
    };
  });

  // Provide middleware convenience shims
  jest.mock('@hockey-hub/shared-lib/middleware', () => ({
    authorize: () => (_req: any, _res: any, next: any) => next(),
    validationMiddleware: () => (_req: any, _res: any, next: any) => next(),
    validateBody: () => (_req: any, _res: any, next: any) => next(),
    validateQuery: () => (_req: any, _res: any, next: any) => next(),
    validateParams: () => (_req: any, _res: any, next: any) => next(),
  }));

  jest.mock('@hockey-hub/shared-lib/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
      try {
        // Decode JWT payload if present
        const header = req.headers?.authorization || req.headers?.Authorization;
        if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
          const token = header.split(' ')[1];
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
          const role = (payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : undefined)) || 'coach';
          req.user = {
            id: payload.id || payload.userId || 'test-user-id',
            userId: payload.id || payload.userId || 'test-user-id',
            roles: Array.isArray(payload.roles) ? payload.roles : [role],
            role,
            organizationId: payload.organizationId || 'test-org-id',
            teamId: payload.teamId,
            teamIds: payload.teamIds || (payload.teamId ? [payload.teamId] : []),
            permissions: payload.permissions || ['training.create','training.read','training.update','training.delete'],
          };
        }
      } catch {}
      if (!req.user) {
        req.user = {
          id: 'test-user-id',
          userId: 'test-user-id',
          roles: ['coach'],
          role: 'coach',
          organizationId: 'test-org-id',
          teamId: 'test-team-id',
          teamIds: ['test-team-id'],
          permissions: ['training.create','training.read','training.update','training.delete'],
        };
      }
      next();
    },
  }));
  jest.mock('@hockey-hub/shared-lib/middleware/errorHandler', () => ({
    errorHandler: (_err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: 'Test error' }),
  }));
}

// Stub socket.io-client for integration tests and unit tests
jest.mock('socket.io-client', () => ({
  io: () => ({
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  }),
}), { virtual: true });

// Stub socket.io server used by src/index.ts imports
jest.mock('socket.io', () => ({
  Server: class {
    constructor() {}
    on() { return this; }
    to() { return this; }
    emit() { return this; }
    close() {}
  }
}), { virtual: true });

// Provide lightweight test DB factory to avoid real TypeORM metadata/entities
jest.mock('@hockey-hub/shared-lib/testing/testDatabaseFactory', () => {
  const stores: Record<string, any[]> = (global as any).__trainingDbStores || ((global as any).__trainingDbStores = {});
  const getStore = (name: string) => (stores[name] = stores[name] || []);
  const getRepository = (entity: any) => {
    const name = typeof entity === 'string' ? entity : (entity?.name || 'Entity');
    const data = getStore(name);
    const findIndex = (id: any) => data.findIndex((e: any) => e.id === (typeof id === 'object' ? id.id : id));
    return {
      create: (e: any) => ({ ...e }),
      save: async (e: any | any[]) => {
        const items = Array.isArray(e) ? e : [e];
        const saved = items.map((item) => {
          const idx = findIndex(item.id);
          if (idx >= 0) { data[idx] = { ...data[idx], ...item, updatedAt: new Date() }; return data[idx]; }
          const withId = item.id ? item : { ...item, id: `id-${Date.now()}-${Math.random()}` };
          data.push(withId); return withId;
        });
        return Array.isArray(e) ? saved : saved[0];
      },
      findOne: async (opts?: any) => {
        if (!opts) return null;
        if (opts.where && typeof opts.where === 'object') {
          return data.find((item: any) => Object.entries(opts.where).every(([k, v]) => (item as any)[k] === v)) || null;
        }
        const id = typeof opts === 'string' ? opts : opts.id;
        return data.find((item: any) => item.id === id) || null;
      },
      find: async (opts?: any) => {
        if (!opts?.where) return [...data];
        return data.filter((item: any) => Object.entries(opts.where).every(([k, v]) => (item as any)[k] === v));
      },
      delete: async (id: any) => { const idx = findIndex(id); if (idx >= 0) data.splice(idx, 1); return { affected: idx >= 0 ? 1 : 0 }; },
    };
  };
  const ds = { isInitialized: true, getRepository, destroy: async () => { Object.keys(stores).forEach((k) => { stores[k] = []; }); } } as any;
  const setupTestDatabase = (_serviceName: string, _entities: any[]) => {
    beforeAll(async () => { Object.keys(stores).forEach((k) => { stores[k] = []; }); });
    beforeEach(async () => {});
    afterAll(async () => { Object.keys(stores).forEach((k) => { stores[k] = []; }); });
    return {
      getDataSource: () => ds,
      getRepository: (entity: any) => ds.getRepository(entity),
    };
  };
  // Expose ds globally so tests can access getRepository symbolically
  (global as any).__trainingDS = ds;
  const getRepositoryExport = (entity: any) => ds.getRepository(entity);
  return { setupTestDatabase, getRepository: getRepositoryExport };
});

// Provide a global getRepository for legacy tests that reference it directly
if (!(global as any).getRepository) {
  (global as any).getRepository = (entity: any) => {
    const ds = (global as any).__trainingDS;
    return ds && typeof ds.getRepository === 'function' ? ds.getRepository(entity) : { };
  };
}

// In-memory AppDataSource mock to avoid real TypeORM metadata issues in unit/integration tests
jest.mock('./src/config/database', () => {
  const stores: Record<string, any[]> = (global as any).__trainingDbStores || ((global as any).__trainingDbStores = {});
  const getStore = (name: string) => (stores[name] = stores[name] || []);
  const repoFor = (entity: any) => {
    const name = typeof entity === 'string' ? entity : (entity?.name || 'Entity');
    const data = getStore(name);
    const findIndex = (id: any) => data.findIndex((e: any) => e.id === (typeof id === 'object' ? id.id : id));
    return {
      create: (e: any) => ({ ...e }),
      save: async (e: any | any[]) => {
        const items = Array.isArray(e) ? e : [e];
        const saved = items.map((item) => {
          const idx = findIndex(item.id);
          const now = new Date();
          const withTs = { createdAt: now, updatedAt: now, ...item };
          if (idx >= 0) { data[idx] = { ...data[idx], ...withTs }; return data[idx]; }
          data.push(withTs); return withTs;
        });
        return Array.isArray(e) ? saved : saved[0];
      },
      findOne: async (opts?: any) => {
        if (!opts) return null;
        if (opts.where && typeof opts.where === 'object') {
          return data.find((item: any) => Object.entries(opts.where).every(([k, v]) => (item as any)[k] === v)) || null;
        }
        const id = typeof opts === 'string' ? opts : opts.id;
        return data.find((item: any) => item.id === id) || null;
      },
      find: async (opts?: any) => {
        if (!opts?.where) return [...data];
        return data.filter((item: any) => Object.entries(opts.where).every(([k, v]) => (item as any)[k] === v));
      },
      remove: async (e: any) => { const idx = findIndex(e?.id); if (idx >= 0) data.splice(idx, 1); return e; },
      delete: async (id: any) => { const idx = findIndex(id); if (idx >= 0) data.splice(idx, 1); return { affected: idx >= 0 ? 1 : 0 }; },
      createQueryBuilder: () => ({
        leftJoinAndSelect: function() { return this; },
        where: function() { return this; },
        andWhere: function() { return this; },
        orderBy: function() { return this; },
        addOrderBy: function() { return this; },
        skip: function() { return this; },
        take: function() { return this; },
        limit: function() { return this; },
        getManyAndCount: async () => [[...data], data.length],
        getMany: async () => [...data],
        getOne: async () => (data[0] || null),
      }),
    };
  };
  const ds: any = {
    isInitialized: true,
    getRepository: jest.fn((entity: any) => repoFor(entity)),
    destroy: jest.fn(async () => { Object.keys(stores).forEach((k) => { stores[k] = []; }); }),
  };
  return { AppDataSource: ds, initializeDatabase: async () => {}, default: { AppDataSource: ds } };
});
