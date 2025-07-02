import crypto from 'crypto';

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

export class ServiceRegistry {
  private services: Map<string, ServiceInfo> = new Map();
  private apiKeyToServiceId: Map<string, string> = new Map();

  constructor() {
    // Initialize with default services
    this.initializeDefaultServices();
  }

  /**
   * Register a new service
   */
  registerService(registration: ServiceRegistration): ServiceInfo {
    const serviceId = this.generateServiceId(registration.name);
    const apiKey = this.generateApiKey();

    const serviceInfo: ServiceInfo = {
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
  getServiceByApiKey(apiKey: string): ServiceInfo | null {
    const serviceId = this.apiKeyToServiceId.get(apiKey);
    if (!serviceId) return null;

    const service = this.services.get(serviceId);
    if (!service || !service.isActive) return null;

    // Update last accessed time
    service.lastAccessedAt = new Date();
    return service;
  }

  /**
   * Get service by ID
   */
  getServiceById(serviceId: string): ServiceInfo | null {
    const service = this.services.get(serviceId);
    return service && service.isActive ? service : null;
  }

  /**
   * Validate service API key
   */
  validateApiKey(apiKey: string): boolean {
    const service = this.getServiceByApiKey(apiKey);
    return !!service;
  }

  /**
   * Check if service has permission
   */
  hasPermission(apiKey: string, permission: string): boolean {
    const service = this.getServiceByApiKey(apiKey);
    if (!service) return false;

    return service.permissions.includes(permission) || 
           service.permissions.includes('*'); // Wildcard permission
  }

  /**
   * Revoke service API key
   */
  revokeApiKey(apiKey: string): boolean {
    const serviceId = this.apiKeyToServiceId.get(apiKey);
    if (!serviceId) return false;

    const service = this.services.get(serviceId);
    if (!service) return false;

    service.isActive = false;
    this.apiKeyToServiceId.delete(apiKey);
    return true;
  }

  /**
   * Rotate API key for a service
   */
  rotateApiKey(serviceId: string): string | null {
    const service = this.services.get(serviceId);
    if (!service || !service.isActive) return null;

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
  listServices(): ServiceInfo[] {
    return Array.from(this.services.values())
      .filter(service => service.isActive);
  }

  /**
   * Generate a unique service ID
   */
  private generateServiceId(serviceName: string): string {
    return `svc_${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const prefix = 'hh_'; // Hockey Hub prefix
    const randomBytes = crypto.randomBytes(32).toString('base64url');
    return `${prefix}${randomBytes}`;
  }

  /**
   * Initialize default services
   */
  private initializeDefaultServices(): void {
    const defaultServices: ServiceRegistration[] = [
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

// Singleton instance
export const serviceRegistry = new ServiceRegistry();

// Environment-based service configuration
export function getServiceApiKey(serviceName: string): string {
  const envKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_API_KEY`;
  return process.env[envKey] || '';
}

export function validateServiceRequest(
  apiKey: string,
  serviceName: string,
  requiredPermission?: string
): { valid: boolean; service?: ServiceInfo; error?: string } {
  const service = serviceRegistry.getServiceByApiKey(apiKey);
  
  if (!service) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (service.name !== serviceName) {
    return { valid: false, error: 'API key does not match service name' };
  }

  if (requiredPermission && !serviceRegistry.hasPermission(apiKey, requiredPermission)) {
    return { valid: false, error: 'Insufficient permissions' };
  }

  return { valid: true, service };
}