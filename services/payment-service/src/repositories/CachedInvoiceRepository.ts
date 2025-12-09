import { Repository } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { Invoice, InvoiceStatus } from '../entities/Invoice';
import { Logger } from '@hockey-hub/shared-lib/utils/logger';

export class CachedInvoiceRepository {
  private repository: Repository<Invoice>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'invoice:';
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor() {
    this.repository = AppDataSource.getRepository(Invoice);
    this.logger = new Logger('CachedInvoiceRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  async findById(id: string): Promise<Invoice | null> {
    const cacheKey = this.getCacheKey(`id:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for invoice ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const invoice = await this.repository.findOne({
      where: { id },
      relations: ['subscription', 'payments']
    });

    if (invoice && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(invoice));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return invoice;
  }

  async findByOrganization(organizationId: string, status?: InvoiceStatus): Promise<Invoice[]> {
    const cacheKey = this.getCacheKey(`org:${organizationId}:status:${status || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for organization ${organizationId} invoices`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.subscription', 'subscription')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.organizationId = :organizationId', { organizationId })
      .orderBy('invoice.issueDate', 'DESC');

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    const invoices = await query.getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(invoices));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return invoices;
  }

  async findByUser(userId: string, status?: InvoiceStatus): Promise<Invoice[]> {
    const cacheKey = this.getCacheKey(`user:${userId}:status:${status || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for user ${userId} invoices`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.userId = :userId', { userId })
      .orderBy('invoice.issueDate', 'DESC');

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    const invoices = await query.getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(invoices));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return invoices;
  }

  async findOverdueInvoices(organizationId?: string): Promise<Invoice[]> {
    const cacheKey = this.getCacheKey(`overdue:${organizationId || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for overdue invoices`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.repository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.subscription', 'subscription')
      .where('invoice.status IN (:...statuses)', { 
        statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] 
      })
      .andWhere('invoice.dueDate < :now', { now: new Date() });

    if (organizationId) {
      query.andWhere('invoice.organizationId = :organizationId', { organizationId });
    }

    const invoices = await query
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(invoices)); // 5 minutes for overdue
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return invoices;
  }

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = await this.repository.save(invoiceData);
    await this.invalidateCache(invoice);
    return invoice;
  }

  async update(id: string, invoiceData: Partial<Invoice>): Promise<Invoice | null> {
    await this.repository.update(id, invoiceData);
    const invoice = await this.findById(id);
    if (invoice) {
      await this.invalidateCache(invoice);
    }
    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus, paidAmount?: number): Promise<Invoice | null> {
    const updateData: any = { status };
    
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }
    
    if (status === InvoiceStatus.PAID) {
      updateData.paidDate = new Date();
    }

    await this.repository.update(id, updateData);
    const invoice = await this.findById(id);
    if (invoice) {
      await this.invalidateCache(invoice);
    }
    return invoice;
  }

  private async invalidateCache(invoice: Invoice): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`id:${invoice.id}`),
        this.getCacheKey(`org:${invoice.organizationId}:status:all`),
        this.getCacheKey(`org:${invoice.organizationId}:status:${invoice.status}`),
        this.getCacheKey(`user:${invoice.userId}:status:all`),
        this.getCacheKey(`user:${invoice.userId}:status:${invoice.status}`),
        this.getCacheKey(`overdue:all`),
        this.getCacheKey(`overdue:${invoice.organizationId}`)
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for invoice ${invoice.id}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }

  async getDashboardSummary(organizationId: string): Promise<{
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    recentInvoices: Invoice[];
  }> {
    const cacheKey = this.getCacheKey(`dashboard:${organizationId}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for dashboard summary`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const [totalRevenue, pendingAmount, overdueAmount, recentInvoices] = await Promise.all([
      // Total revenue
      this.repository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.paidAmount)', 'total')
        .where('invoice.organizationId = :organizationId', { organizationId })
        .andWhere('invoice.status IN (:...statuses)', { 
          statuses: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] 
        })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),

      // Pending amount
      this.repository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.totalAmount - invoice.paidAmount)', 'total')
        .where('invoice.organizationId = :organizationId', { organizationId })
        .andWhere('invoice.status IN (:...statuses)', { 
          statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] 
        })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),

      // Overdue amount
      this.repository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.totalAmount - invoice.paidAmount)', 'total')
        .where('invoice.organizationId = :organizationId', { organizationId })
        .andWhere('invoice.status IN (:...statuses)', { 
          statuses: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] 
        })
        .andWhere('invoice.dueDate < :now', { now: new Date() })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),

      // Recent invoices
      this.findByOrganization(organizationId).then(invoices => invoices.slice(0, 5))
    ]);

    const summary = {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      recentInvoices
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(summary)); // 5 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return summary;
  }
}