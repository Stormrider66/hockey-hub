// @ts-nocheck
/// <reference types="jest" />
// Jest setup file for user-service
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
// Align both suites on error shape expectations
process.env.ERROR_SHAPE = 'string_with_codes';
// Do not globally disable validation; tests control via res.locals

// Mock bcrypt to use bcryptjs for tests (no native binding)
jest.mock('bcrypt', () => require('bcryptjs'));
// Mock DOMPurify dependency used by shared sanitization middleware
jest.mock('isomorphic-dompurify', () => ({
  sanitize: (s: any) => s
}));

// Ensure shared createMockResponse returns jest spies in this suite
jest.mock('@hockey-hub/shared-lib/testing/testHelpers', () => {
  const actual = jest.requireActual('@hockey-hub/shared-lib/testing/testHelpers');
  return {
    ...actual,
    createMockResponse: () => {
      const res: any = { locals: {} };
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      res.setHeader = jest.fn().mockReturnValue(res);
      res.cookie = jest.fn().mockReturnValue(res);
      res.clearCookie = jest.fn().mockReturnValue(res);
      res.redirect = jest.fn().mockReturnValue(res);
      return res;
    }
  };
});

// Shared in-memory DB for tests
const __TEST_DB__ = (global as any).__TEST_DB__ || { storage: new Map<string, any[]>(), ds: null as any };
(global as any).__TEST_DB__ = __TEST_DB__;
let __idCounter = 1;
const makeRepo = (name: string) => ({
    save: jest.fn(async (items: any | any[]) => {
      const list = __TEST_DB__.storage.get(name) || [];
      const arr = Array.isArray(items) ? items : [items];
      for (const it of arr) {
        const record: any = { ...it };
        if (record.id === undefined || record.id === null) {
          record.id = `${name.toLowerCase()}-${__idCounter++}`;
        }
        list.push(record);
      }
      __TEST_DB__.storage.set(name, list);
      return Array.isArray(items) ? items : arr[0];
    }),
    findOne: jest.fn(async (opts?: any) => {
      const list = __TEST_DB__.storage.get(name) || [];
      if (!opts || !opts.where) return list[list.length - 1] || null;
      const matches = list.filter((it: any) => Object.entries(opts.where).every(([k, v]) => it[k] === v));
      return matches.length > 0 ? matches[matches.length - 1] : null;
    }),
    find: jest.fn(async (opts?: any) => {
      const list = __TEST_DB__.storage.get(name) || [];
      if (!opts || !opts.where) return list;
      return list.filter((it: any) => Object.entries(opts.where).every(([k, v]) => {
        if (typeof v === 'object' && v && 'id' in v) return it[k]?.id === (v as any).id;
        return it[k] === v;
      }));
    }),
    create: jest.fn((data: any) => ({ ...data })),
    delete: jest.fn(async (criteria: any) => {
      const list = __TEST_DB__.storage.get(name) || [];
      const id = typeof criteria === 'object' ? criteria.id : criteria;
      const newList = list.filter((it: any) => it.id !== id);
      __TEST_DB__.storage.set(name, newList);
      return { affected: list.length - newList.length } as any;
    }),
    createQueryBuilder: jest.fn(() => ({ where: jest.fn().mockReturnThis(), getCount: jest.fn(async () => (__TEST_DB__.storage.get(name) || []).length) })),
  });
  const ds = {
    isInitialized: true,
    getRepository: jest.fn((entity: any) => makeRepo(typeof entity === 'string' ? entity : entity.name)),
    dropDatabase: jest.fn(async () => __TEST_DB__.storage.clear()),
    synchronize: jest.fn(async () => {}),
    destroy: jest.fn(async () => {}),
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(), startTransaction: jest.fn(), commitTransaction: jest.fn(), rollbackTransaction: jest.fn(), release: jest.fn(), manager: {}
    })),
  } as any;
  __TEST_DB__.ds = ds;

// Helper to reset login attempts in controller
const resetLoginAttempts = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { __resetLoginAttempts } = require('./src/controllers/authController');
    if (typeof __resetLoginAttempts === 'function') {
      __resetLoginAttempts();
    }
  } catch {}
};

// Mock shared-lib testing database factory to avoid real Postgres
jest.mock('@hockey-hub/shared-lib/testing/testDatabaseFactory', () => {
  return {
    TestDatabaseFactory: {
      create: jest.fn(async () => { resetLoginAttempts(); return ds; }),
      reset: jest.fn(async () => { __TEST_DB__.storage.clear(); resetLoginAttempts(); }),
      close: jest.fn(async () => __TEST_DB__.storage.clear()),
      closeAll: jest.fn(async () => __TEST_DB__.storage.clear()),
      seed: jest.fn(async (_ds: any, data: any[]) => { for (const d of data) await makeRepo(d.entity.name).save(d.data); }),
      transaction: jest.fn(async (_ds: any, work: any) => work({})),
    },
    setupTestDatabase: jest.fn((_service: string, _entities: any[]) => ({
      getDataSource: () => ds,
      getRepository: <T>(entity: any) => makeRepo(typeof entity === 'string' ? entity : entity.name) as any as T,
    })),
  };
});

// Mock our config database to use the same in-memory DataSource
jest.mock('./src/config/database', () => {
  const testDb = (global as any).__TEST_DB__;
  return {
    AppDataSource: testDb.ds,
    getDataSource: () => testDb.ds,
    __setDataSource: (ds: any) => { (global as any).__TEST_DB__.ds = ds; },
  };
});

// Initialize cache in tests with no-redis dummy implementation
jest.mock('@hockey-hub/shared-lib/cache/cacheConfig', () => {
  const actual = jest.requireActual('@hockey-hub/shared-lib/cache/cacheConfig');
  return {
    ...actual,
    initializeCache: async () => {
      // Return the dummy cache manager already implemented in shared-lib when Redis fails
      return await actual.initializeCache({ host: 'localhost', port: 6379 });
    },
  };
});
