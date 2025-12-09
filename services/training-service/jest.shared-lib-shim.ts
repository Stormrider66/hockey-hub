/* eslint-disable */
// Lightweight shim for @hockey-hub/shared-lib in training-service tests

export const parsePaginationParams = (query: any, defaults: any = {}) => {
  const page = Math.max(1, parseInt(query?.page as string) || defaults.page || 1);
  const requestedLimit = parseInt(query?.limit as string) || defaults.limit || 20;
  const maxLimit = defaults.maxLimit || 100;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
};

export const createPaginationResponse = (data: any[], page: number, pageSize: number, total?: number) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(pageSize) || 1);
  const computedTotal = total ?? data.length;
  const hasPrev = safePage > 1;
  const hasNext = computedTotal > safePage * safeSize;
  return { data, total: computedTotal, page: safePage, pageSize: safeSize, hasPrev, hasNext };
};

export const authorize = (_roles: string[]) => (_req: any, _res: any, next: any) => next();
export const validationMiddleware = (_dto?: any) => (_req: any, _res: any, next: any) => next();

export function authenticate(req: any, _res: any, next: any) { return next(); }
export function authMiddleware(req: any, _res: any, next: any) {
  if (!req.user) {
    req.user = { id: 'test-user-id', role: 'coach', roles: ['coach'], organizationId: 'test-org-id', teamId: 'test-team-id', teamIds: ['test-team-id'] };
  }
  return next();
}

export const CacheKeyBuilder = { build: (...parts: any[]) => parts.map((p) => (typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p))).join(':') };
export const RedisCacheManager = { getInstance: () => ({ get: async () => null, set: async () => {}, delete: async () => {} }) } as any;

export class CachedRepository<T> {
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

export const Logger = class {
  info = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
};

export const MockFactory = { resetIdCounter: () => {} };

// Event system stubs to satisfy EventPublisher extensions in tests
export class EventBus {
  publish = jest.fn(async () => {});
  subscribe = jest.fn(() => {});
}
export class EventFactory {
  createEvent = jest.fn((type: string, payload: any) => ({ type, payload, id: `evt-${Date.now()}` }));
}
export class EventPublisher {
  protected eventBus: EventBus;
  protected eventFactory: EventFactory;
  constructor(opts?: { eventBus?: EventBus; eventFactory?: EventFactory }) {
    this.eventBus = opts?.eventBus || new EventBus();
    this.eventFactory = opts?.eventFactory || new EventFactory();
  }
  async publish(type: string, payload: any) {
    const evt = this.eventFactory.createEvent(type, payload);
    await this.eventBus.publish(evt);
    return evt;
  }
}

// Auth middleware factory stub used by some route files
export function createAuthMiddleware() {
  return {
    extractUser: () => (req: any, _res: any, next: any) => {
      if (!req.user) {
        req.user = { id: 'test-user-id', role: 'coach', roles: ['coach'], organizationId: 'test-org-id', teamId: 'test-team-id', teamIds: ['test-team-id'] };
      }
      next();
    },
    requireAuth: () => (_req: any, _res: any, next: any) => next(),
  };
}

// Root-level error handler export (used by index.ts)
export function errorHandler(_err: any, _req: any, res: any, _next: any) {
  return res.status(500).json({ error: 'Test error' });
}

