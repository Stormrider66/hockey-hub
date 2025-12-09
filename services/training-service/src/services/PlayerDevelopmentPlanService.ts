import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { AppDataSource } from '../config/database';
import { 
  PlayerDevelopmentPlan,
  DevelopmentPlanStatus,
  DevelopmentGoal,
  WeeklyPlan,
  Milestone,
  ParentCommunication,
  ExternalResource
} from '../entities/PlayerDevelopmentPlan';

export interface CreateDevelopmentPlanDto {
  playerId: string;
  coachId: string;
  teamId: string;
  planName: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  currentLevel: any;
  targetLevel: any;
  goals: DevelopmentGoal[];
  weeklyPlans: WeeklyPlan[];
  milestones: Milestone[];
  parentCommunications?: ParentCommunication[];
  resources?: ExternalResource[];
}

export interface UpdateDevelopmentPlanDto {
  planName?: string;
  description?: string;
  endDate?: Date;
  status?: DevelopmentPlanStatus;
  currentLevel?: any;
  targetLevel?: any;
  goals?: DevelopmentGoal[];
  weeklyPlans?: WeeklyPlan[];
  milestones?: Milestone[];
  parentCommunications?: ParentCommunication[];
  resources?: ExternalResource[];
  progressNotes?: string[];
}

class PlayerDevelopmentPlanRepository extends CachedRepository<PlayerDevelopmentPlan> {
  constructor() {
    super(AppDataSource.getRepository(PlayerDevelopmentPlan), 'development-plan', 3600); // 1 hour cache
  }

  async findByPlayer(playerId: string): Promise<PlayerDevelopmentPlan[]> {
    return this.cacheQueryResult(
      `development-plan:player:${playerId}`,
      async () => {
        return this.repository
          .createQueryBuilder('dp')
          .where('dp.playerId = :playerId', { playerId })
          .orderBy('dp.startDate', 'DESC')
          .getMany();
      },
      3600,
      [`player:${playerId}`]
    );
  }

  async findActiveByCoach(coachId: string): Promise<PlayerDevelopmentPlan[]> {
    return this.cacheQueryResult(
      `development-plan:coach:${coachId}:active`,
      async () => {
        return this.repository
          .createQueryBuilder('dp')
          .where('dp.coachId = :coachId', { coachId })
          .andWhere('dp.status IN (:...statuses)', { 
            statuses: ['active', 'in_progress'] 
          })
          .orderBy('dp.startDate', 'DESC')
          .getMany();
      },
      1800,
      [`coach:${coachId}`]
    );
  }
}

export class PlayerDevelopmentPlanService {
  private repository: PlayerDevelopmentPlanRepository;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.repository = new PlayerDevelopmentPlanRepository();
    this.logger = new Logger('PlayerDevelopmentPlanService');
    this.eventBus = EventBus.getInstance();
  }

  async createDevelopmentPlan(data: CreateDevelopmentPlanDto): Promise<PlayerDevelopmentPlan> {
    this.logger.info('Creating development plan', { 
      playerId: data.playerId, 
      planName: data.planName 
    });

    try {
      const plan = await this.repository.save({
        ...data,
        status: 'active' as DevelopmentPlanStatus,
        progressNotes: [],
        lastUpdated: new Date()
      } as any);

      await this.eventBus.publish('development-plan.created', {
        planId: plan.id,
        playerId: data.playerId,
        coachId: data.coachId,
        teamId: data.teamId
      });

      return plan;
    } catch (error) {
      this.logger.error('Error creating development plan', { error: error.message, data });
      throw error;
    }
  }

  async updateDevelopmentPlan(id: string, data: UpdateDevelopmentPlanDto): Promise<PlayerDevelopmentPlan> {
    const existing = await this.repository.findOne({ where: { id } as any });
    if (!existing) {
      throw new Error('Development plan not found');
    }

    Object.assign(existing, { ...data, lastUpdated: new Date() });
    const updated = await this.repository.save(existing);

    await this.repository.invalidateByTags([
      `player:${existing.playerId}`,
      `coach:${existing.coachId}`
    ]);

    await this.eventBus.publish('development-plan.updated', {
      planId: id,
      playerId: existing.playerId,
      changes: Object.keys(data)
    });

    return updated;
  }

  async getDevelopmentPlansByPlayer(playerId: string): Promise<PlayerDevelopmentPlan[]> {
    return this.repository.findByPlayer(playerId);
  }

  async getActivePlansByCoach(coachId: string): Promise<PlayerDevelopmentPlan[]> {
    return this.repository.findActiveByCoach(coachId);
  }

  async updateMilestone(
    planId: string,
    milestoneId: string,
    updates: { status?: any; completedDate?: Date; notes?: string }
  ): Promise<PlayerDevelopmentPlan> {
    const plan = await this.repository.findOne({ where: { id: planId } as any });
    if (!plan) {
      throw new Error('Development plan not found');
    }

    const milestone = plan.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }

    Object.assign(milestone, updates);
    return this.repository.save(plan);
  }

  async addProgressNote(planId: string, note: string): Promise<PlayerDevelopmentPlan> {
    const plan = await this.repository.findOne({ where: { id: planId } as any });
    if (!plan) {
      throw new Error('Development plan not found');
    }

    plan.progressNotes.push(`${new Date().toISOString()}: ${note}`);
    return this.repository.save(plan);
  }

  async getPlayerProgress(playerId: string): Promise<{
    activePlans: number;
    completedGoals: number;
    totalGoals: number;
    upcomingMilestones: Milestone[];
    recentProgress: string[];
  }> {
    const plans = await this.repository.findByPlayer(playerId);
    const activePlans = plans.filter(p => p.status === 'active').length;
    
    const allGoals = plans.flatMap(p => p.goals);
    const completedGoals = allGoals.filter(g => g.status === 'completed').length;
    
    const upcomingMilestones = plans
      .flatMap(p => p.milestones)
      .filter(m => m.status === 'pending' && new Date(m.targetDate) > new Date())
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 5);

    const recentProgress = plans
      .flatMap(p => p.progressNotes)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 10);

    return {
      activePlans,
      completedGoals,
      totalGoals: allGoals.length,
      upcomingMilestones,
      recentProgress
    };
  }
}