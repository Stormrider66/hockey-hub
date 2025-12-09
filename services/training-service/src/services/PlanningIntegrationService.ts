import { DataSource, Repository } from 'typeorm';
import { 
  ApplicationError, 
  ValidationError, 
  NotFoundError,
  getCache,
  ServiceClient 
} from '@hockey-hub/shared-lib';
import { WorkoutAssignment, AssignmentStatus } from '../entities/WorkoutAssignment';
import { WorkoutSession } from '../entities/WorkoutSession';
import { SessionTemplate } from '../entities/SessionTemplate';

export interface PlanningPhase {
  id: string;
  name: string;
  type: 'preseason' | 'in-season' | 'playoffs' | 'offseason' | 'recovery';
  startDate: Date;
  endDate: Date;
  intensity: 'low' | 'medium' | 'high' | 'peak' | 'recovery';
  loadMultiplier: number;
  focusAreas: string[];
  trainingFrequency: number; // sessions per week
  gameFrequency: number; // games per week
  recoveryRatio: number; // recovery to training ratio
  objectives: Array<{
    type: 'strength' | 'endurance' | 'speed' | 'skill' | 'tactical';
    priority: 'high' | 'medium' | 'low';
    targetImprovement: number; // percentage
  }>;
}

export interface SeasonPlan {
  id: string;
  name: string;
  teamId: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'archived';
  phases: PlanningPhase[];
  loadProgression: {
    baseLoad: number;
    peakWeek: number;
    taperWeeks: number;
    recoveryWeeks: number[];
  };
  metadata: {
    createdBy: string;
    lastModified: Date;
    version: number;
  };
}

export interface PhaseAdjustment {
  assignmentId: string;
  adjustmentType: 'load' | 'frequency' | 'intensity' | 'exercise_selection';
  originalValue: any;
  adjustedValue: any;
  reason: string;
  appliedAt: Date;
  appliedBy: string;
}

export interface WorkloadData {
  playerId: string;
  weekNumber: number;
  totalLoad: number;
  trainingLoad: number;
  gameLoad: number;
  recoveryScore: number;
  readinessScore: number;
  injuryRisk: 'low' | 'medium' | 'high';
}

export class PlanningIntegrationService {
  private planningServiceClient: ServiceClient;
  private workoutAssignmentRepository: Repository<WorkoutAssignment>;
  private workoutSessionRepository: Repository<WorkoutSession>;
  private sessionTemplateRepository: Repository<SessionTemplate>;
  private cache = getCache();

  constructor(
    private dataSource: DataSource,
    planningServiceUrl: string = process.env.PLANNING_SERVICE_URL || 'http://localhost:3006'
  ) {
    this.planningServiceClient = new ServiceClient('planning-service', planningServiceUrl);
    this.workoutAssignmentRepository = dataSource.getRepository(WorkoutAssignment);
    this.workoutSessionRepository = dataSource.getRepository(WorkoutSession);
    this.sessionTemplateRepository = dataSource.getRepository(SessionTemplate);
  }

