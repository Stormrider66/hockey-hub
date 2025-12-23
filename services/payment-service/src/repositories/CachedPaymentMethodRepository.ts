// @ts-nocheck
import { Repository, Not } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { PaymentMethod, PaymentMethodType } from '../entities/PaymentMethod';
import { Logger } from '@hockey-hub/shared-lib/utils/logger';

export class CachedPaymentMethodRepository {
  private repository: Repository<PaymentMethod>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'payment_method:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor() {
    this.repository = AppDataSource.getRepository(PaymentMethod);
    this.logger = new Logger('CachedPaymentMethodRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const cacheKey = this.getCacheKey(`id:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for payment method ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const paymentMethod = await this.repository.findOne({
      where: { id, isActive: true }
    });

    if (paymentMethod && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(paymentMethod));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return paymentMethod;
  }

  async findByUser(userId: string): Promise<PaymentMethod[]> {
    const cacheKey = this.getCacheKey(`user:${userId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for user ${userId} payment methods`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const paymentMethods = await this.repository.find({
      where: { userId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(paymentMethods));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return paymentMethods;
  }

  async findByOrganization(organizationId: string): Promise<PaymentMethod[]> {
    const cacheKey = this.getCacheKey(`org:${organizationId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization ${organizationId} payment methods`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const paymentMethods = await this.repository.find({
      where: { organizationId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(paymentMethods));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return paymentMethods;
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    const cacheKey = this.getCacheKey(`default:${userId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for default payment method`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const paymentMethod = await this.repository.findOne({
      where: { userId, isActive: true, isDefault: true }
    });

    if (paymentMethod && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(paymentMethod));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return paymentMethod;
  }

  async create(paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    // If this is the first payment method or marked as default, update others
    if (paymentMethodData.isDefault) {
      await this.repository.update(
        { 
          userId: paymentMethodData.userId, 
          isDefault: true 
        },
        { isDefault: false }
      );
    }

    const paymentMethod = await this.repository.save(paymentMethodData);
    await this.invalidateCache(paymentMethod);
    return paymentMethod;
  }

  async update(id: string, paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    // Handle default payment method update
    if (paymentMethodData.isDefault) {
      const existingMethod = await this.repository.findOne({ where: { id } });
      if (existingMethod) {
        await this.repository.update(
          { 
            userId: existingMethod.userId, 
            isDefault: true,
            id: Not(id)
          },
          { isDefault: false }
        );
      }
    }

    await this.repository.update(id, paymentMethodData);
    const paymentMethod = await this.findById(id);
    if (paymentMethod) {
      await this.invalidateCache(paymentMethod);
    }
    return paymentMethod;
  }

  async deactivate(id: string): Promise<boolean> {
    const paymentMethod = await this.repository.findOne({ where: { id } });
    if (!paymentMethod) return false;

    await this.repository.update(id, { isActive: false });
    await this.invalidateCache(paymentMethod);
    return true;
  }

  async getExpiringCards(days: number = 30): Promise<PaymentMethod[]> {
    const cacheKey = this.getCacheKey(`expiring:${days}days`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for expiring cards');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureYear = futureDate.getFullYear();
    const futureMonth = futureDate.getMonth() + 1;

    const expiringCards = await this.repository
      .createQueryBuilder('pm')
      .where('pm.type = :type', { type: PaymentMethodType.CARD })
      .andWhere('pm.isActive = :isActive', { isActive: true })
      .andWhere('((pm.expYear = :currentYear AND pm.expMonth >= :currentMonth) OR (pm.expYear = :futureYear AND pm.expMonth <= :futureMonth))', {
        currentYear,
        currentMonth,
        futureYear,
        futureMonth
      })
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(expiringCards)); // 1 hour
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return expiringCards;
  }

  private async invalidateCache(paymentMethod: PaymentMethod): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`id:${paymentMethod.id}`),
        this.getCacheKey(`user:${paymentMethod.userId}`),
        this.getCacheKey(`org:${paymentMethod.organizationId}`),
        this.getCacheKey(`default:${paymentMethod.userId}`),
        this.getCacheKey('expiring:30days'),
        this.getCacheKey('expiring:60days')
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for payment method ${paymentMethod.id}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }
}