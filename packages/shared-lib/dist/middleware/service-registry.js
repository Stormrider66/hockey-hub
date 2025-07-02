"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateServiceRequest = exports.getServiceApiKey = exports.serviceRegistry = exports.ServiceRegistry = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.apiKeyToServiceId = new Map();
        // Initialize with default services
        this.initializeDefaultServices();
    }
    /**
     * Register a new service
     */
    registerService(registration) {
        const serviceId = this.generateServiceId(registration.name);
        const apiKey = this.generateApiKey();
        const serviceInfo = {
            id: serviceId,
            name: registration.name,
            apiKey,
            permissions: registration.permissions,
            endpoints: registration.endpoints,
            createdAt: new Date(),
            isActive: true
        };
        this.services.set(serviceId, serviceInfo);
        this.apiKeyToServiceId.set(apiKey, serviceId);
        return serviceInfo;
    }
    /**
     * Get service by API key
     */
    getServiceByApiKey(apiKey) {
        const serviceId = this.apiKeyToServiceId.get(apiKey);
        if (!serviceId)
            return null;
        const service = this.services.get(serviceId);
        if (!service || !service.isActive)
            return null;
        // Update last accessed time
        service.lastAccessedAt = new Date();
        return service;
    }
    /**
     * Get service by ID
     */
    getServiceById(serviceId) {
        const service = this.services.get(serviceId);
        return service && service.isActive ? service : null;
    }
    /**
     * Validate service API key
     */
    validateApiKey(apiKey) {
        const service = this.getServiceByApiKey(apiKey);
        return !!service;
    }
    /**
     * Check if service has permission
     */
    hasPermission(apiKey, permission) {
        const service = this.getServiceByApiKey(apiKey);
        if (!service)
            return false;
        return service.permissions.includes(permission) ||
            service.permissions.includes('*'); // Wildcard permission
    }
    /**
     * Revoke service API key
     */
    revokeApiKey(apiKey) {
        const serviceId = this.apiKeyToServiceId.get(apiKey);
        if (!serviceId)
            return false;
        const service = this.services.get(serviceId);
        if (!service)
            return false;
        service.isActive = false;
        this.apiKeyToServiceId.delete(apiKey);
        return true;
    }
    /**
     * Rotate API key for a service
     */
    rotateApiKey(serviceId) {
        const service = this.services.get(serviceId);
        if (!service || !service.isActive)
            return null;
        // Remove old API key mapping
        this.apiKeyToServiceId.delete(service.apiKey);
        // Generate new API key
        const newApiKey = this.generateApiKey();
        service.apiKey = newApiKey;
        this.apiKeyToServiceId.set(newApiKey, serviceId);
        return newApiKey;
    }
    /**
     * List all active services
     */
    listServices() {
        return Array.from(this.services.values())
            .filter(service => service.isActive);
    }
    /**
     * Generate a unique service ID
     */
    generateServiceId(serviceName) {
        return `svc_${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    }
    /**
     * Generate a secure API key
     */
    generateApiKey() {
        const prefix = 'hh_'; // Hockey Hub prefix
        const randomBytes = crypto_1.default.randomBytes(32).toString('base64url');
        return `${prefix}${randomBytes}`;
    }
    /**
     * Initialize default services
     */
    initializeDefaultServices() {
        const defaultServices = [
            {
                name: 'api-gateway',
                permissions: ['*'], // Full access
                endpoints: ['*']
            },
            {
                name: 'user-service',
                permissions: ['users.*', 'auth.*', 'organizations.*', 'teams.*'],
                endpoints: ['/api/v1/users', '/api/v1/auth', '/api/v1/organizations', '/api/v1/teams']
            },
            {
                name: 'calendar-service',
                permissions: ['calendar.*', 'events.*', 'resources.*'],
                endpoints: ['/api/v1/calendar', '/api/v1/events', '/api/v1/resources']
            },
            {
                name: 'training-service',
                permissions: ['training.*', 'workouts.*', 'exercises.*'],
                endpoints: ['/api/v1/training', '/api/v1/workouts']
            },
            {
                name: 'medical-service',
                permissions: ['medical.*', 'injuries.*', 'treatments.*'],
                endpoints: ['/api/v1/medical']
            },
            {
                name: 'communication-service',
                permissions: ['messages.*', 'notifications.*'],
                endpoints: ['/api/v1/messages', '/api/v1/notifications']
            },
            {
                name: 'planning-service',
                permissions: ['planning.*', 'schedules.*'],
                endpoints: ['/api/v1/planning']
            },
            {
                name: 'statistics-service',
                permissions: ['statistics.*', 'analytics.*', 'reports.*'],
                endpoints: ['/api/v1/stats']
            },
            {
                name: 'payment-service',
                permissions: ['payments.*', 'invoices.*', 'subscriptions.*'],
                endpoints: ['/api/v1/payments']
            },
            {
                name: 'admin-service',
                permissions: ['admin.*', 'system.*', 'audit.*'],
                endpoints: ['/api/v1/admin']
            }
        ];
        // Register each service
        defaultServices.forEach(service => {
            const registered = this.registerService(service);
            // SECURITY: Never log API keys to console
            // console.log(`Service '${service.name}' registered with API key: ${registered.apiKey}`);
        });
    }
}
exports.ServiceRegistry = ServiceRegistry;
// Singleton instance
exports.serviceRegistry = new ServiceRegistry();
// Environment-based service configuration
function getServiceApiKey(serviceName) {
    const envKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_API_KEY`;
    return process.env[envKey] || '';
}
exports.getServiceApiKey = getServiceApiKey;
function validateServiceRequest(apiKey, serviceName, requiredPermission) {
    const service = exports.serviceRegistry.getServiceByApiKey(apiKey);
    if (!service) {
        return { valid: false, error: 'Invalid API key' };
    }
    if (service.name !== serviceName) {
        return { valid: false, error: 'API key does not match service name' };
    }
    if (requiredPermission && !exports.serviceRegistry.hasPermission(apiKey, requiredPermission)) {
        return { valid: false, error: 'Insufficient permissions' };
    }
    return { valid: true, service };
}
exports.validateServiceRequest = validateServiceRequest;