  /**
   * Get current phase for a team
   */
  async getCurrentPhase(teamId: string): Promise<PlanningPhase | null> {
    const cacheKey = `planning:current-phase:${teamId}`;
    
    try {
      // Check cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from planning service
      const response = await this.planningServiceClient.get(`/api/v1/planning/teams/${teamId}/current-phase`);
      
      if (!response.data || !response.data.phase) {
        return null;
      }

      const phase: PlanningPhase = response.data.phase;
      
      // Cache for 1 hour
      await this.cache.setex(cacheKey, 3600, JSON.stringify(phase));
      
      return phase;
    } catch (error) {
      console.warn(`Failed to fetch current phase for team ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get season plan for a team
   */
  async getSeasonPlan(teamId: string): Promise<SeasonPlan | null> {
    const cacheKey = `planning:season-plan:${teamId}`;
    
    try {
      // Check cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from planning service
      const response = await this.planningServiceClient.get(`/api/v1/planning/teams/${teamId}/season-plan`);
      
      if (!response.data || !response.data.plan) {
        return null;
      }

      const plan: SeasonPlan = response.data.plan;
      
      // Cache for 2 hours
      await this.cache.setex(cacheKey, 7200, JSON.stringify(plan));
      
      return plan;
    } catch (error) {
      console.warn(`Failed to fetch season plan for team ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Apply phase-based adjustments to workout assignments
   */
  async applyPhaseAdjustments(
    teamId: string,
    phaseId: string,
    adjustmentOptions?: {
      forceUpdate?: boolean;
      playersToInclude?: string[];
      adjustmentTypes?: string[];
    }
  ): Promise<PhaseAdjustment[]> {
    const phase = await this.getCurrentPhase(teamId);
    if (!phase || phase.id !== phaseId) {
      throw new NotFoundError(`Phase ${phaseId} not found or not current for team ${teamId}`);
    }

    const assignments = await this.workoutAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.teamId = :teamId', { teamId })
      .andWhere('assignment.status = :status', { status: AssignmentStatus.ACTIVE })
      .andWhere('assignment.effectiveDate >= :startDate', { startDate: phase.startDate })
      .andWhere('assignment.effectiveDate <= :endDate', { endDate: phase.endDate })
      .getMany();

    const adjustments: PhaseAdjustment[] = [];
    const now = new Date();

    for (const assignment of assignments) {
      const appliedAdjustments = await this.applyPhaseToAssignment(assignment, phase);
      adjustments.push(...appliedAdjustments);
    }

    // Save all adjustments
    if (adjustments.length > 0) {
      await this.workoutAssignmentRepository.save(
        assignments.map(assignment => {
          assignment.metadata = {
            ...assignment.metadata,
            planningPhaseId: phase.id,
            lastPhaseAdjustment: now,
            phaseAdjustments: adjustments.filter(adj => adj.assignmentId === assignment.id)
          };
          return assignment;
        })
      );
    }

    // Clear cache for affected assignments
    await this.clearAssignmentCaches(teamId);

    return adjustments;
  }

  /**
   * Apply phase-specific adjustments to a single assignment
   */
  private async applyPhaseToAssignment(
    assignment: WorkoutAssignment,
    phase: PlanningPhase
  ): Promise<PhaseAdjustment[]> {
    const adjustments: PhaseAdjustment[] = [];

    // Adjust load based on phase load multiplier
    if (assignment.loadProgression) {
      const originalLoad = assignment.loadProgression.baseLoad;
      const adjustedLoad = Math.round(originalLoad * phase.loadMultiplier);

      if (adjustedLoad !== originalLoad) {
        adjustments.push({
          assignmentId: assignment.id,
          adjustmentType: 'load',
          originalValue: originalLoad,
          adjustedValue: adjustedLoad,
          reason: `Phase ${phase.name} load multiplier: ${phase.loadMultiplier}`,
          appliedAt: new Date(),
          appliedBy: 'system'
        });

        assignment.loadProgression.baseLoad = adjustedLoad;
      }
    }

    // Adjust training frequency based on phase
    const currentFrequency = this.getAssignmentFrequency(assignment);
    if (currentFrequency !== phase.trainingFrequency) {
      adjustments.push({
        assignmentId: assignment.id,
        adjustmentType: 'frequency',
        originalValue: currentFrequency,
        adjustedValue: phase.trainingFrequency,
        reason: `Phase ${phase.name} training frequency: ${phase.trainingFrequency}/week`,
        appliedAt: new Date(),
        appliedBy: 'system'
      });

      // Update recurrence pattern
      if (assignment.recurrencePattern) {
        assignment.recurrencePattern.interval = Math.max(1, Math.round(7 / phase.trainingFrequency));
      }
    }

    // Adjust intensity based on phase
    if (assignment.performanceThresholds) {
      const intensityMultiplier = this.getIntensityMultiplier(phase.intensity);
      
      if (assignment.performanceThresholds.targetHeartRateZone) {
        const originalMax = assignment.performanceThresholds.targetHeartRateZone.max;
        const adjustedMax = Math.round(originalMax * intensityMultiplier);

        if (adjustedMax !== originalMax) {
          adjustments.push({
            assignmentId: assignment.id,
            adjustmentType: 'intensity',
            originalValue: originalMax,
            adjustedValue: adjustedMax,
            reason: `Phase ${phase.name} intensity: ${phase.intensity}`,
            appliedAt: new Date(),
            appliedBy: 'system'
          });

          assignment.performanceThresholds.targetHeartRateZone.max = adjustedMax;
        }
      }
    }

    return adjustments;
  }

  /**
   * Sync with planning service to get phase updates
   */
  async syncPhaseUpdates(teamId: string): Promise<{
    updatedAssignments: number;
    newAdjustments: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updatedAssignments = 0;
    let newAdjustments = 0;

    try {
      // Get current phase from planning service
      const phase = await this.getCurrentPhase(teamId);
      if (!phase) {
        return { updatedAssignments: 0, newAdjustments: 0, errors: ['No current phase found'] };
      }

      // Get all active assignments for the team
      const assignments = await this.workoutAssignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.teamId = :teamId', { teamId })
        .andWhere('assignment.status = :status', { status: AssignmentStatus.ACTIVE })
        .getMany();

      // Check if assignments need phase updates
      const assignmentsNeedingUpdate = assignments.filter(assignment => {
        const lastPhaseId = assignment.metadata?.planningPhaseId;
        return !lastPhaseId || lastPhaseId !== phase.id;
      });

      if (assignmentsNeedingUpdate.length > 0) {
        const adjustments = await this.applyPhaseAdjustments(teamId, phase.id);
        updatedAssignments = assignmentsNeedingUpdate.length;
        newAdjustments = adjustments.length;
      }

      // Clear cache
      await this.clearAssignmentCaches(teamId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Sync failed: ${errorMessage}`);
    }

    return { updatedAssignments, newAdjustments, errors };
  }

  /**
   * Apply a phase template to a team
   */
  async applyPhaseTemplate(
    teamId: string,
    templateId: string,
    options: {
      startDate: Date;
      customizations?: {
        loadMultiplier?: number;
        trainingFrequency?: number;
        intensityAdjustment?: number;
      };
    }
  ): Promise<{
    assignmentsCreated: number;
    adjustmentsApplied: number;
    templateApplied: boolean;
  }> {
    try {
      // Fetch template from planning service
      const response = await this.planningServiceClient.get(`/api/v1/planning/templates/${templateId}`);
      
      if (!response.data || !response.data.template) {
        throw new NotFoundError(`Phase template ${templateId} not found`);
      }

      const template = response.data.template;
      
      // Create assignments based on template
      const assignmentsCreated = await this.createAssignmentsFromTemplate(
        teamId,
        template,
        options
      );

      // Apply any immediate adjustments
      const adjustments = await this.applyPhaseAdjustments(teamId, template.phaseId);

      return {
        assignmentsCreated,
        adjustmentsApplied: adjustments.length,
        templateApplied: true
      };

    } catch (error) {
      console.error(`Failed to apply phase template ${templateId}:`, error);
      throw new ApplicationError(
        `Failed to apply phase template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get workload analytics for a team
   */
  async getWorkloadAnalytics(
    teamId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<WorkloadData[]> {
    try {
      const response = await this.planningServiceClient.post('/api/v1/planning/workload/analyze', {
        teamId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      return response.data?.workloadData || [];
    } catch (error) {
      console.warn(`Failed to fetch workload analytics for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Notify planning service of training completion
   */
  async notifyTrainingCompletion(
    assignmentId: string,
    completionData: {
      playerId: string;
      completedAt: Date;
      actualLoad: number;
      completionRate: number;
      performance: Record<string, number>;
    }
  ): Promise<void> {
    try {
      await this.planningServiceClient.post('/api/v1/planning/training/completion', {
        assignmentId,
        ...completionData
      });
    } catch (error) {
      console.warn(`Failed to notify planning service of training completion:`, error);
      // Don't throw error - this is a notification, not critical
    }
  }

  // Helper methods
  private getAssignmentFrequency(assignment: WorkoutAssignment): number {
    if (!assignment.recurrencePattern || assignment.recurrenceType === 'none') {
      return 1; // One-time assignment
    }

    if (assignment.recurrenceType === 'weekly') {
      return assignment.recurrencePattern.daysOfWeek?.length || 1;
    }

    if (assignment.recurrenceType === 'daily') {
      return 7 / (assignment.recurrencePattern.interval || 1);
    }

    return 1;
  }

  private getIntensityMultiplier(intensity: string): number {
    const multipliers = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.2,
      'peak': 1.4,
      'recovery': 0.6
    };
    return multipliers[intensity as keyof typeof multipliers] || 1.0;
  }

  private async createAssignmentsFromTemplate(
    teamId: string,
    template: any,
    options: any
  ): Promise<number> {
    // Implementation would create workout assignments based on template
    // This is a placeholder - actual implementation would depend on template structure
    return 0;
  }

  private async clearAssignmentCaches(teamId: string): Promise<void> {
    const patterns = [
      `assignment:*:${teamId}`,
      `planning:*:${teamId}`,
      `workload:*:${teamId}`
    ];

    for (const pattern of patterns) {
      try {
        const keys = await this.cache.keys(pattern);
        if (keys.length > 0) {
          await this.cache.del(...keys);
        }
      } catch (error) {
        console.warn(`Failed to clear cache pattern ${pattern}:`, error);
      }
    }
  }
}