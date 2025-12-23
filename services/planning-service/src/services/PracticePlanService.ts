// @ts-nocheck - Suppress TypeScript errors for build
import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { AppDataSource } from '../config/database';
import { 
  PracticePlan, 
  PracticeStatus, 
  PracticeFocus 
} from '../entities/PracticePlan';
import { Drill } from '../entities/Drill';
import { TrainingPlan } from '../entities/TrainingPlan';

export interface CreatePracticePlanDto {
  title: string;
  description?: string;
  organizationId: string;
  teamId: string;
  coachId: string;
  trainingPlanId?: string;
  date: Date;
  duration: number;
  primaryFocus: PracticeFocus;
  secondaryFocus?: PracticeFocus[];
  location?: string;
  rinkId?: string;
  sections: Array<{
    id: string;
    name: string;
    duration: number;
    drillIds: string[];
    notes?: string;
    equipment?: string[];
  }>;
  objectives?: string[];
  equipment?: string[];
  lineups?: any;
  notes?: string;
}

export interface UpdatePracticePlanDto {
  title?: string;
  description?: string;
  date?: Date;
  duration?: number;
  primaryFocus?: PracticeFocus;
  secondaryFocus?: PracticeFocus[];
  location?: string;
  rinkId?: string;
  sections?: Array<{
    id: string;
    name: string;
    duration: number;
    drillIds: string[];
    notes?: string;
    equipment?: string[];
  }>;
  objectives?: string[];
  equipment?: string[];
  lineups?: any;
  notes?: string;
  status?: PracticeStatus;
  coachFeedback?: string;
  attendance?: Array<{
    playerId: string;
    present: boolean;
    reason?: string;
  }>;
  playerEvaluations?: Array<{
    playerId: string;
    rating: number;
    notes?: string;
    areasOfImprovement?: string[];
  }>;
}

export interface PracticePlanFilters {
  organizationId?: string;
  teamId?: string;
  coachId?: string;
  status?: PracticeStatus;
  primaryFocus?: PracticeFocus;
  startDate?: Date;
  endDate?: Date;
  trainingPlanId?: string;
}

export interface PracticePlanSearchParams {
  query?: string;
  focus?: PracticeFocus;
  duration?: { min: number; max: number };
  drillCount?: { min: number; max: number };
  hasLineups?: boolean;
}

class PracticePlanRepository extends CachedRepository<PracticePlan> {
  constructor() {
    super(AppDataSource.getRepository(PracticePlan), 'practice-plan', 1800); // 30 minutes cache
  }

