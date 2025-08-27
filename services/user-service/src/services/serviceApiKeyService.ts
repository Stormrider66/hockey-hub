import { AppDataSource } from '../config/database';
import { ServiceApiKey } from '../entities/ServiceApiKey';
import crypto from 'crypto';

export interface CreateApiKeyDto {
  serviceName: string;
  description?: string;
  permissions: string[];
  allowedIps?: string[];
  expiresAt?: Date;
  createdBy?: string;
}

export interface ApiKeyValidation {
  valid: boolean;
  service?: ServiceApiKey;
  error?: string;
}

export class ServiceApiKeyService {
  private apiKeyRepo = AppDataSource.getRepository(ServiceApiKey);

  /**
   * Generate a new API key for a service
   */
  async createApiKey(dto: CreateApiKeyDto): Promise<ServiceApiKey> {
    // Check if service already has an active key
    const existing = await this.apiKeyRepo.findOne({
      where: {
        serviceName: dto.serviceName,
        isActive: true
      }
    });

    if (existing) {
      throw new Error(`Service ${dto.serviceName} already has an active API key`);
    }

    // Generate secure API key
    const apiKey = this.generateApiKey(dto.serviceName);

    const serviceApiKey = this.apiKeyRepo.create({
      serviceName: dto.serviceName,
      apiKey,
      description: dto.description,
      permissions: dto.permissions,
      allowedIps: dto.allowedIps || ['*'],
      expiresAt: dto.expiresAt,
      createdBy: dto.createdBy
    });

    return await this.apiKeyRepo.save(serviceApiKey);
  }

