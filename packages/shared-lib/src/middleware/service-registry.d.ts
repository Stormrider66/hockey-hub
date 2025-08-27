export interface ServiceInfo {
    id: string;
    name: string;
    apiKey: string;
    permissions: string[];
    endpoints: string[];
    createdAt: Date;
    lastAccessedAt?: Date;
    isActive: boolean;
}
export interface ServiceRegistration {
    name: string;
    permissions: string[];
    endpoints: string[];
}
export declare class ServiceRegistry {
    private services;
    private apiKeyToServiceId;
    constructor();
    /**
     * Register a new service
     */
    registerService(registration: ServiceRegistration): ServiceInfo;
    /**
     * Get service by API key
     */
    getServiceByApiKey(apiKey: string): ServiceInfo | null;
    /**
     * Get service by ID
     */
    getServiceById(serviceId: string): ServiceInfo | null;
    /**
     * Validate service API key
     */
    validateApiKey(apiKey: string): boolean;
    /**
     * Check if service has permission
     */
    hasPermission(apiKey: string, permission: string): boolean;
    /**
     * Revoke service API key
     */
    revokeApiKey(apiKey: string): boolean;
    /**
     * Rotate API key for a service
     */
    rotateApiKey(serviceId: string): string | null;
    /**
     * List all active services
     */
    listServices(): ServiceInfo[];
    /**
     * Generate a unique service ID
     */
    private generateServiceId;
    /**
     * Generate a secure API key
     */
    private generateApiKey;
    /**
     * Initialize default services
     */
    private initializeDefaultServices;
}
export declare const serviceRegistry: ServiceRegistry;
export declare function getServiceApiKey(serviceName: string): string;
export declare function validateServiceRequest(apiKey: string, serviceName: string, requiredPermission?: string): {
    valid: boolean;
    service?: ServiceInfo;
    error?: string;
};
//# sourceMappingURL=service-registry.d.ts.map