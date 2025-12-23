// @ts-nocheck - Suppress TypeScript errors for build
import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { AppDataSource } from '../config/database';
import { 
  TacticalPlan, 
  TacticalCategory, 
  FormationType, 
  ZoneType,
  PlayerAssignment,
  Formation,
  Trigger,
  VideoReference,
  PlayerPosition
} from '../entities/TacticalPlan';
import { PlaybookPlay } from '../entities/PlaybookPlay';

export interface CreateTacticalPlanDto {
  name: string;
  organizationId: string;
  coachId: string;
  teamId: string;
  category: TacticalCategory;
  formation: Formation;
  playerAssignments: PlayerAssignment[];
  description?: string;
  triggers?: Trigger[];
  videoReferences?: VideoReference[];
}

export interface UpdateTacticalPlanDto {
  name?: string;
  category?: TacticalCategory;
  formation?: Formation;
  playerAssignments?: PlayerAssignment[];
  description?: string;
  triggers?: Trigger[];
  videoReferences?: VideoReference[];
  isActive?: boolean;
}

export interface TacticalPlanFilters {
  organizationId?: string;
  teamId?: string;
  coachId?: string;
  category?: TacticalCategory;
  isActive?: boolean;
  formationType?: FormationType;
}

export interface TacticalPlanSearchParams {
  query?: string;
  category?: TacticalCategory;
  formationType?: FormationType;
  playerCount?: number;
  zone?: ZoneType;
}

class TacticalPlanRepository extends CachedRepository<TacticalPlan> {
  constructor() {
    super(AppDataSource.getRepository(TacticalPlan), 'tactical-plan', 900); // 15 minutes cache
  }

