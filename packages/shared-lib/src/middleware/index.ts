export * from './auth.middleware';
// Backward-compat named exports to satisfy tests importing specific files
export { SharedAuthMiddleware as authMiddleware } from './auth.middleware';
export * from './service-registry';
export * from './service-client';
export * from './validationMiddleware';
export { validationMiddleware } from './validationMiddleware';
export * from './sanitizationMiddleware';
export * from './loggingMiddleware';
// Backward-compat path re-exports for tests using '@hockey-hub/shared-lib/middleware/errorHandler'
export { errorHandler } from '../errors/ErrorHandler';

// Shim exports for legacy imports used across services/tests
// authenticate: simple middleware requiring either req.user or req.service
export const authenticate = new (require('./auth.middleware').SharedAuthMiddleware)().requireAuth();

// authorize: basic role check against req.user.roles
export const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
  const userRoles: string[] = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const ok = roles.some((r) => userRoles.includes(r));
  if (!ok) return res.status(403).json({ success: false, error: 'forbidden' });
  next();
};