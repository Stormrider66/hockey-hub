import { Router } from 'express';
/**
 * Authentication routes handler
 * Defines validation for authentication operations using Zod schemas
 *
 * TODO: This implementation uses Zod for validation instead of express-validator
 * to avoid TypeScript type conflicts with express-validator. A more permanent fix
 * would be to address the ts-node version conflict (needs ^10.7.0 for typeorm, but
 * other dependencies require ^9.1.1).
 */
declare const router: Router;
export default router;
//# sourceMappingURL=auth.routes.d.ts.map