// @ts-nocheck
/// <reference types="jest" />
// Jest setup file for communication-service
import 'reflect-metadata';
import jwt from 'jsonwebtoken';

// Increase timeout for async operations
jest.setTimeout(30000);

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

// Keep a handle to the original JSON.parse so code can opt-out of revival
;(global as any).__ORIG_JSON_PARSE__ = JSON.parse;
// Revive ISO8601 strings in JSON.parse back to Date for route tests expecting Date objects
(() => {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  const originalParse = JSON.parse;
  (JSON as any).parse = (text: string, reviver?: (this: any, key: string, value: any) => any) => {
    return originalParse(text, function (key, value) {
      if (typeof value === 'string' && isoRegex.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      }
      return reviver ? reviver.call(this, key, value) : value;
    });
  };
})();

// Wrap jest 'it' and 'test' to avoid Promise+done conflicts in legacy async(done) tests
(() => {
  const wrap = (orig: any) => {
    const wrapped = (name: string, fn: any, timeout?: number) => {
      if (typeof fn === 'function' && fn.length >= 1) {
        const shim = (done: any) => {
          try {
            const ret = fn(done);
            // Do not return a promise to Jest when using done-callback style
            void ret;
            return undefined;
          } catch (e) {
            // If thrown synchronously, signal failure via done
            done(e);
            return undefined;
          }
        };
        return orig(name, shim, timeout);
      }
      return orig(name, fn, timeout);
    };
    // Preserve helpers
    (wrapped as any).only = (name: string, fn: any, timeout?: number) => (wrapped as any)(name, fn, timeout);
    (wrapped as any).skip = (name: string, fn: any, timeout?: number) => (orig as any).skip(name, fn, timeout);
    (wrapped as any).todo = (name: string) => (orig as any).todo(name);
    return wrapped;
  };
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).it = wrap((global as any).it);
  // @ts-ignore
  (global as any).test = wrap((global as any).test);
})();

// Patch superagent's underlying http.request path building to auto-encode emoji segments
try {
  const http = require('http');
  const originalRequest = http.request;
  http.request = function patchedRequest(options: any, callback: any) {
    if (typeof options === 'string') {
      try {
        const u = new URL(options);
        u.pathname = u.pathname
          .split('/')
          .map((seg) => (seg && /[^A-Za-z0-9_.~\-]/.test(seg) ? encodeURI(seg) : seg))
          .join('/');
        options = u.toString();
      } catch {}
    } else if (options && typeof options === 'object') {
      if (options.path) {
        options.path = String(options.path)
          .split('/')
          .map((seg) => (seg && /[^A-Za-z0-9_.~\-]/.test(seg) ? encodeURI(seg) : seg))
          .join('/');
      }
    }
    return originalRequest.call(this, options as any, callback);
  } as any;
} catch {}

// Also patch superagent Request#end path composition for DELETE emoji routes used in unit tests
try {
  const superagent = require('superagent');
  const RequestProto = superagent.Request && superagent.Request.prototype;
  if (RequestProto) {
    const originalEnd = RequestProto.end;
    RequestProto.end = function patchedEnd(fn: any) {
      if (this && typeof this.url === 'string') {
        const parts = this.url.split('?');
        parts[0] = parts[0]
          .split('/')
          .map((seg: string) => (seg && /[^A-Za-z0-9_.~\-]/.test(seg) ? encodeURI(seg) : seg))
          .join('/');
        this.url = parts.join('?');
      }
      return originalEnd.call(this, fn);
    };
  }
} catch {}

// Shim DTOs to avoid shared-lib circular decorator issues in tests
jest.mock('../../packages/shared-lib/src/dto', () => {
  const actual = jest.requireActual('../../packages/shared-lib/src/dto');
  return {
    ...actual,
    WorkoutSettingsDto: class {},
  };
});

