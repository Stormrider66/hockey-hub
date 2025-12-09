import { Repository, Between } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { SystemMetrics, MetricType, MetricPeriod } from '../entities/SystemMetrics';
import { Logger } from '@hockey-hub/shared-lib/utils/Logger';

export class CachedMetricsRepository {
  private repository: Repository<SystemMetrics>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'metrics:';
  private readonly CACHE_TTL = 120; // 2 minutes for metrics

  constructor() {
    this.repository = AppDataSource.getRepository(SystemMetrics);
    this.logger = new Logger('CachedMetricsRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async getLatestMetric(type: MetricType, period: MetricPeriod, organizationId?: string): Promise<SystemMetrics | null> {
    const cacheKey = this.getCacheKey(`latest:${type}:${period}:${organizationId || 'system'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for latest ${type} metric`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('metric')
      .where('metric.type = :type', { type })
      .andWhere('metric.period = :period', { period });

    if (organizationId) {
      query.andWhere('metric.organizationId = :organizationId', { organizationId });
    } else {
      query.andWhere('metric.organizationId IS NULL');
    }

    const metric = await query
      .orderBy('metric.timestamp', 'DESC')
      .getOne();

    if (metric && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(metric));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return metric;
  }

  async getMetricHistory(
    type: MetricType, 
    period: MetricPeriod, 
    startDate: Date, 
    endDate: Date,
    organizationId?: string
  ): Promise<SystemMetrics[]> {
    const cacheKey = this.getCacheKey(
      `history:${type}:${period}:${organizationId || 'system'}:${startDate.getTime()}:${endDate.getTime()}`
    );

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${type} history`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('metric')
      .where('metric.type = :type', { type })
      .andWhere('metric.period = :period', { period })
      .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (organizationId) {
      query.andWhere('metric.organizationId = :organizationId', { organizationId });
    } else {
      query.andWhere('metric.organizationId IS NULL');
    }

    const metrics = await query
      .orderBy('metric.timestamp', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        const ttl = period === MetricPeriod.HOURLY ? 300 : 600; // 5-10 minutes based on period
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(metrics));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return metrics;
  }

  async getDashboardMetrics(organizationId?: string): Promise<{
    users: SystemMetrics | null;
    organizations: SystemMetrics | null;
    revenue: SystemMetrics | null;
    apiCalls: SystemMetrics | null;
    storage: SystemMetrics | null;
    performance: SystemMetrics | null;
  }> {
    const cacheKey = this.getCacheKey(`dashboard:${organizationId || 'system'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for dashboard metrics');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const [users, organizations, revenue, apiCalls, storage, performance] = await Promise.all([
      this.getLatestMetric(MetricType.USERS, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(MetricType.ORGANIZATIONS, MetricPeriod.DAILY),
      this.getLatestMetric(MetricType.REVENUE, MetricPeriod.MONTHLY, organizationId),
      this.getLatestMetric(MetricType.API_CALLS, MetricPeriod.HOURLY, organizationId),
      this.getLatestMetric(MetricType.STORAGE, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(MetricType.PERFORMANCE, MetricPeriod.HOURLY)
    ]);

    const result = {
      users,
      organizations,
      revenue,
      apiCalls,
      storage,
      performance
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

  async getGrowthMetrics(type: MetricType, organizationId?: string): Promise<{
    daily: number;
    weekly: number;
    monthly: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const cacheKey = this.getCacheKey(`growth:${type}:${organizationId || 'system'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${type} growth metrics`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const [daily, weekly, monthly] = await Promise.all([
      this.getLatestMetric(type, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(type, MetricPeriod.WEEKLY, organizationId),
      this.getLatestMetric(type, MetricPeriod.MONTHLY, organizationId)
    ]);

    const dailyGrowth = daily?.getGrowthRate() || 0;
    const weeklyGrowth = weekly?.getGrowthRate() || 0;
    const monthlyGrowth = monthly?.getGrowthRate() || 0;

    // Determine trend based on recent growth
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (monthlyGrowth > 5) trend = 'up';
    else if (monthlyGrowth < -5) trend = 'down';

    const result = {
      daily: dailyGrowth,
      weekly: weeklyGrowth,
      monthly: monthlyGrowth,
      trend
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(result)); // 5 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return result;
  }

  async getAnomalies(): Promise<SystemMetrics[]> {
    const cacheKey = this.getCacheKey('anomalies:recent');

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for anomalies');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentMetrics = await this.repository.find({
      where: {
        timestamp: Between(twentyFourHoursAgo, new Date())
      },
      order: { timestamp: 'DESC' }
    });

    const anomalies = recentMetrics.filter(metric => metric.isAnomaly());

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(anomalies)); // 5 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return anomalies;
  }

  async recordMetric(metricData: Partial<SystemMetrics>): Promise<SystemMetrics> {
    // Calculate change percentage if previous value exists
    if (metricData.type && metricData.period && metricData.value) {
      const previous = await this.getLatestMetric(
        metricData.type, 
        metricData.period, 
        metricData.organizationId
      );

      if (previous) {
        metricData.previousValue = previous.value;
        const current = BigInt(metricData.value);
        const prev = BigInt(previous.value);
        if (prev > 0n) {
          metricData.changePercentage = Number(((current - prev) * 100n) / prev);
        }
      }
    }

    const metric = await this.repository.save({
      ...metricData,
      timestamp: new Date(),
      periodEnd: new Date() // Should be calculated based on period
    });

    await this.invalidateMetricsCache(metric);
    return metric;
  }

  async getOrganizationSummary(organizationId: string): Promise<{
    users: { total: number; active: number; growth: number };
    teams: { total: number; active: number };
    storage: { used: string; limit: string; percentage: number };
    activity: { sessions: number; apiCalls: number };
  }> {
    const cacheKey = this.getCacheKey(`summary:${organizationId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization summary`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const [userMetric, teamMetric, storageMetric, sessionMetric, apiMetric] = await Promise.all([
      this.getLatestMetric(MetricType.USERS, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(MetricType.TEAMS, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(MetricType.STORAGE, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(MetricType.SESSIONS, MetricPeriod.DAILY, organizationId),
      this.getLatestMetric(MetricType.API_CALLS, MetricPeriod.DAILY, organizationId)
    ]);

    const result = {
      users: {
        total: Number(userMetric?.value || '0'),
        active: userMetric?.breakdown.activeUsers || 0,
        growth: userMetric?.changePercentage || 0
      },
      teams: {
        total: Number(teamMetric?.value || '0'),
        active: teamMetric?.breakdown.activeTeams || 0
      },
      storage: {
        used: storageMetric?.breakdown.totalStorageBytes || '0',
        limit: '10737418240', // 10GB default
        percentage: 0
      },
      activity: {
        sessions: Number(sessionMetric?.value || '0'),
        apiCalls: Number(apiMetric?.value || '0')
      }
    };

    // Calculate storage percentage
    if (result.storage.used && result.storage.limit) {
      const used = BigInt(result.storage.used);
      const limit = BigInt(result.storage.limit);
      result.storage.percentage = Number((used * 100n) / limit);
    }

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 180, JSON.stringify(result)); // 3 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return result;
  }

  private async invalidateMetricsCache(metric: SystemMetrics): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const orgId = metric.organizationId || 'system';
      const keys = [
        this.getCacheKey(`latest:${metric.type}:${metric.period}:${orgId}`),
        this.getCacheKey(`dashboard:${orgId}`),
        this.getCacheKey(`growth:${metric.type}:${orgId}`),
        this.getCacheKey('anomalies:recent')
      ];

      if (metric.organizationId) {
        keys.push(this.getCacheKey(`summary:${metric.organizationId}`));
      }

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for ${metric.type} metrics`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }
}