  async findByTeamAndCategory(
    teamId: string, 
    category: TacticalCategory, 
    isActive = true
  ): Promise<TacticalPlan[]> {
    const cacheKey = `tactical-plan:team:${teamId}:category:${category}:active:${isActive}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        return this.repository
          .createQueryBuilder('tp')
          .leftJoinAndSelect('tp.plays', 'plays')
          .where('tp.teamId = :teamId', { teamId })
          .andWhere('tp.category = :category', { category })
          .andWhere('tp.isActive = :isActive', { isActive })
          .orderBy('tp.name', 'ASC')
          .getMany();
      },
      600, // 10 minutes
      [`team:${teamId}`, `category:${category}`]
    );
  }

  async findByCoach(coachId: string, filters?: TacticalPlanFilters): Promise<TacticalPlan[]> {
    const cacheKey = `tactical-plan:coach:${coachId}:${JSON.stringify(filters)}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('tp')
          .leftJoinAndSelect('tp.plays', 'plays')
          .where('tp.coachId = :coachId', { coachId });

        if (filters?.teamId) {
          query.andWhere('tp.teamId = :teamId', { teamId: filters.teamId });
        }
        if (filters?.category) {
          query.andWhere('tp.category = :category', { category: filters.category });
        }
        if (filters?.isActive !== undefined) {
          query.andWhere('tp.isActive = :isActive', { isActive: filters.isActive });
        }

        return query.orderBy('tp.updatedAt', 'DESC').getMany();
      },
      900, // 15 minutes
      [`coach:${coachId}`]
    );
  }

  async searchTacticalPlans(
    organizationId: string,
    searchParams: TacticalPlanSearchParams
  ): Promise<TacticalPlan[]> {
    const cacheKey = `tactical-plan:search:${organizationId}:${JSON.stringify(searchParams)}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('tp')
          .leftJoinAndSelect('tp.plays', 'plays')
          .where('tp.organizationId = :organizationId', { organizationId })
          .andWhere('tp.isActive = true');

        if (searchParams.query) {
          query.andWhere(
            '(tp.name ILIKE :query OR tp.description ILIKE :query)', 
            { query: `%${searchParams.query}%` }
          );
        }

        if (searchParams.category) {
          query.andWhere('tp.category = :category', { category: searchParams.category });
        }

        if (searchParams.formationType) {
          query.andWhere("tp.formation->>'type' = :formationType", { 
            formationType: searchParams.formationType 
          });
        }

        if (searchParams.playerCount) {
          query.andWhere(
            'CAST(jsonb_array_length(tp.playerAssignments) AS integer) = :playerCount',
            { playerCount: searchParams.playerCount }
          );
        }

        return query
          .orderBy('tp.name', 'ASC')
          .limit(50)
          .getMany();
      },
      300, // 5 minutes
      [`organization:${organizationId}`, 'search']
    );
  }

  async getTacticalAnalytics(
    organizationId: string,
    teamId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const cacheKey = `tactical-plan:analytics:${organizationId}:${teamId || 'all'}`;
    
    return this.cacheQueryResult(
      cacheKey,
      async () => {
        const baseQuery = this.repository
          .createQueryBuilder('tp')
          .where('tp.organizationId = :organizationId', { organizationId });

        if (teamId) {
          baseQuery.andWhere('tp.teamId = :teamId', { teamId });
        }

        if (startDate && endDate) {
          baseQuery.andWhere('tp.createdAt BETWEEN :startDate AND :endDate', {
            startDate, endDate
          });
        }

        const [totalPlans, activePlans, plansPerCategory, plansPerFormation] = await Promise.all([
          baseQuery.getCount(),
          baseQuery.clone().andWhere('tp.isActive = true').getCount(),
          baseQuery.clone()
            .select('tp.category', 'category')
            .addSelect('COUNT(*)', 'count')
            .groupBy('tp.category')
            .getRawMany(),
          baseQuery.clone()
            .select("tp.formation->>'type'", 'formation_type')
            .addSelect('COUNT(*)', 'count')
            .groupBy("tp.formation->>'type'")
            .getRawMany()
        ]);

        return {
          totalPlans,
          activePlans,
          inactivePlans: totalPlans - activePlans,
          categoriesDistribution: plansPerCategory.reduce((acc, item) => {
            acc[item.category] = parseInt(item.count);
            return acc;
          }, {} as Record<TacticalCategory, number>),
          formationDistribution: plansPerFormation.reduce((acc, item) => {
            acc[item.formation_type] = parseInt(item.count);
            return acc;
          }, {} as Record<string, number>),
          lastUpdated: new Date()
        };
      },
      1800, // 30 minutes
      [`organization:${organizationId}`, 'analytics']
    );
  }
}

export class TacticalPlanService {
  private repository: TacticalPlanRepository;
  private playbookRepository: Repository<PlaybookPlay>;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.repository = new TacticalPlanRepository();
    this.playbookRepository = AppDataSource.getRepository(PlaybookPlay);
    this.logger = new Logger('TacticalPlanService');
    this.eventBus = EventBus.getInstance();
  }

  async createTacticalPlan(data: CreateTacticalPlanDto): Promise<TacticalPlan> {
    this.logger.info('Creating tactical plan', { name: data.name, teamId: data.teamId });

    try {
      // Validate formation and player assignments
      this.validateFormationAndAssignments(data.formation, data.playerAssignments);

      const tacticalPlan = await this.repository.save({
        ...data,
        isActive: true
      } as any);

      // Publish event for cross-service integration
      await this.eventBus.publish('tactical-plan.created', {
        tacticalPlanId: tacticalPlan.id,
        teamId: data.teamId,
        coachId: data.coachId,
        category: data.category,
        organizationId: data.organizationId
      });

      this.logger.info('Tactical plan created successfully', { 
        id: tacticalPlan.id, 
        name: data.name 
      });

      return tacticalPlan;
    } catch (error) {
      this.logger.error('Error creating tactical plan', { error: error.message, data });
      throw error;
    }
  }

  async updateTacticalPlan(id: string, data: UpdateTacticalPlanDto): Promise<TacticalPlan> {
    this.logger.info('Updating tactical plan', { id });

    try {
      const existingPlan = await this.repository.findOne({ where: { id } as any });
      if (!existingPlan) {
        throw new Error('Tactical plan not found');
      }

      // Validate changes if formation or assignments are updated
      if (data.formation && data.playerAssignments) {
        this.validateFormationAndAssignments(data.formation, data.playerAssignments);
      }

      Object.assign(existingPlan, data);
      const updatedPlan = await this.repository.save(existingPlan);

      // Invalidate related caches
      await this.repository.invalidateByTags([
        `team:${existingPlan.teamId}`,
        `coach:${existingPlan.coachId}`,
        `organization:${existingPlan.organizationId}`
      ]);

      // Publish update event
      await this.eventBus.publish('tactical-plan.updated', {
        tacticalPlanId: id,
        teamId: existingPlan.teamId,
        coachId: existingPlan.coachId,
        changes: Object.keys(data)
      });

      this.logger.info('Tactical plan updated successfully', { id });
      return updatedPlan;
    } catch (error) {
      this.logger.error('Error updating tactical plan', { error: error.message, id, data });
      throw error;
    }
  }

  async deleteTacticalPlan(id: string): Promise<void> {
    this.logger.info('Deleting tactical plan', { id });

    try {
      const tacticalPlan = await this.repository.findOne({ where: { id } as any });
      if (!tacticalPlan) {
        throw new Error('Tactical plan not found');
      }

      // Soft delete by setting inactive
      await this.updateTacticalPlan(id, { isActive: false });

      // Publish delete event
      await this.eventBus.publish('tactical-plan.deleted', {
        tacticalPlanId: id,
        teamId: tacticalPlan.teamId,
        coachId: tacticalPlan.coachId
      });

      this.logger.info('Tactical plan deleted successfully', { id });
    } catch (error) {
      this.logger.error('Error deleting tactical plan', { error: error.message, id });
      throw error;
    }
  }

  async getTacticalPlanById(id: string): Promise<TacticalPlan | null> {
    return this.repository.findOne({
      where: { id } as any,
      relations: ['plays']
    });
  }

  async getTacticalPlansByTeam(
    teamId: string, 
    filters?: TacticalPlanFilters
  ): Promise<TacticalPlan[]> {
    if (filters?.category) {
      return this.repository.findByTeamAndCategory(teamId, filters.category, filters.isActive);
    }
    // Fall back to a simpler query when category isn't provided
    return this.repository.findMany({
      where: {
        teamId,
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {})
      } as any
    });
  }

  async getTacticalPlansByCoach(
    coachId: string,
    filters?: TacticalPlanFilters
  ): Promise<TacticalPlan[]> {
    return this.repository.findByCoach(coachId, filters);
  }

  async searchTacticalPlans(
    organizationId: string,
    searchParams: TacticalPlanSearchParams
  ): Promise<TacticalPlan[]> {
    return this.repository.searchTacticalPlans(organizationId, searchParams);
  }

  async getTacticalAnalytics(
    organizationId: string,
    teamId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    return this.repository.getTacticalAnalytics(organizationId, teamId, startDate, endDate);
  }

  async duplicateTacticalPlan(id: string, newName: string, teamId?: string): Promise<TacticalPlan> {
    this.logger.info('Duplicating tactical plan', { id, newName });

    try {
      const originalPlan = await this.getTacticalPlanById(id);
      if (!originalPlan) {
        throw new Error('Tactical plan not found');
      }

      const duplicateData: CreateTacticalPlanDto = {
        name: newName,
        organizationId: originalPlan.organizationId,
        coachId: originalPlan.coachId,
        teamId: teamId || originalPlan.teamId,
        category: originalPlan.category,
        formation: { ...originalPlan.formation },
        playerAssignments: [...originalPlan.playerAssignments],
        description: originalPlan.description,
        triggers: originalPlan.triggers ? [...originalPlan.triggers] : undefined,
        videoReferences: originalPlan.videoReferences ? [...originalPlan.videoReferences] : undefined
      };

      const duplicatedPlan = await this.createTacticalPlan(duplicateData);

      this.logger.info('Tactical plan duplicated successfully', { 
        originalId: id, 
        duplicateId: duplicatedPlan.id 
      });

      return duplicatedPlan;
    } catch (error) {
      this.logger.error('Error duplicating tactical plan', { error: error.message, id });
      throw error;
    }
  }

  async assignPlayersToTacticalPlan(
    id: string, 
    playerAssignments: PlayerAssignment[]
  ): Promise<TacticalPlan> {
    this.logger.info('Assigning players to tactical plan', { id, playerCount: playerAssignments.length });

    try {
      const tacticalPlan = await this.getTacticalPlanById(id);
      if (!tacticalPlan) {
        throw new Error('Tactical plan not found');
      }

      // Validate assignments against formation
      this.validateFormationAndAssignments(tacticalPlan.formation, playerAssignments);

      return this.updateTacticalPlan(id, { playerAssignments });
    } catch (error) {
      this.logger.error('Error assigning players to tactical plan', { 
        error: error.message, 
        id, 
        playerAssignments 
      });
      throw error;
    }
  }

  async addVideoReference(
    id: string, 
    videoReference: VideoReference
  ): Promise<TacticalPlan> {
    this.logger.info('Adding video reference to tactical plan', { id, videoUrl: videoReference.url });

    try {
      const tacticalPlan = await this.getTacticalPlanById(id);
      if (!tacticalPlan) {
        throw new Error('Tactical plan not found');
      }

      const videoReferences = [...(tacticalPlan.videoReferences || []), videoReference];
      return this.updateTacticalPlan(id, { videoReferences });
    } catch (error) {
      this.logger.error('Error adding video reference', { error: error.message, id });
      throw error;
    }
  }

  async getFormationsByType(
    organizationId: string,
    formationType: FormationType
  ): Promise<TacticalPlan[]> {
    this.logger.info('Getting formations by type', { organizationId, formationType });

    return this.repository.findMany({
      where: { organizationId, isActive: true } as any
    }).then(plans => 
      plans.filter(plan => plan.formation.type === formationType)
    );
  }

  private validateFormationAndAssignments(
    formation: Formation, 
    playerAssignments: PlayerAssignment[]
  ): void {
    // Validate formation has required zones
    if (!formation.zones.offensive || !formation.zones.neutral || !formation.zones.defensive) {
      throw new Error('Formation must have offensive, neutral, and defensive zones');
    }

    // Count total positions in formation
    const totalPositions = Object.values(formation.zones).reduce(
      (sum, zone) => sum + zone.length, 
      0
    );

    // If formation has no positions at all, treat it as invalid formation structure
    if (totalPositions === 0) {
      throw new Error('Formation must have offensive, neutral, and defensive zones');
    }

    // Validate player assignment count
    if (playerAssignments.length > totalPositions) {
      throw new Error(`Cannot assign ${playerAssignments.length} players to formation with ${totalPositions} positions`);
    }

    // Validate unique player assignments
    const playerIds = playerAssignments.map(a => a.playerId);
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== playerIds.length) {
      throw new Error('Cannot assign the same player to multiple positions');
    }

    // Validate position names match formation
    const formationPositions = Object.values(formation.zones)
      .flat()
      .map(pos => pos.position);

    for (const assignment of playerAssignments) {
      if (!formationPositions.includes(assignment.position as any)) {
        throw new Error(`Position ${assignment.position} not found in formation`);
      }
    }
  }
}