import { Repository } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { Subscription, SubscriptionStatus, SubscriptionTier } from '../entities/Subscription';
import { Logger } from '@hockey-hub/shared-lib/utils/logger';

export class CachedSubscriptionRepository {
  private repository: Repository<Subscription>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'subscription:';
  private readonly CACHE_TTL = 300; // 5 minutes for critical subscription data

  constructor() {
    this.repository = AppDataSource.getRepository(Subscription);
    this.logger = new Logger('CachedSubscriptionRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async findById(id: string): Promise<Subscription | null> {
    const cacheKey = this.getCacheKey(`id:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for subscription ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const subscription = await this.repository.findOne({
      where: { id },
      relations: ['invoices']
    });

    if (subscription && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(subscription));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return subscription;
  }

  async findByOrganization(organizationId: string): Promise<Subscription | null> {
    const cacheKey = this.getCacheKey(`org:${organizationId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization ${organizationId} subscription`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const subscription = await this.repository.findOne({
      where: { 
        organizationId,
        status: SubscriptionStatus.ACTIVE
      },
      order: { createdAt: 'DESC' }
    });

    if (subscription && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(subscription));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return subscription;
  }

  async findActiveSubscriptions(): Promise<Subscription[]> {
    const cacheKey = this.getCacheKey('active:all');

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for active subscriptions');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const subscriptions = await this.repository.find({
      where: { 
        status: SubscriptionStatus.ACTIVE
      },
      order: { currentPeriodEnd: 'ASC' }
    });

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 60, JSON.stringify(subscriptions)); // 1 minute
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return subscriptions;
  }

  async findExpiringSubscriptions(days: number = 7): Promise<Subscription[]> {
    const cacheKey = this.getCacheKey(`expiring:${days}days`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for expiring subscriptions');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const subscriptions = await this.repository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('subscription.currentPeriodEnd <= :futureDate', { futureDate })
      .andWhere('subscription.currentPeriodEnd >= :now', { now: new Date() })
      .orderBy('subscription.currentPeriodEnd', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(subscriptions)); // 1 hour
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return subscriptions;
  }

  async getOrganizationFeatures(organizationId: string): Promise<any> {
    const cacheKey = this.getCacheKey(`features:${organizationId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization ${organizationId} features`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const subscription = await this.findByOrganization(organizationId);
    const features = subscription?.features || this.getDefaultFeatures();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(features)); // 10 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return features;
  }

  async create(subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const subscription = await this.repository.save(subscriptionData);
    await this.invalidateCache(subscription);
    return subscription;
  }

  async update(id: string, subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
    await this.repository.update(id, subscriptionData);
    const subscription = await this.findById(id);
    if (subscription) {
      await this.invalidateCache(subscription);
    }
    return subscription;
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription | null> {
    const updateData: any = { status };
    
    if (status === SubscriptionStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    } else if (status === SubscriptionStatus.EXPIRED) {
      updateData.endedAt = new Date();
    }

    await this.repository.update(id, updateData);
    const subscription = await this.findById(id);
    if (subscription) {
      await this.invalidateCache(subscription);
    }
    return subscription;
  }

  private async invalidateCache(subscription: Subscription): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`id:${subscription.id}`),
        this.getCacheKey(`org:${subscription.organizationId}`),
        this.getCacheKey(`features:${subscription.organizationId}`),
        this.getCacheKey('active:all'),
        this.getCacheKey('expiring:7days'),
        this.getCacheKey('expiring:30days'),
        this.getCacheKey(`analytics:${subscription.organizationId}`)
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for subscription ${subscription.id}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }

  private getDefaultFeatures() {
    return {
      maxUsers: 10,
      maxTeams: 1,
      maxPlayers: 25,
      hasAdvancedAnalytics: false,
      hasVideoAnalysis: false,
      hasMedicalTracking: false,
      hasCustomReports: false,
      supportLevel: 'basic',
      dataRetentionDays: 90
    };
  }

  async getSubscriptionAnalytics(organizationId: string): Promise<{
    currentTier: SubscriptionTier | null;
    daysUntilRenewal: number | null;
    usagePercentage: {
      users: number;
      teams: number;
      players: number;
    };
    monthlyRevenue: number;
    isInTrial: boolean;
  }> {
    const cacheKey = this.getCacheKey(`analytics:${organizationId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for subscription analytics`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const subscription = await this.findByOrganization(organizationId);
    
    // TODO: Get actual usage from User Service
    const mockUsage = {
      users: 15,
      teams: 3,
      players: 45
    };

    const analytics = {
      currentTier: subscription?.tier || null,
      daysUntilRenewal: subscription?.daysUntilRenewal() || null,
      usagePercentage: {
        users: subscription ? (mockUsage.users / subscription.features.maxUsers) * 100 : 0,
        teams: subscription ? (mockUsage.teams / subscription.features.maxTeams) * 100 : 0,
        players: subscription ? (mockUsage.players / subscription.features.maxPlayers) * 100 : 0
      },
      monthlyRevenue: subscription?.price || 0,
      isInTrial: subscription?.isInTrial() || false
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(analytics)); // 5 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return analytics;
  }
}