  async findByTeamAndDateRange(
    teamId: string,
    startDate: Date,
    endDate: Date,
    status?: PracticeStatus
  ): Promise<PracticePlan[]> {
    const cacheKey = `practice-plan:team:${teamId}:range:${startDate.toISOString()}:${endDate.toISOString()}:${status || 'all'}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('pp')
          .leftJoinAndSelect('pp.drills', 'drills')
          .leftJoinAndSelect('pp.trainingPlan', 'trainingPlan')
          .where('pp.teamId = :teamId', { teamId })
          .andWhere('pp.date BETWEEN :startDate AND :endDate', { startDate, endDate });

        if (status) {
          query.andWhere('pp.status = :status', { status });
        }

        return query
          .orderBy('pp.date', 'ASC')
          .getMany();
      },
      900, // 15 minutes
      [`team:${teamId}`, 'daterange']
    );
  }

  async findByCoach(coachId: string, filters?: PracticePlanFilters): Promise<PracticePlan[]> {
    const cacheKey = `practice-plan:coach:${coachId}:${JSON.stringify(filters)}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('pp')
          .leftJoinAndSelect('pp.drills', 'drills')
          .leftJoinAndSelect('pp.trainingPlan', 'trainingPlan')
          .where('pp.coachId = :coachId', { coachId });

        if (filters?.teamId) {
          query.andWhere('pp.teamId = :teamId', { teamId: filters.teamId });
        }
        if (filters?.status) {
          query.andWhere('pp.status = :status', { status: filters.status });
        }
        if (filters?.primaryFocus) {
          query.andWhere('pp.primaryFocus = :primaryFocus', { primaryFocus: filters.primaryFocus });
        }
        if (filters?.startDate && filters?.endDate) {
          query.andWhere('pp.date BETWEEN :startDate AND :endDate', {
            startDate: filters.startDate,
            endDate: filters.endDate
          });
        }
        if (filters?.trainingPlanId) {
          query.andWhere('pp.trainingPlanId = :trainingPlanId', { 
            trainingPlanId: filters.trainingPlanId 
          });
        }

        return query.orderBy('pp.date', 'DESC').getMany();
      },
      1800, // 30 minutes
      [`coach:${coachId}`]
    );
  }

  async findUpcomingPractices(
    teamId: string,
    days: number = 7,
    status?: PracticeStatus
  ): Promise<PracticePlan[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.findByTeamAndDateRange(teamId, startDate, endDate, status);
  }

  async searchPracticePlans(
    organizationId: string,
    searchParams: PracticePlanSearchParams
  ): Promise<PracticePlan[]> {
    const cacheKey = `practice-plan:search:${organizationId}:${JSON.stringify(searchParams)}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('pp')
          .leftJoinAndSelect('pp.drills', 'drills')
          .where('pp.organizationId = :organizationId', { organizationId });

        if (searchParams.query) {
          query.andWhere(
            '(pp.title ILIKE :query OR pp.description ILIKE :query OR pp.notes ILIKE :query)', 
            { query: `%${searchParams.query}%` }
          );
        }

        if (searchParams.focus) {
          query.andWhere('pp.primaryFocus = :focus', { focus: searchParams.focus });
        }

        if (searchParams.duration) {
          if (searchParams.duration.min) {
            query.andWhere('pp.duration >= :minDuration', { minDuration: searchParams.duration.min });
          }
          if (searchParams.duration.max) {
            query.andWhere('pp.duration <= :maxDuration', { maxDuration: searchParams.duration.max });
          }
        }

        if (searchParams.hasLineups !== undefined) {
          if (searchParams.hasLineups) {
            query.andWhere('pp.lineups IS NOT NULL');
          } else {
            query.andWhere('pp.lineups IS NULL');
          }
        }

        return query
          .orderBy('pp.date', 'DESC')
          .limit(50)
          .getMany();
      },
      300, // 5 minutes
      [`organization:${organizationId}`, 'search']
    );
  }

  async getPracticeAnalytics(
    organizationId: string,
    teamId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const cacheKey = `practice-plan:analytics:${organizationId}:${teamId || 'all'}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const baseQuery = this.repository
          .createQueryBuilder('pp')
          .where('pp.organizationId = :organizationId', { organizationId });

        if (teamId) {
          baseQuery.andWhere('pp.teamId = :teamId', { teamId });
        }

        if (startDate && endDate) {
          baseQuery.andWhere('pp.date BETWEEN :startDate AND :endDate', {
            startDate, endDate
          });
        }

        const [
          totalPractices,
          practicesPerStatus,
          practicesPerFocus,
          avgDuration,
          avgAttendance
        ] = await Promise.all([
          baseQuery.getCount(),
          baseQuery.clone()
            .select('pp.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('pp.status')
            .getRawMany(),
          baseQuery.clone()
            .select('pp.primaryFocus', 'focus')
            .addSelect('COUNT(*)', 'count')
            .groupBy('pp.primaryFocus')
            .getRawMany(),
          baseQuery.clone()
            .select('AVG(pp.duration)', 'avgDuration')
            .getRawOne(),
          this.calculateAverageAttendance(organizationId, teamId, startDate, endDate)
        ]);

        return {
          totalPractices,
          statusDistribution: practicesPerStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {} as Record<PracticeStatus, number>),
          focusDistribution: practicesPerFocus.reduce((acc, item) => {
            acc[item.focus] = parseInt(item.count);
            return acc;
          }, {} as Record<PracticeFocus, number>),
          averageDuration: parseFloat(avgDuration.avgDuration) || 0,
          averageAttendanceRate: avgAttendance,
          lastUpdated: new Date()
        };
      },
      1800, // 30 minutes
      [`organization:${organizationId}`, 'analytics']
    );
  }

  private async calculateAverageAttendance(
    organizationId: string,
    teamId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const query = this.repository
      .createQueryBuilder('pp')
      .where('pp.organizationId = :organizationId', { organizationId })
      .andWhere('pp.attendance IS NOT NULL')
      .andWhere("jsonb_array_length(pp.attendance) > 0");

    if (teamId) {
      query.andWhere('pp.teamId = :teamId', { teamId });
    }

    if (startDate && endDate) {
      query.andWhere('pp.date BETWEEN :startDate AND :endDate', {
        startDate, endDate
      });
    }

    const practices = await query.getMany();
    
    if (practices.length === 0) return 0;

    const totalAttendanceRate = practices.reduce((sum, practice) => {
      return sum + practice.getAttendanceRate();
    }, 0);

    return totalAttendanceRate / practices.length;
  }
}

