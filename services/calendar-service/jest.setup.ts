// @ts-nocheck
/// <reference types="jest" />
// Jest setup file for calendar-service
import 'reflect-metadata';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Shared in-memory store for repositories and test DB mocks
const __calendarTestStore: Map<string, any[]> = new Map();
const __getStore = (name: string) => {
  if (!__calendarTestStore.has(name)) __calendarTestStore.set(name, []);
  return __calendarTestStore.get(name)!;
};

// Shim problematic shared-lib DTO/module imports to avoid circular decorator init during these tests
jest.mock('../../packages/shared-lib/src/dto', () => {
  const actual = jest.requireActual('../../packages/shared-lib/src/dto');
  return {
    ...actual,
    WorkoutSettingsDto: class {},
  };
});

// Intentionally do NOT mock '@hockey-hub/shared-lib' here to avoid recursive require loops.
// Tests may mock it directly, and moduleNameMapper can point to the shim when needed.

// Also stub the convenience middleware entry to no-op validators used in routes
jest.mock('@hockey-hub/shared-lib/middleware', () => ({
  validateBody: () => (_req: any, _res: any, next: any) => next(),
  validateQuery: () => (_req: any, _res: any, next: any) => next(),
  validateParams: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock shared-lib test database factory to use in-memory store
jest.mock('@hockey-hub/shared-lib/testing/testDatabaseFactory', () => {
  const setupTestDatabase = (_serviceName: string, _entities: any[]) => {
    const getRepository = (entity: any) => {
      const name = entity.name || 'Entity';
      const data = __getStore(name);
      const findIndex = (id: any) => data.findIndex((e: any) => e.id === (typeof id === 'object' ? id.id : id));
      const matchesWhere = (item: any, where: any) => {
        return Object.entries(where).every(([k, v]) => {
          const val = (item as any)[k];
          if (v && typeof v === 'object') {
            // TypeORM FindOperator detection (best effort)
            const type = (v as any).type || (v as any)._type || (v as any).operatorType;
            if (type === 'isNull') {
              return val === null || val === undefined;
            }
            if (type === 'between' || Array.isArray((v as any).value)) {
              const arr = (v as any).value || v;
              const [start, end] = Array.isArray(arr) ? arr : [];
              if (!start || !end) return true;
              const t = val instanceof Date ? val.getTime() : new Date(val).getTime();
              return t >= new Date(start).getTime() && t <= new Date(end).getTime();
            }
          }
          return val === v;
        });
      };
      return {
        create: (e: any) => ({ ...e }),
        save: async (e: any | any[]) => {
          const items = Array.isArray(e) ? e : [e];
          const saved = items.map((item) => {
            const idx = findIndex(item.id);
            const now = new Date();
            const withTimestamps = { createdAt: now, updatedAt: now, ...item };
            if (idx >= 0) {
              data[idx] = { ...data[idx], ...withTimestamps };
              return data[idx];
            }
            data.push(withTimestamps);
            return withTimestamps;
          });
          return Array.isArray(e) ? saved : saved[0];
        },
        findOne: async (opts?: any) => {
          if (!opts) return null;
          if (opts.where && typeof opts.where === 'object') {
            return data.find((item: any) => matchesWhere(item, opts.where)) || null;
          }
          const id = typeof opts === 'string' ? opts : opts.id;
          return data.find((item: any) => item.id === id) || null;
        },
        find: async (opts?: any) => {
          if (!opts || !opts.where) return [...data];
          return data.filter((item: any) => matchesWhere(item, opts.where));
        },
        findAndCount: async (opts?: any) => {
          const rows = await (this as any).find(opts);
          const total = rows.length;
          const skip = opts?.skip || 0;
          const take = opts?.take || total;
          const pageRows = rows.slice(skip, skip + take);
          return [pageRows, total];
        },
        update: async (where: any, updates: any) => {
          const id = typeof where === 'string' ? where : where.id;
          const idx = findIndex(id);
          if (idx >= 0) data[idx] = { ...data[idx], ...updates, updatedAt: new Date() };
          return { affected: idx >= 0 ? 1 : 0 };
        },
        delete: async (idOrWhere: any) => {
          const id = typeof idOrWhere === 'string' ? idOrWhere : idOrWhere.id;
          const idx = findIndex(id);
          if (idx >= 0) data.splice(idx, 1);
          return { affected: idx >= 0 ? 1 : 0 };
        },
        createQueryBuilder: () => ({
          leftJoinAndSelect: function() { return this; },
          leftJoin: function() { return this; },
          where: function() { return this; },
          andWhere: function() { return this; },
          orderBy: function() { return this; },
          skip: function() { return this; },
          take: function() { return this; },
          getMany: async () => [...data],
          getManyAndCount: async () => [[...data], data.length],
          getOne: async () => (data[0] || null),
        }),
      };
    };
    const ds = {
      isInitialized: true,
      getRepository: jest.fn((entity: any) => getRepository(entity)),
    } as any;
    return { getDataSource: () => ds, getRepository: (entity: any) => ds.getRepository(entity) };
  };
  return { setupTestDatabase };
});

// Mock this service's own database module to use the in-memory store (and to be Jest-mockable)
jest.mock('./src/config/database', () => {
  const getRepository = (entity: any) => {
    const name = entity.name || 'Entity';
    const data = __getStore(name);
    const findIndex = (id: any) => data.findIndex((e: any) => e.id === (typeof id === 'object' ? id.id : id));
    const matchesWhere = (item: any, where: any) => {
      return Object.entries(where).every(([k, v]) => {
        const val = (item as any)[k];
        if (v && typeof v === 'object') {
          const type = (v as any).type || (v as any)._type || (v as any).operatorType;
          if (type === 'isNull') {
            return val === null || val === undefined;
          }
          if (type === 'between' || Array.isArray((v as any).value)) {
            const arr = (v as any).value || v;
            const [start, end] = Array.isArray(arr) ? arr : [];
            if (!start || !end) return true;
            const t = val instanceof Date ? val.getTime() : new Date(val).getTime();
            return t >= new Date(start).getTime() && t <= new Date(end).getTime();
          }
        }
        return val === v;
      });
    };
    return {
      create: (e: any) => ({ ...e }),
      save: async (e: any | any[]) => {
        const items = Array.isArray(e) ? e : [e];
        const saved = items.map((item) => {
          const idx = findIndex(item.id);
          const now = new Date();
          const withTimestamps = { createdAt: now, updatedAt: now, ...item };
          if (idx >= 0) {
            data[idx] = { ...data[idx], ...withTimestamps };
            return data[idx];
          }
          data.push(withTimestamps);
          return withTimestamps;
        });
        return Array.isArray(e) ? saved : saved[0];
      },
      findOne: async (opts?: any) => {
        if (!opts) return null;
        if (opts.where && typeof opts.where === 'object') {
          return data.find((item: any) => matchesWhere(item, opts.where)) || null;
        }
        const id = typeof opts === 'string' ? opts : opts.id;
        return data.find((item: any) => item.id === id) || null;
      },
      find: async (opts?: any) => {
        const matchesWhere = (item: any, where: any) => {
          return Object.entries(where).every(([k, v]) => {
            const val = (item as any)[k];
            if (v && typeof v === 'object') {
              const type = (v as any).type || (v as any)._type || (v as any).operatorType;
              if (type === 'isNull') {
                return val === null || val === undefined;
              }
              if (type === 'between' || Array.isArray((v as any).value)) {
                const arr = (v as any).value || v;
                const [start, end] = Array.isArray(arr) ? arr : [];
                if (!start || !end) return true;
                const t = val instanceof Date ? val.getTime() : new Date(val).getTime();
                return t >= new Date(start).getTime() && t <= new Date(end).getTime();
              }
            }
            return val === v;
          });
        };
        if (!opts || !opts.where) return [...data];
        return data.filter((item: any) => matchesWhere(item, opts.where));
      },
      findAndCount: async (opts?: any) => {
        const rows = await (this as any).find(opts);
        const total = rows.length;
        const skip = opts?.skip || 0;
        const take = opts?.take || total;
        const pageRows = rows.slice(skip, skip + take);
        return [pageRows, total];
      },
      update: async (where: any, updates: any) => {
        const id = typeof where === 'string' ? where : where.id;
        const idx = findIndex(id);
        if (idx >= 0) data[idx] = { ...data[idx], ...updates, updatedAt: new Date() };
        return { affected: idx >= 0 ? 1 : 0 };
      },
      delete: async (idOrWhere: any) => {
        const id = typeof idOrWhere === 'string' ? idOrWhere : idOrWhere.id;
        const idx = findIndex(id);
        if (idx >= 0) data.splice(idx, 1);
        return { affected: idx >= 0 ? 1 : 0 };
      },
      createQueryBuilder: () => ({
        leftJoinAndSelect: function() { return this; },
        leftJoin: function() { return this; },
        where: function() { return this; },
        andWhere: function() { return this; },
        orderBy: function() { return this; },
        skip: function() { return this; },
        take: function() { return this; },
        getMany: async () => [...data],
        getManyAndCount: async () => [[...data], data.length],
        getOne: async () => (data[0] || null),
      }),
    };
  };
  const ds = { isInitialized: true, getRepository: jest.fn((entity: any) => getRepository(entity)) } as any;
  return { AppDataSource: ds, getDataSource: () => ds, __setDataSource: (_: any) => {}, default: { AppDataSource: ds } };
});

// Map middleware convenience imports
jest.mock('@hockey-hub/shared-lib/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    try {
      const header = req.headers?.authorization || req.headers?.Authorization;
      if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
        const token = header.split(' ')[1];
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
        // Normalize fields expected by routes
        const role = (payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : undefined)) || 'player';
        req.user = {
          id: payload.id || payload.sub || payload.userId || 'user-test',
          userId: payload.id || payload.sub || payload.userId || 'user-test',
          role,
          roles: payload.roles || [role],
          organizationId: payload.organizationId || payload.orgId || 'org-123',
          teamId: payload.teamId || (Array.isArray(payload.teamIds) ? payload.teamIds[0] : payload.teamIds) || undefined,
          permissions: payload.permissions || [],
          childIds: payload.childIds || [],
        };
      }
    } catch {}
    next();
  },
}));
jest.mock('@hockey-hub/shared-lib/middleware/errorHandler', () => ({
  errorHandler: (err: any, _req: any, res: any, _next: any) => res.status(500).json({ success: false, error: err?.message || 'Internal error' }),
}));