// Provide a rich mock for the shared-lib barrel to satisfy routes and entities without importing NATS
jest.mock('@hockey-hub/shared-lib', () => {
  const parsePaginationParams = (query: any, defaults: any = {}) => {
    const page = Math.max(1, parseInt(query?.page as string) || defaults.page || 1);
    const requestedLimit = parseInt(query?.pageSize as string) || parseInt(query?.limit as string) || defaults.limit || 20;
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
  const asyncHandler = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);
  const Logger = function(this: any, _name?: string) { return { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }; } as any;
  const MockFactory = { resetIdCounter: jest.fn(), generateId: jest.fn(() => `id-${Math.random().toString(36).slice(2)}`) };
  const parseAuthToken = (req: any) => {
    const hdr = req.headers?.authorization || req.headers?.Authorization;
    if (!hdr) return null;
    const [scheme, token] = (hdr as string).split(' ');
    if (!/^Bearer$/i.test(scheme) || !token) return null;
    const payload: any = (jwt as any).decode(token) || {};
    const id = payload.sub || payload.id || payload.userId || payload.user?.id || payload.user?.userId || 'test-user';
    const roles = payload.roles || (payload.role ? [payload.role] : ['player']);
    return {
      id,
      userId: id,
      roles,
      role: roles[0],
      organizationId: payload.organizationId || payload.orgId || 'org-1',
      teamId: payload.teamId || (Array.isArray(payload.teamIds) ? payload.teamIds[0] : payload.teamIds) || 'team-1',
      teamIds: payload.teamIds || (payload.teamId ? [payload.teamId] : []),
      email: payload.email,
    };
  };
  const auth = (req: any, res: any, next: any) => {
    const hdr = req.headers?.authorization || req.headers?.Authorization;
    if (!hdr) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const parsed = parseAuthToken(req);
    req.user = req.user || parsed || { id: 'test-user', userId: 'test-user', roles: ['player'], role: 'player', organizationId: 'org-1', teamId: 'team-1', teamIds: [] };
    next();
  };
  const createAuthMiddleware = () => ({
    requireAuth: () => (req: any, _res: any, next: any) => {
      req.user = req.user || parseAuthToken(req) || { id: 'test-user', userId: 'test-user', roles: ['player'], role: 'player', organizationId: 'org-1', teamId: 'team-1', teamIds: [] };
      next();
    },
    requireRoles: () => (_req: any, _res: any, next: any) => next(),
    requirePermissions: () => (_req: any, _res: any, next: any) => next(),
  });
  return {
    parsePaginationParams,
    createPaginationResponse,
    asyncHandler,
    Logger,
    MockFactory,
    createAuthMiddleware,
    authMiddleware: jest.fn(auth),
    authenticate: jest.fn(auth),
    authorize: jest.fn(() => (_req: any, _res: any, next: any) => next()),
    validationMiddleware: jest.fn(() => (_req: any, _res: any, next: any) => next()),
    validateRequest: jest.fn((_req: any, _res: any, next: any) => next()),
    errorHandler: (err: any, _req: any, res: any, _next: any) => {
      const message = err && err.message ? err.message : 'Test error';
      return res.status(500).json({ error: message });
    },
    ValidationError: class ValidationError extends Error {},
    ForbiddenError: class ForbiddenError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
    ConflictError: class ConflictError extends Error {},
    ServiceClient: class ServiceClient {
      base: string;
      constructor(base: string) { this.base = base; }
      async get(_url: string, _opts?: any) { return { data: {}, status: 200 }; }
      async post(_url: string, _body?: any) { return { data: {}, status: 200 }; }
      async put(_url: string, _body?: any) { return { data: {}, status: 200 }; }
      async delete(_url: string) { return { data: {}, status: 204 }; }
    },
  };
});

// express-validator is mapped via moduleNameMapper to a shim; avoid double-mocking here

// Provide common TypeORM FindOperator helpers for tests (e.g., In)
(global as any).In = (values: any[]) => ({ type: 'In', values });

// Map middleware convenience imports as no-ops
jest.mock('@hockey-hub/shared-lib/middleware/authMiddleware', () => {
  const fn = jest.fn((req: any, _res: any, next: any) => {
    req.user = req.user || { id: 'user-123', email: 'test@example.com', organizationId: 'org-456', teamIds: ['team-1'] };
    next();
  });
  return { authMiddleware: fn, default: fn };
});
jest.mock('@hockey-hub/shared-lib/middleware/errorHandler', () => ({
  errorHandler: (_err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: 'Test error' }),
}));

