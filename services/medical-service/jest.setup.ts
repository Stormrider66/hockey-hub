// @ts-nocheck
/// <reference types="jest" />
// Jest setup file for medical-service
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

// Encode Dates in JSON with a prefix so we can revive only real Date fields
const __ORIGINAL_DATE_TOJSON__ = Date.prototype.toJSON;
Date.prototype.toJSON = function dateToJsonPatched(this: Date) {
  try {
    const iso = __ORIGINAL_DATE_TOJSON__.call(this);
    return `__DATE__${iso}`;
  } catch {
    return __ORIGINAL_DATE_TOJSON__.call(this);
  }
};

// Convert only our tagged date strings back to Date instances
const __ORIGINAL_JSON_PARSE__ = JSON.parse;
(JSON as any).parse = ((text: string, reviver?: (this: any, key: string, value: any) => any) => {
  const dateReviver = function (this: any, key: string, value: any) {
    if (typeof value === 'string' && value.startsWith('__DATE__')) {
      const raw = value.slice('__DATE__'.length);
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
    return reviver ? reviver.call(this, key, value) : value;
  } as any;
  return __ORIGINAL_JSON_PARSE__(text, dateReviver);
}) as any;

// Ensure shared-lib shim is used for root imports and prevent tests from overriding it with requireActual
jest.mock('@hockey-hub/shared-lib', () => require('./jest.shared-lib-shim.ts'));
jest.mock('@hockey-hub/shared-lib', () => require('./jest.shared-lib-shim.ts'));

// Mock shared-lib testing DB to avoid real Postgres during unit tests that import its helpers
jest.mock('../../packages/shared-lib/src/testing/testDatabaseFactory', () => {
  const real = jest.requireActual('../../packages/shared-lib/src/testing/testDatabaseFactory');
  const serviceDb = require('./src/config/database');
  const getRepo = (entity: any) => serviceDb.getDataSource().getRepository(entity);
  const qbStub = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => []),
    getMany: jest.fn(async () => []),
    getManyAndCount: jest.fn(async () => [[], 0]),
    getCount: jest.fn(async () => 0),
  });
  return {
    ...real,
    setupTestDatabase: (_service: string, _entities: any[]) => ({
      getDataSource: () => ({
        isInitialized: true,
        getRepository: (entity: any) => getRepo(entity),
      }),
      getRepository: <T>(entity: any) => {
        const repo = getRepo(entity);
        // Ensure query builder includes clone
        (repo as any).createQueryBuilder = jest.fn(() => qbStub());
        return repo as any as T;
      },
    }),
  };
});

// Mock this service's own database module to use the in-memory DataSource
jest.mock('./src/config/database', () => {
  const repoFactory = () => ({
    save: jest.fn(async (e: any) => e),
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
    update: jest.fn(async () => ({})),
    delete: jest.fn(async () => ({})),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => []),
      getMany: jest.fn(async () => []),
      getCount: jest.fn(async () => 0),
    })),
  });
  const ds = {
    isInitialized: true,
    getRepository: jest.fn((_entity: any) => repoFactory()),
  } as any;
  // Simple in-memory store per entity
  const store = new Map<string, any[]>();
  const getStore = (name: string) => {
    if (!store.has(name)) store.set(name, []);
    return store.get(name)!;
  };

  // Override getRepository with persistent in-memory behavior
  const getRepository = (entity: any) => {
    const name = entity.name || 'Entity';
    const data = getStore(name);
    return {
      save: jest.fn(async (e: any | any[]) => {
        const items = Array.isArray(e) ? e : [e];
        for (const item of items) {
          if (item.id == null) item.id = data.length + 1;
          data.push({ ...item });
        }
        return Array.isArray(e) ? items : items[0];
      }),
      findOne: jest.fn(async (opts?: any) => {
        if (!opts?.where) return data[0] || null;
        return data.find((row) => Object.keys(opts.where).every(k => row[k] === opts.where[k])) || null;
      }),
      find: jest.fn(async (opts?: any) => {
        if (!opts?.where) return [...data];
        return data.filter((row) => Object.keys(opts.where).every(k => row[k] === opts.where[k]));
      }),
      update: jest.fn(async (where: any, updates: any) => {
        for (const row of data) {
          if (Object.keys(where).every((k) => row[k] === where[k])) {
            Object.assign(row, updates);
          }
        }
        return {};
      }),
      delete: jest.fn(async (idOrWhere: any) => {
        if (typeof idOrWhere === 'number') {
          const idx = data.findIndex((r) => r.id === idOrWhere);
          if (idx >= 0) data.splice(idx, 1);
        } else if (idOrWhere?.id) {
          const idx = data.findIndex((r) => r.id === idOrWhere.id);
          if (idx >= 0) data.splice(idx, 1);
        }
        return {};
      }),
      createQueryBuilder: jest.fn(() => ({
        _data: data,
        _where: [],
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn(function (this: any, _clause: string, params: any) { this._where.push(params); return this; }),
        andWhere: jest.fn(function (this: any, _clause: string, params?: any) { if (params) this._where.push(params); return this; }),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        clone: jest.fn(function (this: any) { return this; }),
        getRawMany: jest.fn(async function (this: any) { return []; }),
        getMany: jest.fn(async function (this: any) { return this._data; }),
        getManyAndCount: jest.fn(async function (this: any) { return [this._data, this._data.length]; }),
        getCount: jest.fn(async function (this: any) { return this._data.length; }),
      })),
    };
  };

  ds.getRepository = jest.fn((entity: any) => getRepository(entity));

  return {
    AppDataSource: ds,
    getDataSource: () => ds,
    __setDataSource: (_: any) => {},
  };
});

// Stabilize shared training DTOs to avoid decorator init order issues in tests
// Important: do NOT requireActual here; that would evaluate the circular DTOs
jest.mock('../../packages/shared-lib/src/dto', () => ({
  __esModule: true,
  // Provide minimal no-op classes to satisfy any type usage during tests
  CreateWorkoutSessionDto: class {},
  UpdateWorkoutSessionDto: class {},
  WorkoutSettingsDto: class {},
}));