  /**
   * Validate an API key
   */
  async validateApiKey(
    apiKey: string, 
    ipAddress?: string
  ): Promise<ApiKeyValidation> {
    const serviceKey = await this.apiKeyRepo.findOne({
      where: {
        apiKey,
        isActive: true
      }
    });

    if (!serviceKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check expiration
    if (serviceKey.expiresAt && serviceKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check IP whitelist
    if (ipAddress && serviceKey.allowedIps.length > 0 && !serviceKey.allowedIps.includes('*')) {
      const ipAllowed = serviceKey.allowedIps.some(allowedIp => {
        if (allowedIp.includes('*')) {
          // Handle wildcard IPs like 192.168.*.*
          const pattern = allowedIp.replace(/\*/g, '.*');
          return new RegExp(pattern).test(ipAddress);
        }
        return allowedIp === ipAddress;
      });

      if (!ipAllowed) {
        return { valid: false, error: 'IP address not allowed' };
      }
    }

    // Update usage stats
    serviceKey.lastUsedAt = new Date();
    serviceKey.usageCount++;
    await this.apiKeyRepo.save(serviceKey);

    return { valid: true, service: serviceKey };
  }

  /**
   * Get API key by service name
   */
  async getApiKeyByService(serviceName: string): Promise<ServiceApiKey | null> {
    return await this.apiKeyRepo.findOne({
      where: {
        serviceName,
        isActive: true
      }
    });
  }

  /**
   * Rotate API key for a service
   */
  async rotateApiKey(
    serviceName: string,
    rotatedBy: string
  ): Promise<ServiceApiKey> {
    // Get current key
    const currentKey = await this.apiKeyRepo.findOne({
      where: {
        serviceName,
        isActive: true
      }
    });

    if (!currentKey) {
      throw new Error(`No active API key found for service ${serviceName}`);
    }

    // Revoke current key
    currentKey.isActive = false;
    currentKey.revokedAt = new Date();
    currentKey.revokedBy = rotatedBy;
    currentKey.revocationReason = 'Key rotation';
    await this.apiKeyRepo.save(currentKey);

    // Create new key
    return await this.createApiKey({
      serviceName,
      description: `Rotated from ${currentKey.id}`,
      permissions: currentKey.permissions,
      allowedIps: currentKey.allowedIps,
      expiresAt: currentKey.expiresAt,
      createdBy: rotatedBy
    });
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(
    apiKey: string,
    revokedBy: string,
    reason: string
  ): Promise<void> {
    const serviceKey = await this.apiKeyRepo.findOne({
      where: { apiKey }
    });

    if (!serviceKey) {
      throw new Error('API key not found');
    }

    serviceKey.isActive = false;
    serviceKey.revokedAt = new Date();
    serviceKey.revokedBy = revokedBy;
    serviceKey.revocationReason = reason;

    await this.apiKeyRepo.save(serviceKey);
  }

  /**
   * List all API keys
   */
  async listApiKeys(includeInactive = false): Promise<ServiceApiKey[]> {
    const where = includeInactive ? {} : { isActive: true };
    
    return await this.apiKeyRepo.find({
      where,
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(serviceName: string): Promise<{
    totalRequests: number;
    lastUsed?: Date;
    isActive: boolean;
    expiresAt?: Date;
  }> {
    const serviceKey = await this.apiKeyRepo.findOne({
      where: { serviceName, isActive: true }
    });

    if (!serviceKey) {
      throw new Error(`No active API key found for service ${serviceName}`);
    }

    return {
      totalRequests: serviceKey.usageCount,
      lastUsed: serviceKey.lastUsedAt,
      isActive: serviceKey.isActive,
      expiresAt: serviceKey.expiresAt
    };
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await this.apiKeyRepo
      .createQueryBuilder()
      .update(ServiceApiKey)
      .set({ 
        isActive: false,
        revocationReason: 'Expired'
      })
      .where('expiresAt < :now', { now: new Date() })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();

    return result.affected || 0;
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(serviceName: string): string {
    const prefix = 'hh'; // Hockey Hub
    const servicePrefix = serviceName.substring(0, 3).toLowerCase();
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(24).toString('base64url');
    
    return `${prefix}_${servicePrefix}_${timestamp}_${randomBytes}`;
  }

  /**
   * Initialize default service API keys
   */
  async initializeDefaultKeys(): Promise<void> {
    const defaultServices = [
      {
        serviceName: 'api-gateway',
        description: 'Main API Gateway service',
        permissions: ['*']
      },
      {
        serviceName: 'calendar-service',
        description: 'Calendar and event management service',
        permissions: ['calendar.*', 'events.*', 'training.read']
      },
      {
        serviceName: 'training-service',
        description: 'Training and workout management service',
        permissions: ['training.*', 'calendar.read', 'users.read']
      },
      {
        serviceName: 'medical-service',
        description: 'Medical records and health tracking service',
        permissions: ['medical.*', 'users.read']
      },
      {
        serviceName: 'communication-service',
        description: 'Messaging and notification service',
        permissions: ['messages.*', 'notifications.*', 'users.read']
      },
      {
        serviceName: 'planning-service',
        description: 'Training planning and scheduling service',
        permissions: ['planning.*', 'training.read', 'calendar.*']
      },
      {
        serviceName: 'statistics-service',
        description: 'Analytics and reporting service',
        permissions: ['statistics.*', '*.read']
      },
      {
        serviceName: 'payment-service',
        description: 'Payment processing service',
        permissions: ['payments.*', 'users.read']
      },
      {
        serviceName: 'admin-service',
        description: 'Administrative service',
        permissions: ['*']
      }
    ];

    for (const service of defaultServices) {
      try {
        const existing = await this.getApiKeyByService(service.serviceName);
        if (!existing) {
          const apiKey = await this.createApiKey({
            ...service,
            allowedIps: ['*'],
            createdBy: 'system'
          });
          console.log(`Created API key for ${service.serviceName}: ${apiKey.apiKey}`);
        }
      } catch (error) {
        console.error(`Failed to create API key for ${service.serviceName}:`, error);
      }
    }
  }
}

export const serviceApiKeyService = new ServiceApiKeyService();