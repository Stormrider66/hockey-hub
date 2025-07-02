"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = exports.SharedAuthMiddleware = void 0;
const jose_1 = require("jose");
class SharedAuthMiddleware {
    constructor(config = {}) {
        this.config = {
            jwksUri: config.jwksUri || process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json',
            issuer: config.issuer || process.env.JWT_ISSUER || 'user-service',
            audience: config.audience || process.env.JWT_AUDIENCE || 'hockeyhub-internal',
            serviceApiKey: config.serviceApiKey || process.env.SERVICE_API_KEY || '',
            serviceName: config.serviceName || process.env.SERVICE_NAME || 'unknown-service'
        };
        // Initialize JWKS
        this.remoteJWKS = (0, jose_1.createRemoteJWKSet)(new URL(this.config.jwksUri));
    }
    /**
     * Extract user information from API Gateway headers
     */
    extractUser() {
        return (req, res, next) => {
            const userId = req.headers['x-user-id'];
            const email = req.headers['x-user-email'];
            const rolesHeader = req.headers['x-user-roles'];
            const permissionsHeader = req.headers['x-user-permissions'];
            const organizationId = req.headers['x-organization-id'];
            const teamIdsHeader = req.headers['x-team-ids'];
            if (userId && email) {
                req.user = {
                    userId,
                    email,
                    roles: rolesHeader ? JSON.parse(rolesHeader) : [],
                    permissions: permissionsHeader ? JSON.parse(permissionsHeader) : [],
                    organizationId,
                    teamIds: teamIdsHeader ? JSON.parse(teamIdsHeader) : [],
                    lang: 'en'
                };
            }
            next();
        };
    }
    /**
     * Verify JWT token directly (for services that receive tokens)
     */
    verifyToken() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.startsWith('Bearer ')
                    ? authHeader.split(' ')[1]
                    : null;
                if (!token) {
                    res.status(401).json({ error: 'No token provided' });
                    return;
                }
                const { payload } = await (0, jose_1.jwtVerify)(token, this.remoteJWKS, {
                    issuer: this.config.issuer,
                    audience: this.config.audience,
                });
                req.user = {
                    userId: payload.userId,
                    email: payload.email,
                    roles: payload.roles || [],
                    permissions: payload.permissions || [],
                    organizationId: payload.organizationId,
                    teamIds: payload.teamIds || [],
                    lang: payload.lang || 'en'
                };
                next();
            }
            catch (error) {
                console.error('JWT verification failed:', error);
                res.status(401).json({ error: 'Invalid token' });
            }
        };
    }
    /**
     * Verify service-to-service authentication
     */
    verifyServiceAuth() {
        return (req, res, next) => {
            const serviceKey = req.headers['x-service-api-key'];
            const serviceName = req.headers['x-service-name'];
            if (!serviceKey || serviceKey !== this.config.serviceApiKey) {
                res.status(401).json({ error: 'Invalid service credentials' });
                return;
            }
            req.service = {
                serviceId: serviceName || 'unknown',
                serviceName: serviceName || 'unknown',
                permissions: ['service:internal'] // Grant internal service permissions
            };
            next();
        };
    }
    /**
     * Require authentication (user or service)
     */
    requireAuth() {
        return (req, res, next) => {
            if (!req.user && !req.service) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            next();
        };
    }
    /**
     * Require specific permission
     */
    requirePermission(permission) {
        return (req, res, next) => {
            if (!req.user && !req.service) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            // Service accounts have all permissions
            if (req.service) {
                return next();
            }
            if (!req.user.permissions.includes(permission)) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }
            next();
        };
    }
    /**
     * Require any of the specified permissions
     */
    requireAnyPermission(permissions) {
        return (req, res, next) => {
            if (!req.user && !req.service) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            // Service accounts have all permissions
            if (req.service) {
                return next();
            }
            const hasPermission = permissions.some(permission => req.user.permissions.includes(permission));
            if (!hasPermission) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }
            next();
        };
    }
    /**
     * Require specific role
     */
    requireRole(role) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            if (!req.user.roles.includes(role)) {
                res.status(403).json({ error: 'Insufficient role' });
                return;
            }
            next();
        };
    }
    /**
     * Require organization context
     */
    requireOrganization() {
        return (req, res, next) => {
            if (!req.user || !req.user.organizationId) {
                res.status(403).json({ error: 'Organization context required' });
                return;
            }
            next();
        };
    }
    /**
     * Add auth headers for service-to-service calls
     */
    static addServiceHeaders(headers, serviceName) {
        return {
            ...headers,
            'X-Service-API-Key': process.env.SERVICE_API_KEY || '',
            'X-Service-Name': serviceName,
            'X-Request-Id': headers['X-Request-Id'] || generateRequestId(),
            'X-Correlation-Id': headers['X-Correlation-Id'] || generateRequestId()
        };
    }
    /**
     * Forward user context headers
     */
    static forwardUserContext(req) {
        const headers = {};
        if (req.user) {
            headers['X-User-Id'] = req.user.userId;
            headers['X-User-Email'] = req.user.email;
            headers['X-User-Roles'] = JSON.stringify(req.user.roles);
            headers['X-User-Permissions'] = JSON.stringify(req.user.permissions);
            if (req.user.organizationId) {
                headers['X-Organization-Id'] = req.user.organizationId;
            }
            if (req.user.teamIds && req.user.teamIds.length > 0) {
                headers['X-Team-Ids'] = JSON.stringify(req.user.teamIds);
            }
        }
        // Forward correlation ID
        if (req.headers['x-correlation-id']) {
            headers['X-Correlation-Id'] = req.headers['x-correlation-id'];
        }
        return headers;
    }
}
exports.SharedAuthMiddleware = SharedAuthMiddleware;
// Helper function to generate request IDs
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
// Export convenience middleware factory functions
function createAuthMiddleware(config) {
    return new SharedAuthMiddleware(config);
}
exports.createAuthMiddleware = createAuthMiddleware;
