import { Response, NextFunction } from 'express';
import { TypedRequest } from '@hockey-hub/types';
export type RBACMiddleware = (req: TypedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware factory to check if user has at least one of the provided roles.
 * @param roles Roles that are allowed to access the route.
 */
export declare const checkRole: (...roles: string[]) => RBACMiddleware;
/**
 * Middleware factory to check if user possesses ALL required permissions.
 * Supports wildcard matching such as `resource:*` or `*:*`.
 * @param permissions Permissions required to access the route.
 */
export declare const checkPermission: (...permissions: string[]) => RBACMiddleware;
//# sourceMappingURL=rbac.d.ts.map