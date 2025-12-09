import { Repository } from 'typeorm';
import { AppDataSource, redisClient, isRedisConnected } from '../config/database';
import { TrainingPlan, PlanStatus } from '../entities/TrainingPlan';
import { PracticePlan, PracticeStatus } from '../entities/PracticePlan';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';

export class CachedPlanRepository {
  private trainingPlanRepo: Repository<TrainingPlan>;
  private practicePlanRepo: Repository<PracticePlan>;
  private logger: Logger;
  private readonly CACHE_PREFIX = 'plan:';
  private readonly CACHE_TTL = 3600; // 1 hour for active plans

  constructor() {
    this.trainingPlanRepo = AppDataSource.getRepository(TrainingPlan);
    this.practicePlanRepo = AppDataSource.getRepository(PracticePlan);
    this.logger = new Logger('CachedPlanRepository');
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  // Training Plan methods
  async findTrainingPlanById(id: string): Promise<TrainingPlan | null> {
    const cacheKey = this.getCacheKey(`training:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for training plan ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const plan = await this.trainingPlanRepo.findOne({
      where: { id: id as any },
      relations: ['practices']
    });

    if (plan && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(plan));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return plan;
  }

  async findActiveTrainingPlans(teamId: string): Promise<TrainingPlan[]> {
    const cacheKey = this.getCacheKey(`training:team:${teamId}:active`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for active training plans`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const now = new Date();
    const plans = await this.trainingPlanRepo
      .createQueryBuilder('plan')
      .where('plan.teamId = :teamId', { teamId })
      .andWhere('plan.status = :status', { status: PlanStatus.ACTIVE })
      .andWhere('plan.startDate <= :now', { now })
      .andWhere('plan.endDate >= :now', { now })
      .orderBy('plan.startDate', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(plans)); // 30 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return plans;
  }

  async findTrainingPlansByCoach(coachId: string, status?: PlanStatus): Promise<TrainingPlan[]> {
    const cacheKey = this.getCacheKey(`training:coach:${coachId}:status:${status || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for coach ${coachId} training plans`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = this.trainingPlanRepo
      .createQueryBuilder('plan')
      .where('plan.coachId = :coachId', { coachId })
      .orderBy('plan.startDate', 'DESC');

    if (status) {
      query.andWhere('plan.status = :status', { status });
    }

    const plans = await query.getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(plans));
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return plans;
  }

  // Practice Plan methods
  async findPracticePlanById(id: string): Promise<PracticePlan | null> {
    const cacheKey = this.getCacheKey(`practice:${id}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for practice plan ${id}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const practice = await this.practicePlanRepo.findOne({
      where: { id: id as any },
      relations: ['drills', 'trainingPlan']
    });

    if (practice && isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(practice)); // 30 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return practice;
  }

  async findUpcomingPractices(teamId: string, days: number = 7): Promise<PracticePlan[]> {
    const cacheKey = this.getCacheKey(`practice:team:${teamId}:upcoming:${days}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for upcoming practices`);
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const practices = await this.practicePlanRepo
      .createQueryBuilder('practice')
      .leftJoinAndSelect('practice.drills', 'drills')
      .where('practice.teamId = :teamId', { teamId })
      .andWhere('practice.date >= :now', { now })
      .andWhere('practice.date <= :futureDate', { futureDate })
      .andWhere('practice.status != :cancelled', { cancelled: PracticeStatus.CANCELLED })
      .orderBy('practice.date', 'ASC')
      .getMany();

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 900, JSON.stringify(practices)); // 15 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return practices;
  }

  async getDashboardData(organizationId: string, teamId?: string) {
    const cacheKey = this.getCacheKey(`dashboard:${organizationId}:team:${teamId || 'all'}`);

    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          this.logger.debug('Cache hit for dashboard data');
          return JSON.parse(cached);
        }
      } catch (error) {
        this.logger.error('Redis get error:', error);
      }
    }

    const query = teamId ? { teamId } : { organizationId };
    
    const [activePlans, upcomingPractices, completedPractices] = await Promise.all([
      // Active training plans
      this.trainingPlanRepo.count({
        where: {
          ...query,
          status: PlanStatus.ACTIVE
        }
      }),

      // Upcoming practices (next 7 days)
      this.practicePlanRepo
        .createQueryBuilder('practice')
        .where(teamId ? 'practice.teamId = :teamId' : 'practice.organizationId = :organizationId', query)
        .andWhere('practice.date >= :now', { now: new Date() })
        .andWhere('practice.date <= :week', { 
          week: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        })
        .andWhere('practice.status = :status', { status: PracticeStatus.PLANNED })
        .getCount(),

      // Recently completed practices
      this.practicePlanRepo
        .createQueryBuilder('practice')
        .where(teamId ? 'practice.teamId = :teamId' : 'practice.organizationId = :organizationId', query)
        .andWhere('practice.status = :status', { status: PracticeStatus.COMPLETED })
        .andWhere('practice.date >= :month', { 
          month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        })
        .getCount()
    ]);

    // Get practice completion rate
    const totalPractices = await this.practicePlanRepo
      .createQueryBuilder('practice')
      .where(teamId ? 'practice.teamId = :teamId' : 'practice.organizationId = :organizationId', query)
      .andWhere('practice.date < :now', { now: new Date() })
      .andWhere('practice.date >= :month', { 
        month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      })
      .getCount();

    const completionRate = totalPractices > 0 
      ? (completedPractices / totalPractices) * 100 
      : 0;

    const data = {
      activePlans,
      upcomingPractices,
      completedPractices,
      completionRate,
      lastUpdated: new Date()
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(data)); // 5 minutes
      } catch (error) {
        this.logger.error('Redis set error:', error);
      }
    }

    return data;
  }

  async createTrainingPlan(planData: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const plan = await this.trainingPlanRepo.save(planData);
    await this.invalidateTrainingPlanCache(plan);
    return plan;
  }

  async updateTrainingPlan(id: string, planData: Partial<TrainingPlan>): Promise<TrainingPlan | null> {
    await this.trainingPlanRepo.update({ id } as any, planData as any);
    const plan = await this.findTrainingPlanById(id);
    if (plan) {
      await this.invalidateTrainingPlanCache(plan);
    }
    return plan;
  }

  async createPracticePlan(practiceData: Partial<PracticePlan>): Promise<PracticePlan> {
    const practice = await this.practicePlanRepo.save(practiceData);
    await this.invalidatePracticePlanCache(practice);
    return practice;
  }

  async updatePracticePlan(id: string, practiceData: Partial<PracticePlan>): Promise<PracticePlan | null> {
    await this.practicePlanRepo.update({ id } as any, practiceData as any);
    const practice = await this.findPracticePlanById(id);
    if (practice) {
      await this.invalidatePracticePlanCache(practice);
    }
    return practice;
  }

  private async invalidateTrainingPlanCache(plan: TrainingPlan): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`training:${(plan as any).id}`),
        this.getCacheKey(`training:team:${plan.teamId}:active`),
        this.getCacheKey(`training:coach:${plan.coachId}:status:all`),
        this.getCacheKey(`training:coach:${plan.coachId}:status:${plan.status}`),
        this.getCacheKey(`dashboard:${plan.organizationId}:team:all`),
        this.getCacheKey(`dashboard:${plan.organizationId}:team:${plan.teamId}`)
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for training plan ${(plan as any).id}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }

  private async invalidatePracticePlanCache(practice: PracticePlan): Promise<void> {
    if (!isRedisConnected) return;

    try {
      const keys = [
        this.getCacheKey(`practice:${(practice as any).id}`),
        this.getCacheKey(`practice:team:${practice.teamId}:upcoming:7`),
        this.getCacheKey(`practice:team:${practice.teamId}:upcoming:14`),
        this.getCacheKey(`practice:team:${practice.teamId}:upcoming:30`),
        this.getCacheKey(`dashboard:${practice.organizationId}:team:all`),
        this.getCacheKey(`dashboard:${practice.organizationId}:team:${practice.teamId}`)
      ];

      await Promise.all(keys.map(key => redisClient.del(key)));
      this.logger.debug(`Cache invalidated for practice plan ${(practice as any).id}`);
    } catch (error) {
      this.logger.error('Redis invalidation error:', error);
    }
  }
}