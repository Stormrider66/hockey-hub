// Lightweight shim for @hockey-hub/shared-lib during calendar-service tests
// Expose only the minimal APIs needed by routes/tests to avoid loading the entire library index
// which pulls in decorators/ORM deps not required for these unit tests.
/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginationUtils = require('../../packages/shared-lib/src/utils/pagination');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginationTypes = require('../../packages/shared-lib/src/types/pagination');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MockFactory } = require('../../packages/shared-lib/src/testing/mockFactory');

function authenticate(req: any, _res: any, next: any) {
  // simple pass-through; test can spy on this function
  return next();
}

// Cache stubs
const CacheKeyBuilder = {
  build: (...parts: any[]) => parts.map((p) => (typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p))).join(':'),
};

class CachedRepository<T> {
  constructor(..._args: any[]) {}
}

const RedisCacheManager = {
  getInstance: jest.fn(() => ({
    get: jest.fn(async (_k: string) => null),
    set: jest.fn(async (_k: string, _v: any, _ttl?: number) => {}),
    delete: jest.fn(async (_k: string) => {}),
  })),
};

module.exports = {
  // Pagination helpers used by routes
  parsePaginationParams: paginationUtils.parsePaginationParams,
  paginateArray: paginationUtils.paginateArray,
  createPaginationResponse: paginationTypes.createPaginationResponse,

  // Auth middleware stubs – avoid pulling real 'jose' dependency
  createAuthMiddleware: () => ({
    extractUser: () => (_req: any, _res: any, next: any) => next(),
    requireAuth: () => (req: any, res: any, next: any) => authenticate(req, res, next),
  }),
  SharedAuthMiddleware: () => (_req: any, _res: any, next: any) => next(),

  // Expose authenticate for spying in tests
  authenticate,

  // Testing utilities
  MockFactory,

  // Commonly mocked members – provide harmless defaults so jest.mock can override safely
  authorize: () => (_req: any, _res: any, next: any) => next(),
  validationMiddleware: () => (_req: any, _res: any, next: any) => next(),

  // Cache exports expected by service/tests
  CachedRepository,
  CacheKeyBuilder,
  RedisCacheManager,

  // Logger stub used by services during tests
  Logger: class Logger {
    constructor(_name: string) {}
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    debug = jest.fn();
  },
};