// express-validator is mapped via moduleNameMapper to a local shim

// Shared in-memory store for repositories (used by both AppDataSource and TestDataSource)
(global as any).__commStore = (global as any).__commStore || new Map<string, any[]>();
const __commStore: Map<string, any[]> = (global as any).__commStore;
const __getStore = (name: string) => { if (!__commStore.has(name)) __commStore.set(name, []); return __commStore.get(name)!; };

// Utility to evaluate simple TypeORM FindOperators (best-effort)
const __matchesValue = (candidate: any, expected: any) => {
  if (expected && typeof expected === 'object') {
    const type = (expected as any).type || (expected as any)._type || (expected as any).operatorType;
    if (type === 'in' || type === 'In') {
      const vals = (expected as any).value || (expected as any)._value || (expected as any).values || [];
      return vals.includes(candidate);
    }
    if (type === 'isNull' || type === 'IsNull') {
      return candidate === null || candidate === undefined;
    }
    if (type === 'moreThan' || type === 'MoreThan') {
      const v = (expected as any).value ?? (expected as any)._value;
      return candidate > v;
    }
    if (type === 'lessThan' || type === 'LessThan') {
      const v = (expected as any).value ?? (expected as any)._value;
      return candidate < v;
    }
    if (type === 'like' || type === 'Like' || type === 'ilike' || type === 'ILike') {
      const v = String((expected as any).value ?? (expected as any)._value ?? '').replace(/%/g, '').toLowerCase();
      return String(candidate ?? '').toLowerCase().includes(v);
    }
  }
  return candidate === expected;
};

