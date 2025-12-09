import { Repository, Between, LessThan } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { ServiceHealth, ServiceStatus, ServiceName } from '../entities/ServiceHealth';
import { Logger } from '@hockey-hub/shared-lib/utils/Logger';

export class CachedHealthRepository {
  private repository: Repository<ServiceHealth>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'health:';
  private readonly CACHE_TTL = 30; // 30 seconds for health data

  constructor() {
    this.repository = AppDataSource.getRepository(ServiceHealth);
    this.logger = new Logger('CachedHealthRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async getLatestHealth(serviceName: ServiceName): Promise<ServiceHealth | null> {
    const cacheKey = this.getCacheKey(`latest:${serviceName}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${serviceName} health`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const health = await this.repository.findOne({
      where: { serviceName },
      order: { timestamp: 'DESC' }
    });

    if (health && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(health));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return health;
  }

  async getAllServicesHealth(): Promise<Record<ServiceName, ServiceHealth | null>> {
    const cacheKey = this.getCacheKey('all:latest');

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for all services health');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const services = Object.values(ServiceName);
    const healthPromises = services.map(service => this.getLatestHealth(service));
    const healthResults = await Promise.all(healthPromises);

    const result: Record<ServiceName, ServiceHealth | null> = {} as any;
    services.forEach((service, index) => {
      result[service] = healthResults[index];
    });

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return result;
  }

  async getHealthHistory(serviceName: ServiceName, hours: number = 24): Promise<ServiceHealth[]> {
    const cacheKey = this.getCacheKey(`history:${serviceName}:${hours}h`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${serviceName} history`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const history = await this.repository.find({
      where: {
        serviceName,
        timestamp: Between(startTime, new Date())
      },
      order: { timestamp: 'ASC' }
    });

    if (isRedisConnected) {
      try {
        const ttl = hours < 2 ? 60 : 300; // 1 minute for short periods, 5 minutes for longer
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(history));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return history;
  }

  async getUnhealthyServices(): Promise<ServiceHealth[]> {
    const cacheKey = this.getCacheKey('unhealthy:all');

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for unhealthy services');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    // Get latest health for each service
    const allHealth = await this.getAllServicesHealth();
    const unhealthy = Object.values(allHealth)
      .filter(health => 
        health && 
        (health.status === ServiceStatus.UNHEALTHY || 
         health.status === ServiceStatus.DEGRADED ||
         health.status === ServiceStatus.OFFLINE)
      ) as ServiceHealth[];

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(unhealthy));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return unhealthy;
  }

  async getHealthMetrics(serviceName?: ServiceName): Promise<{
    avgResponseTime: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgErrorRate: number;
    uptime: number;
    totalRequests: number;
  }> {
    const cacheKey = this.getCacheKey(`metrics:${serviceName || 'all'}:24h`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for health metrics');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const query = this.repository
      .createQueryBuilder('health')
      .where('health.timestamp >= :startTime', { startTime: twentyFourHoursAgo });

    if (serviceName) {
      query.andWhere('health.serviceName = :serviceName', { serviceName });
    }

    const records = await query.getMany();

    if (records.length === 0) {
      const emptyMetrics = {
        avgResponseTime: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgErrorRate: 0,
        uptime: 0,
        totalRequests: 0
      };
      return emptyMetrics;
    }

    const metrics = {
      avgResponseTime: records.reduce((sum, r) => sum + r.responseTime, 0) / records.length,
      avgCpuUsage: records.reduce((sum, r) => sum + r.cpuUsage, 0) / records.length,
      avgMemoryUsage: records.reduce((sum, r) => sum + r.memoryUsage, 0) / records.length,
      avgErrorRate: records.reduce((sum, r) => sum + r.errorRate, 0) / records.length,
      uptime: records.filter(r => r.status === ServiceStatus.HEALTHY).length / records.length * 100,
      totalRequests: records.reduce((sum, r) => sum + r.requestsPerMinute, 0)
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(metrics)); // 5 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return metrics;
  }

  async recordHealth(healthData: Partial<ServiceHealth>): Promise<ServiceHealth> {
    const health = await this.repository.save({
      ...healthData,
      timestamp: new Date()
    });

    // Invalidate relevant caches
    await this.invalidateHealthCache(health.serviceName);

    return health;
  }

  async getSystemHealthScore(): Promise<{
    overall: number;
    byService: Record<ServiceName, number>;
    criticalIssues: string[];
    warnings: string[];
  }> {
    const cacheKey = this.getCacheKey('score:system');

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for system health score');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const allHealth = await this.getAllServicesHealth();
    const byService: Record<ServiceName, number> = {} as any;
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    let totalScore = 0;
    let serviceCount = 0;

    Object.entries(allHealth).forEach(([serviceName, health]) => {
      if (!health) {
        byService[serviceName as ServiceName] = 0;
        criticalIssues.push(`${serviceName} is not reporting health data`);
        return;
      }

      const score = health.getHealthScore();
      byService[serviceName as ServiceName] = score;
      totalScore += score;
      serviceCount++;

      if (health.status === ServiceStatus.OFFLINE) {
        criticalIssues.push(`${serviceName} is offline`);
      } else if (health.status === ServiceStatus.UNHEALTHY) {
        criticalIssues.push(`${serviceName} is unhealthy`);
      } else if (health.status === ServiceStatus.DEGRADED) {
        warnings.push(`${serviceName} is degraded`);
      }

      if (health.errorRate > 5) {
        criticalIssues.push(`${serviceName} has high error rate: ${health.errorRate.toFixed(1)}%`);
      } else if (health.errorRate > 2) {
        warnings.push(`${serviceName} error rate: ${health.errorRate.toFixed(1)}%`);
      }

      if (health.cpuUsage > 80) {
        warnings.push(`${serviceName} high CPU usage: ${health.cpuUsage.toFixed(1)}%`);
      }

      if (health.memoryUsage > 85) {
        warnings.push(`${serviceName} high memory usage: ${health.memoryUsage.toFixed(1)}%`);
      }
    });

    const result = {
      overall: serviceCount > 0 ? totalScore / serviceCount : 0,
      byService,
      criticalIssues,
      warnings
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 60, JSON.stringify(result)); // 1 minute
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return result;
  }

  private async invalidateHealthCache(serviceName: ServiceName): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`latest:${serviceName}`),
        this.getCacheKey('all:latest'),
        this.getCacheKey('unhealthy:all'),
        this.getCacheKey('score:system'),
        this.getCacheKey(`metrics:${serviceName}:24h`),
        this.getCacheKey('metrics:all:24h')
      ];

      // Also invalidate history caches
      const historyKeys = await redisClient.keys(this.getCacheKey(`history:${serviceName}:*`));
      keys.push(...historyKeys);

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for ${serviceName} health`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }

  async cleanupOldHealth(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.repository.delete({
      timestamp: LessThan(cutoffDate)
    });

    this.logger.info(`Cleaned up ${result.affected} old health records`);
    return result.affected || 0;
  }
}