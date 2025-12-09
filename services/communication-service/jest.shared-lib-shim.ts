/* eslint-disable */
// Minimal shared-lib shim for communication-service tests to avoid heavy deps (NATS, etc.)
export const Logger = function(this: any, _name?: string) { return { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }; } as any;
export const MockFactory = { resetIdCounter: () => {}, generateId: () => `id-${Math.random().toString(36).slice(2)}` };
export const parsePaginationParams = (query: any, defaults: any = {}) => {
  const page = Math.max(1, parseInt(query?.page as string) || defaults.page || 1);
  const requestedLimit = parseInt(query?.pageSize as string) || parseInt(query?.limit as string) || defaults.limit || 20;
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
export const asyncHandler = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);
export class ValidationError extends Error {}
export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export const validateBody = () => (_req: any, _res: any, next: any) => next();
export const validateQuery = () => (_req: any, _res: any, next: any) => next();
export const authMiddleware = (req: any, _res: any, next: any) => { req.user = req.user || { id: 'user-123', organizationId: 'org-123', teamIds: ['team-1'] }; next(); };
export const authenticate = authMiddleware;
export const authorize = () => (_req: any, _res: any, next: any) => next();
export const errorHandler = (err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err?.message || 'Test error' });
export const createAuthMiddleware = () => ({
  requireAuth: () => (req: any, _res: any, next: any) => { req.user = req.user || { id: 'user-123', organizationId: 'org-123', teamIds: ['team-1'] }; next(); },
  requireRoles: () => (_req: any, _res: any, next: any) => next(),
  requirePermissions: () => (_req: any, _res: any, next: any) => next(),
});
export const CacheKeyBuilder = { build: (...parts: any[]) => parts.map((p) => (typeof p === 'object' && p !== null ? JSON.stringify(p) : String(p))).join(':') };
export const RedisCacheManager = { getInstance: () => ({ get: async () => null, set: async () => {}, delete: async () => {} }) } as any;
// Avoid importing NATS from shared-lib
export * as services from './__mocks__/shared-lib-services';
export class ServiceClient {
  base: string;
  constructor(base: string) { this.base = base; }
  async get(_url: string, _opts?: any) { return { data: [], status: 200 }; }
  async post(_url: string, _body?: any) { return { data: {}, status: 200 }; }
  async put(_url: string, _body?: any) { return { data: {}, status: 200 }; }
  async delete(_url: string) { return { data: {}, status: 204 }; }
}