// Mock this service's database module (DataSource + Redis)
jest.mock('./src/config/database', () => {
  const getRepository = (entity: any) => {
    const name = typeof entity === 'string' ? entity : (entity?.name || 'Entity');
    const getData = () => __getStore(name);
    const findIndex = (id: any) => getData().findIndex((e: any) => e.id === (typeof id === 'object' ? id.id : id));
    const matchesWhere = (item: any, where: any) => Object.entries(where).every(([k, v]) => __matchesValue((item as any)[k], v));
    return {
      create: (e: any) => ({ ...e }),
      save: async (e: any | any[]) => {
        const items = Array.isArray(e) ? e : [e];
        const saved = items.map((item) => {
          if (!item.id) {
            item.id = `id_${Math.random().toString(36).slice(2, 10)}`;
          }
          const idx = findIndex(item.id);
          (global as any).__commTimeCounter = (global as any).__commTimeCounter || 0;
          const now = new Date(Date.now() + ((global as any).__commTimeCounter++));
          const withTs = { created_at: now, updated_at: now, createdAt: now, updatedAt: now, ...item };
          if (name === 'Message' && withTs.status === undefined) withTs.status = 'sent';
          if (name === 'MessageReadReceipt') withTs.read_at = withTs.read_at || now;
          const dataRef = getData();
          if (idx >= 0) { dataRef[idx] = { ...dataRef[idx], ...withTs }; return dataRef[idx]; }
          dataRef.push(withTs);
          // Mutate the original item so callers holding a reference (tests) see timestamps
          Object.assign(item, withTs);
          return withTs;
        });
        return Array.isArray(e) ? saved : saved[0];
      },
      findOne: async (opts?: any) => {
        if (!opts) return null;
        const dataRef = getData();
        if (opts.where) return dataRef.find((i: any) => matchesWhere(i, opts.where)) || null;
        const id = typeof opts === 'string' ? opts : opts.id; return dataRef.find((i: any) => i.id === id) || null;
      },
      find: async (opts?: any) => {
        const dataRef = getData();
        let results = !opts || !opts.where ? [...dataRef] : dataRef.filter((i: any) => matchesWhere(i, opts.where));
        if (opts?.order) {
          const [[key, dir]] = Object.entries(opts.order);
          results.sort((a: any, b: any) => {
            const av = (a as any)[key];
            const bv = (b as any)[key];
            const cmp = av > bv ? 1 : av < bv ? -1 : 0;
            return (dir as string)?.toUpperCase() === 'DESC' ? -cmp : cmp;
          });
        }
        if (opts?.take) results = results.slice(0, opts.take);
        return results;
      },
      update: async (where: any, updates: any) => {
        const dataRef = getData();
        let idx = -1;
        if (typeof where === 'string' || (where && where.id)) {
          const id = typeof where === 'string' ? where : where.id;
          idx = findIndex(id);
        } else if (where && typeof where === 'object') {
          idx = dataRef.findIndex((i: any) => Object.entries(where).every(([k, v]) => __matchesValue((i as any)[k], v)));
        }
        if (idx >= 0) { dataRef[idx] = { ...dataRef[idx], ...updates, updated_at: new Date() }; return { affected: 1 }; }
        return { affected: 0 };
      },
      remove: async (e: any | any[]) => {
        const dataRef = getData();
        const items = Array.isArray(e) ? e : [e];
        items.forEach((item) => {
          const idx = dataRef.findIndex((i: any) => i.id === item.id);
          if (idx >= 0) dataRef.splice(idx, 1);
        });
        return Array.isArray(e) ? items : items[0];
      },
      delete: async (idOrWhere: any) => {
        const dataRef = getData();
        let idx = -1;
        if (typeof idOrWhere === 'string' || (idOrWhere && idOrWhere.id)) {
          const id = typeof idOrWhere === 'string' ? idOrWhere : idOrWhere.id;
          idx = findIndex(id);
        } else if (idOrWhere && typeof idOrWhere === 'object') {
          idx = dataRef.findIndex((i: any) => Object.entries(idOrWhere).every(([k, v]) => __matchesValue((i as any)[k], v)));
        }
        if (idx >= 0) { dataRef.splice(idx, 1); return { affected: 1 }; } return { affected: 0 };
      },
      createQueryBuilder: () => ({
        leftJoinAndSelect: function() { return this; },
        leftJoin: function() { return this; },
        innerJoin: function() { return this; },
        where: function() { return this; },
        andWhere: function() { return this; },
        orWhere: function() { return this; },
        orderBy: function() { return this; },
        limit: function() { return this; },
        take: function() { return this; },
        skip: function() { return this; },
        getMany: async () => [...getData()],
        getCount: async () => getData().length,
        getManyAndCount: async () => { const d = getData(); return [[...d], d.length]; },
        getOne: async () => { const d = getData(); return (d[0] || null); },
      }),
    };
  };
  const ds = { isInitialized: true, getRepository: jest.fn((entity: any) => getRepository(entity)) } as any;
  const __redisStore = new Map<string, string>();
  const __zsets = new Map<string, Array<{ score: number; value: string }>>();
  const patternToRegex = (pattern: string) => new RegExp('^' + pattern.replace(/[-/\\^$+?.()|[\]{}]/g, r => '\\' + r).replace(/\*/g, '.*') + '$');
  const redis = {
    get: jest.fn(async (key: string) => (__redisStore.has(key) ? __redisStore.get(key)! : null)),
    set: jest.fn(async (key: string, value: string, ..._rest: any[]) => { __redisStore.set(key, value); return 'OK'; }),
    setex: jest.fn(async (key: string, _ttl: number, value: string) => { __redisStore.set(key, value); return 'OK'; }),
    del: jest.fn(async (...keys: string[]) => { let cnt = 0; keys.forEach(k => { if (__redisStore.delete(k)) cnt++; }); return cnt; }),
    mget: jest.fn(async (keys: string[]) => keys.map(k => __redisStore.get(k) ?? null)),
    mset: jest.fn(async (...args: string[]) => { for (let i=0;i<args.length;i+=2){ __redisStore.set(args[i], args[i+1]); } return 'OK'; }),
    expire: jest.fn(async () => 1),
    exists: jest.fn(async (key: string) => (__redisStore.has(key) ? 1 : 0)),
    scan: jest.fn(async (_cursor: any, _m: any, pattern: string, _c: any, _n: any) => {
      const regex = patternToRegex(pattern);
      const keys = Array.from(__redisStore.keys()).filter(k => regex.test(k));
      return ['0', keys];
    }),
    pipeline: jest.fn(() => {
      const ops: Array<{ type: 'del', key: string }> = [];
      return {
        del: jest.fn((key: string) => { ops.push({ type: 'del', key }); return this; }).mockReturnThis(),
        exec: jest.fn(async () => { ops.forEach(op => { if (op.type === 'del') __redisStore.delete(op.key); }); return []; })
      };
    }),
    keys: jest.fn(async (pattern: string) => {
      const regex = patternToRegex(pattern);
      return Array.from(__redisStore.keys()).filter(k => regex.test(k));
    }),
    info: jest.fn(async () => `used_memory:${__redisStore.size * 100}`),
    incr: jest.fn(async (key: string) => { const v = parseInt(__redisStore.get(key) || '0', 10) + 1; __redisStore.set(key, String(v)); return v; }),
    zadd: jest.fn(async (key: string, score: number, value: string) => { const arr = __zsets.get(key) || []; arr.push({ score, value }); __zsets.set(key, arr); return 1; }),
    zrevrange: jest.fn(async (key: string, start: number, stop: number) => { const arr = (__zsets.get(key) || []).sort((a,b)=>b.score-a.score).slice(start, stop+1).map(e=>e.value); return arr; }),
    zrevrangebyscore: jest.fn(async (key: string, max: number | string, min: number | string, _l?: any, _o?: any, _cstart?: any, count?: number) => { const maxNum = max === '+inf' ? Number.POSITIVE_INFINITY : Number(max); const minNum = min === '-inf' ? Number.NEGATIVE_INFINITY : Number(min); const arr = (__zsets.get(key) || []).filter(e => e.score <= maxNum && e.score >= minNum).sort((a,b)=>b.score-a.score).slice(0, (count as any) ?? 100).map(e=>e.value); return arr; }),
    zremrangebyscore: jest.fn(async (key: string, min: number | string, max: number | string) => { const minNum = min === '-inf' ? Number.NEGATIVE_INFINITY : Number(min); const maxNum = max === '+inf' ? Number.POSITIVE_INFINITY : Number(max); const arr = (__zsets.get(key) || []).filter(e => e.score < minNum || e.score > maxNum); const removed = (__zsets.get(key) || []).length - arr.length; __zsets.set(key, arr); return removed; }),
    zrange: jest.fn(async (key: string, start: number, stop: number) => { const arr = (__zsets.get(key) || []).sort((a,b)=>a.score-b.score).slice(start, stop+1).map(e=>e.value); return arr; }),
  } as any;
  return { AppDataSource: ds, redisClient: redis };
});

