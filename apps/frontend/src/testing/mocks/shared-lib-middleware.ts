// Jest mock for @hockey-hub/shared-lib/middleware to avoid ESM/JOSE in tests
export const createAuthMiddleware = () => ({
  extractUser: () => (_req: any, _res: any, next: any) => next(),
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  requireRole: (_role: string) => (_req: any, _res: any, next: any) => next(),
  requireAnyPermission: (_perms: string[]) => (_req: any, _res: any, next: any) => next(),
});

export const validateBody = () => (_req: any, _res: any, next: any) => next();
export const validateQuery = () => (_req: any, _res: any, next: any) => next();
export const validationMiddleware = { validateBody, validateQuery } as any;

export default {
  createAuthMiddleware,
  validateBody,
  validateQuery,
  validationMiddleware,
};