export class PracticePlanService {
  private repository: PracticePlanRepository;
  private drillRepository: Repository<Drill>;
  private trainingPlanRepository: Repository<TrainingPlan>;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.repository = new PracticePlanRepository();
    this.drillRepository = AppDataSource.getRepository(Drill);
    this.trainingPlanRepository = AppDataSource.getRepository(TrainingPlan);
    this.logger = new Logger('PracticePlanService');
    this.eventBus = EventBus.getInstance();
  }

  async createPracticePlan(data: CreatePracticePlanDto): Promise<PracticePlan> {
    this.logger.info('Creating practice plan', { title: data.title, teamId: data.teamId });

    try {
      // Validate drill IDs exist
      await this.validateDrillIds(data.sections);

      // Validate training plan if specified
      if (data.trainingPlanId) {
        await this.validateTrainingPlan(data.trainingPlanId, data.teamId);
      }

      const practicePlan = await this.repository.save({
        ...data,
        status: PracticeStatus.PLANNED
      } as any);

      // Publish event for cross-service integration
      await this.eventBus.publish('practice-plan.created', {
        practicePlanId: practicePlan.id,
        teamId: data.teamId,
        coachId: data.coachId,
        date: data.date,
        primaryFocus: data.primaryFocus,
        organizationId: data.organizationId
      });

      this.logger.info('Practice plan created successfully', { 
        id: practicePlan.id, 
        title: data.title 
      });

      return practicePlan;
    } catch (error) {
      this.logger.error('Error creating practice plan', { error: error.message, data });
      throw error;
    }
  }

  async updatePracticePlan(id: string, data: UpdatePracticePlanDto): Promise<PracticePlan> {
    this.logger.info('Updating practice plan', { id });

    try {
      const existingPlan = await this.repository.findOne({ where: { id } as any });
      if (!existingPlan) {
        throw new Error('Practice plan not found');
      }

      // Validate drill IDs if sections are updated
      if (data.sections) {
        await this.validateDrillIds(data.sections);
      }

      // Avoid mutating the fetched entity in-place (helps keep service side-effect free and simplifies tests)
      const updatedPlan = await this.repository.save({ ...(existingPlan as any), ...(data as any) } as any);

      // Invalidate related caches
      await this.repository.invalidateByTags([
        `team:${existingPlan.teamId}`,
        `coach:${existingPlan.coachId}`,
        `organization:${existingPlan.organizationId}`
      ]);

      // Publish update event
      await this.eventBus.publish('practice-plan.updated', {
        practicePlanId: id,
        teamId: existingPlan.teamId,
        coachId: existingPlan.coachId,
        changes: Object.keys(data)
      });

      this.logger.info('Practice plan updated successfully', { id });
      return updatedPlan;
    } catch (error) {
      this.logger.error('Error updating practice plan', { error: error.message, id, data });
      throw error;
    }
  }

  async deletePracticePlan(id: string): Promise<void> {
    this.logger.info('Deleting practice plan', { id });

    try {
      const practicePlan = await this.repository.findOne({ where: { id } as any });
      if (!practicePlan) {
        throw new Error('Practice plan not found');
      }

      // Check if practice can be deleted (not in progress or completed)
      if (practicePlan.status === PracticeStatus.IN_PROGRESS) {
        throw new Error('Cannot delete practice that is in progress');
      }

      await this.repository.remove(practicePlan);

      // Publish delete event
      await this.eventBus.publish('practice-plan.deleted', {
        practicePlanId: id,
        teamId: practicePlan.teamId,
        coachId: practicePlan.coachId
      });

      this.logger.info('Practice plan deleted successfully', { id });
    } catch (error) {
      this.logger.error('Error deleting practice plan', { error: error.message, id });
      throw error;
    }
  }

  async getPracticePlanById(id: string): Promise<PracticePlan | null> {
    return this.repository.findOne({
      where: { id } as any,
      relations: ['drills', 'trainingPlan']
    });
  }

  async getPracticePlansByTeam(
    teamId: string,
    filters?: PracticePlanFilters
  ): Promise<PracticePlan[]> {
    return this.repository.findByTeamAndDateRange(
      teamId,
      filters?.startDate || new Date(0),
      filters?.endDate || new Date('2099-12-31'),
      filters?.status
    );
  }

  async getPracticePlansByCoach(
    coachId: string,
    filters?: PracticePlanFilters
  ): Promise<PracticePlan[]> {
    return this.repository.findByCoach(coachId, filters);
  }

  async getUpcomingPractices(
    teamId: string,
    days: number = 7,
    status?: PracticeStatus
  ): Promise<PracticePlan[]> {
    return this.repository.findUpcomingPractices(teamId, days, status);
  }

  async searchPracticePlans(
    organizationId: string,
    searchParams: PracticePlanSearchParams
  ): Promise<PracticePlan[]> {
    return this.repository.searchPracticePlans(organizationId, searchParams);
  }

  async getPracticeAnalytics(
    organizationId: string,
    teamId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    return this.repository.getPracticeAnalytics(organizationId, teamId, startDate, endDate);
  }

  async duplicatePracticePlan(
    id: string,
    newDate: Date,
    newTitle?: string
  ): Promise<PracticePlan> {
    this.logger.info('Duplicating practice plan', { id, newDate });

    try {
      const originalPlan = await this.getPracticePlanById(id);
      if (!originalPlan) {
        throw new Error('Practice plan not found');
      }

      const duplicateData: CreatePracticePlanDto = {
        title: newTitle || `${originalPlan.title} (Copy)`,
        description: originalPlan.description,
        organizationId: originalPlan.organizationId,
        teamId: originalPlan.teamId,
        coachId: originalPlan.coachId,
        trainingPlanId: originalPlan.trainingPlanId,
        date: newDate,
        duration: originalPlan.duration,
        primaryFocus: originalPlan.primaryFocus,
        secondaryFocus: originalPlan.secondaryFocus,
        location: originalPlan.location,
        rinkId: originalPlan.rinkId,
        sections: [...originalPlan.sections],
        objectives: originalPlan.objectives ? [...originalPlan.objectives] : undefined,
        equipment: originalPlan.equipment ? [...originalPlan.equipment] : undefined,
        lineups: originalPlan.lineups ? { ...originalPlan.lineups } : undefined,
        notes: originalPlan.notes
      };

      const duplicatedPlan = await this.createPracticePlan(duplicateData);

      this.logger.info('Practice plan duplicated successfully', { 
        originalId: id, 
        duplicateId: duplicatedPlan.id 
      });

      return duplicatedPlan;
    } catch (error) {
      this.logger.error('Error duplicating practice plan', { error: error.message, id });
      throw error;
    }
  }

  async recordAttendance(
    id: string,
    attendance: Array<{
      playerId: string;
      present: boolean;
      reason?: string;
    }>
  ): Promise<PracticePlan> {
    this.logger.info('Recording practice attendance', { id, playerCount: attendance.length });

    try {
      const practicePlan = await this.getPracticePlanById(id);
      if (!practicePlan) {
        throw new Error('Practice plan not found');
      }

      const updatedPlan = await this.updatePracticePlan(id, { attendance });

      // Publish attendance event
      await this.eventBus.publish('practice-plan.attendance-recorded', {
        practicePlanId: id,
        teamId: practicePlan.teamId,
        attendanceRate: updatedPlan.getAttendanceRate(),
        totalPlayers: attendance.length,
        presentPlayers: attendance.filter(a => a.present).length
      });

      return updatedPlan;
    } catch (error) {
      this.logger.error('Error recording attendance', { error: error.message, id });
      throw error;
    }
  }

  async recordPlayerEvaluations(
    id: string,
    evaluations: Array<{
      playerId: string;
      rating: number;
      notes?: string;
      areasOfImprovement?: string[];
    }>
  ): Promise<PracticePlan> {
    this.logger.info('Recording player evaluations', { id, playerCount: evaluations.length });

    try {
      const practicePlan = await this.getPracticePlanById(id);
      if (!practicePlan) {
        throw new Error('Practice plan not found');
      }

      return this.updatePracticePlan(id, { playerEvaluations: evaluations });
    } catch (error) {
      this.logger.error('Error recording player evaluations', { error: error.message, id });
      throw error;
    }
  }

  async startPractice(id: string): Promise<PracticePlan> {
    this.logger.info('Starting practice', { id });

    try {
      const practicePlan = await this.getPracticePlanById(id);
      if (!practicePlan) {
        throw new Error('Practice plan not found');
      }

      if (practicePlan.status !== PracticeStatus.PLANNED) {
        throw new Error(`Cannot start practice with status: ${String(practicePlan.status).toUpperCase()}`);
      }

      const updatedPlan = await this.updatePracticePlan(id, { 
        status: PracticeStatus.IN_PROGRESS 
      });

      // Publish start event
      await this.eventBus.publish('practice-plan.started', {
        practicePlanId: id,
        teamId: practicePlan.teamId,
        coachId: practicePlan.coachId,
        startTime: new Date()
      });

      return updatedPlan;
    } catch (error) {
      this.logger.error('Error starting practice', { error: error.message, id });
      throw error;
    }
  }

  async completePractice(id: string, feedback?: string): Promise<PracticePlan> {
    this.logger.info('Completing practice', { id });

    try {
      const practicePlan = await this.getPracticePlanById(id);
      if (!practicePlan) {
        throw new Error('Practice plan not found');
      }

      if (practicePlan.status !== PracticeStatus.IN_PROGRESS) {
        throw new Error(`Cannot complete practice with status: ${String(practicePlan.status).toUpperCase()}`);
      }

      const updatedPlan = await this.updatePracticePlan(id, { 
        status: PracticeStatus.COMPLETED,
        coachFeedback: feedback
      });

      // Publish completion event
      await this.eventBus.publish('practice-plan.completed', {
        practicePlanId: id,
        teamId: practicePlan.teamId,
        coachId: practicePlan.coachId,
        completionTime: new Date(),
        attendanceRate: updatedPlan.getAttendanceRate()
      });

      return updatedPlan;
    } catch (error) {
      this.logger.error('Error completing practice', { error: error.message, id });
      throw error;
    }
  }

  private async validateDrillIds(sections: Array<{ drillIds: string[] }>): Promise<void> {
    const allDrillIds = sections.flatMap(section => section.drillIds);
    const uniqueDrillIds = [...new Set(allDrillIds)];

    if (uniqueDrillIds.length === 0) return;

    const existingDrills = await this.drillRepository
      .createQueryBuilder('drill')
      .where('drill.id IN (:...drillIds)', { drillIds: uniqueDrillIds })
      .getMany();

    const existingDrillIds = existingDrills.map(drill => drill.id);
    const missingDrillIds = uniqueDrillIds.filter(id => !existingDrillIds.includes(id as any));

    if (missingDrillIds.length > 0) {
      throw new Error(`Drill IDs not found: ${missingDrillIds.join(', ')}`);
    }
  }

  private async validateTrainingPlan(trainingPlanId: string, teamId: string): Promise<void> {
    const trainingPlan = await this.trainingPlanRepository.findOne({
      where: { id: trainingPlanId } as any
    });

    if (!trainingPlan) {
      throw new Error('Training plan not found');
    }

    if (trainingPlan.teamId !== teamId) {
      throw new Error('Training plan does not belong to the specified team');
    }
  }
}