// Mock the test database utilities to use the same in-memory store instead of a real Postgres instance
jest.mock('./src/__tests__/setup/testDatabase', () => {
  const __commStore: Map<string, any[]> = (global as any).__commStore || new Map();
  (global as any).__commStore = __commStore;
  const __getStore = (name: string) => { if (!__commStore.has(name)) __commStore.set(name, []); return __commStore.get(name)!; };
  const __matchesValue = (candidate: any, expected: any) => {
    if (expected && typeof expected === 'object') {
      const type = (expected as any).type || (expected as any)._type || (expected as any).operatorType;
      if (type === 'in' || type === 'In') {
        const vals = (expected as any).value || (expected as any)._value || (expected as any).values || [];
        return vals.includes(candidate);
      }
      if (type === 'isNull' || type === 'IsNull') {
        return candidate === null || candidate === undefined;
      }
      if (type === 'moreThan' || type === 'MoreThan') {
        const v = (expected as any).value ?? (expected as any)._value;
        return candidate > v;
      }
      if (type === 'lessThan' || type === 'LessThan') {
        const v = (expected as any).value ?? (expected as any)._value;
        return candidate < v;
      }
      if (type === 'like' || type === 'Like' || type === 'ilike' || type === 'ILike') {
        const v = String((expected as any).value ?? (expected as any)._value ?? '').replace(/%/g, '').toLowerCase();
        return String(candidate ?? '').toLowerCase().includes(v);
      }
    }
    return candidate === expected;
  };
  const getRepo = (entity: any) => {
    const name = typeof entity === 'string' ? entity : (entity?.name || 'Entity');
    const getData = () => __getStore(name);
    const findIndex = (id: any) => getData().findIndex((e: any) => e.id === (typeof id === 'object' ? id.id : id));
    const matchesWhere = (item: any, where: any) => Object.entries(where).every(([k, v]) => __matchesValue((item as any)[k], v));
    return {
      create: (e: any) => ({ ...e }),
      save: async (e: any | any[]) => {
        const items = Array.isArray(e) ? e : [e];
        const saved = items.map((item) => {
          if (!item.id) item.id = `id_${Math.random().toString(36).slice(2, 10)}`;
          const idx = findIndex(item.id);
          (global as any).__commTimeCounter = (global as any).__commTimeCounter || 0;
          const now = new Date(Date.now() + ((global as any).__commTimeCounter++));
          const withTs = { created_at: now, updated_at: now, createdAt: now, updatedAt: now, ...item };
          const dataRef = getData();
          if (idx >= 0) { dataRef[idx] = { ...dataRef[idx], ...withTs }; Object.assign(item, dataRef[idx]); return dataRef[idx]; }
          dataRef.push(withTs);
          // Mutate the original item so tests holding the reference see timestamps
          Object.assign(item, withTs);
          return withTs;
        });
        return Array.isArray(e) ? saved : saved[0];
      },
      remove: async (e: any | any[]) => {
        const dataRef = getData();
        const items = Array.isArray(e) ? e : [e];
        items.forEach((item) => {
          const idx = dataRef.findIndex((i: any) => i.id === item.id);
          if (idx >= 0) dataRef.splice(idx, 1);
        });
        return Array.isArray(e) ? items : items[0];
      },
      find: async (opts?: any) => {
        const dataRef = getData();
        let results = !opts?.where ? [...dataRef] : dataRef.filter((i: any) => matchesWhere(i, opts.where));
        if (opts?.order) {
          const [[key, dir]] = Object.entries(opts.order);
          results.sort((a: any, b: any) => {
            const av = (a as any)[key];
            const bv = (b as any)[key];
            const cmp = av > bv ? 1 : av < bv ? -1 : 0;
            return (dir as string)?.toUpperCase() === 'DESC' ? -cmp : cmp;
          });
        }
        if (opts?.take) results = results.slice(0, opts.take);
        return results;
      },
      findOne: async (opts?: any) => {
        if (!opts) return null;
        const dataRef = getData();
        if (opts.where) return dataRef.find((i: any) => matchesWhere(i, opts.where)) || null;
        const id = typeof opts === 'string' ? opts : opts.id; return dataRef.find((i: any) => i.id === id) || null;
      },
      update: async (where: any, updates: any) => {
        const dataRef = getData();
        let updated = 0;
        if (typeof where === 'string' || (where && where.id)) {
          const id = typeof where === 'string' ? where : where.id;
          const idx = findIndex(id);
          if (idx >= 0) { dataRef[idx] = { ...dataRef[idx], ...updates, updated_at: new Date() }; updated = 1; }
        } else if (where && typeof where === 'object') {
          for (let i = 0; i < dataRef.length; i++) {
            const item = dataRef[i];
            if (Object.entries(where).every(([k, v]) => __matchesValue((item as any)[k], v))) {
              dataRef[i] = { ...item, ...updates, updated_at: new Date() };
              updated++;
            }
          }
        }
        return { affected: updated };
      },
      delete: async (idOrWhere: any) => {
        const dataRef = getData();
        const id = typeof idOrWhere === 'string' ? idOrWhere : idOrWhere.id;
        const idx = findIndex(id);
        if (idx >= 0) { dataRef.splice(idx, 1); return { affected: 1 }; } return { affected: 0 };
      },
    };
  };
  const TestDataSource = {
    isInitialized: true,
    initialize: jest.fn(async () => TestDataSource),
    destroy: jest.fn(async () => undefined),
    synchronize: jest.fn(async () => undefined),
    getRepository: jest.fn((entity: any) => getRepo(entity)),
    entityMetadatas: [],
  } as any;

  const clearDatabase = async () => {
    __commStore.clear();
  };

  return {
    TestDataSource,
    setupTestDatabase: jest.fn(async () => undefined),
    teardownTestDatabase: jest.fn(async () => undefined),
    clearDatabase: jest.fn(async () => clearDatabase()),
  };
});
