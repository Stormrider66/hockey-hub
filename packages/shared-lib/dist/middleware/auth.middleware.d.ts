import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                roles: string[];
                permissions: string[];
                organizationId?: string;
                teamIds: string[];
                lang: string;
            };
            service?: {
                serviceId: string;
                serviceName: string;
                permissions: string[];
            };
        }
    }
}
export interface AuthConfig {
    jwksUri?: string;
    issuer?: string;
    audience?: string;
    serviceApiKey?: string;
    serviceName?: string;
}
export declare class SharedAuthMiddleware {
    private remoteJWKS;
    private config;
    constructor(config?: AuthConfig);
    /**
     * Extract user information from API Gateway headers
     */
    extractUser(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Verify JWT token directly (for services that receive tokens)
     */
    verifyToken(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Verify service-to-service authentication
     */
    verifyServiceAuth(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require authentication (user or service)
     */
    requireAuth(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require specific permission
     */
    requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require any of the specified permissions
     */
    requireAnyPermission(permissions: string[]): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require specific role
     */
    requireRole(role: string): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Require organization context
     */
    requireOrganization(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Add auth headers for service-to-service calls
     */
    static addServiceHeaders(headers: Record<string, string>, serviceName: string): Record<string, string>;
    /**
     * Forward user context headers
     */
    static forwardUserContext(req: Request): Record<string, string>;
}
export declare function createAuthMiddleware(config?: AuthConfig): SharedAuthMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map