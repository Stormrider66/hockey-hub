// TS shim for @hockey-hub/shared-lib for medical-service tests
// Provides minimal, test-friendly exports without loading problematic DTOs

import type { Request, Response, NextFunction } from 'express';

// Re-export useful utilities and entities (for AuditableEntity base class)
export * from '../../packages/shared-lib/src/utils';
export * from '../../packages/shared-lib/src/entities';

// Testing helpers
export { MockFactory } from '../../packages/shared-lib/src/testing/mockFactory';
export * as testHelpers from '../../packages/shared-lib/src/testing/testHelpers';
export { createMockRequest, createMockResponse, createTestToken } from '../../packages/shared-lib/src/testing/testHelpers';

// Minimal DTO placeholders (avoid loading training DTOs)
export class CreateInjuryDto {}
export class UpdateInjuryDto {}
export class CreateWellnessEntryDto {}

// Pagination helpers re-export
export { paginate } from '../../packages/shared-lib/src/utils/pagination';
export const parsePaginationParams = (query: any, defaults: any = {}) => {
  const page = Math.max(1, parseInt(String(query?.page ?? defaults.page ?? '1'), 10) || 1);
  const requestedLimit = parseInt(String(query?.limit ?? query?.pageSize ?? defaults.limit ?? '20'), 10) || 20;
  const maxLimit = defaults.maxLimit ?? 100;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
};
export const createPaginationResponse = (data: any[], page: number, pageSize: number, total?: number) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(pageSize) || 1);
  const computedTotal = total ?? (Array.isArray(data) ? data.length : 0);
  const hasPrev = safePage > 1;
  const hasNext = computedTotal > safePage * safeSize;
  return { data, page: safePage, pageSize: safeSize, total: computedTotal, hasPrev, hasNext };
};

// In-memory cache facade compatible with repository expectations
class InMemoryCacheManager {
  private store = new Map<string, any>();

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> { this.store.clear(); }
  async get<T = any>(key: string): Promise<T | null> { return this.store.has(key) ? this.store.get(key) : null; }
  async set(key: string, value: any, _ttl?: number, _tags?: string[]): Promise<void> { this.store.set(key, value); }
  async delete(key: string): Promise<boolean> { return this.store.delete(key); }
  async exists(key: string): Promise<boolean> { return this.store.has(key); }
  async clear(): Promise<void> { this.store.clear(); }
  async keys(pattern?: string): Promise<string[]> {
    const all = Array.from(this.store.keys());
    if (!pattern) return all;
    const normalized = pattern.replace(/\*/g, '');
    return all.filter(k => k.includes(normalized));
  }
  async deletePattern(pattern: string): Promise<number> {
    const normalized = pattern.replace(/\*/g, '');
    const keys = await this.keys(normalized);
    keys.forEach(k => this.store.delete(k));
    return keys.length;
  }
  async sadd(tagKey: string, key: string): Promise<void> {
    const current = (this.store.get(tagKey) as string[]) || [];
    if (!current.includes(key)) current.push(key);
    this.store.set(tagKey, current);
  }
  async smembers(tagKey: string): Promise<string[]> { return (this.store.get(tagKey) as string[]) || []; }
  async mdel(keys: string[]): Promise<boolean[]> { return keys.map(k => this.store.delete(k)); }
}

const cacheInstance = new InMemoryCacheManager();

export class RedisCacheManager extends InMemoryCacheManager {
  static getInstance(): InMemoryCacheManager { return cacheInstance; }
  static async initializeInstance(): Promise<InMemoryCacheManager> { return cacheInstance; }
}

export const getCacheManager = (): InMemoryCacheManager => cacheInstance;
export const initializeCache = async (): Promise<InMemoryCacheManager> => cacheInstance;
export const closeCache = async (): Promise<void> => { await cacheInstance.clear(); };

export const CacheKeys = {
  list: (entity: string, filters?: Record<string, any>): string => {
    return `${entity}:list:${JSON.stringify(filters || { type: 'all' })}`;
  },
};

export class CacheKeyBuilder {
  private parts: string[] = [];
  static create(): CacheKeyBuilder { return new CacheKeyBuilder(); }
  add(part: string): CacheKeyBuilder { this.parts.push(part); return this; }
  build(): string { return this.parts.join(':'); }
  static build(...parts: any[]): string {
    return parts.map(p => (typeof p === 'object' ? JSON.stringify(p) : String(p))).join(':');
  }
}

// Minimal auth and validation
export const authenticate = (_req: Request, _res: Response, next: NextFunction) => next();

export const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const anyReq: any = req as any;
  const roleRaw: string | undefined = anyReq.user?.role || (Array.isArray(anyReq.user?.roles) ? anyReq.user.roles[0] : undefined);
  const normalize = (r?: string) => (r || '').replace(/[\- ]/g, '_').toLowerCase();
  const role = normalize(roleRaw);
  const allowed = Array.isArray(roles) ? roles.map(r => normalize(r)) : [];
  if (allowed.length > 0 && role && !allowed.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  return next();
};

export const validationMiddleware = (_schema?: any) => (_req: Request, _res: Response, next: NextFunction) => next();

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const auth = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        (req as any).user = {
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
};

// Default export for CJS interop
// Provide a default export so CJS/ESM interop doesn't break tests
export default {} as any;


