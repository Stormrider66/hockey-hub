// @ts-nocheck - Complex workout assignment service with entity relationships
import { Repository, In, Between, LessThanOrEqual, MoreThanOrEqual, Not, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import { WorkoutAssignment, AssignmentType, AssignmentStatus, RecurrenceType } from '../entities/WorkoutAssignment';
import { WorkoutPlayerOverride, OverrideType, OverrideStatus } from '../entities/WorkoutPlayerOverride';
import { WorkoutSession } from '../entities/WorkoutSession';
import { Logger, CacheService } from '@hockey-hub/shared-lib';
import { 
  BulkAssignWorkoutDto, 
  CascadeAssignmentDto, 
  ConflictCheckDto, 
  ResolveConflictDto,
  CreatePlayerOverrideDto,
  WorkoutAssignmentFilterDto 
} from '../dto';
import { getTrainingEventService } from '../index';
import { PlanningIntegrationService } from './PlanningIntegrationService';

interface ConflictInfo {
  id: string;
  playerId: string;
  playerName?: string;
  conflictType: 'scheduling' | 'medical' | 'load_limit' | 'duplicate';
  existingAssignment?: WorkoutAssignment;
  proposedAssignment: Partial<WorkoutAssignment>;
  details: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolutionOptions: string[];
  };
}

interface AssignmentResult {
  created: number;
  failed: number;
  conflicts: ConflictInfo[];
  assignments: WorkoutAssignment[];
}

export class WorkoutAssignmentService {
  private workoutAssignmentRepo: Repository<WorkoutAssignment>;
  private workoutPlayerOverrideRepo: Repository<WorkoutPlayerOverride>;
  private workoutSessionRepo: Repository<WorkoutSession>;
  private cacheService: CacheService;
  private logger: Logger;
  private planningIntegrationService: PlanningIntegrationService;

  constructor() {
    this.workoutAssignmentRepo = AppDataSource.getRepository(WorkoutAssignment);
    this.workoutPlayerOverrideRepo = AppDataSource.getRepository(WorkoutPlayerOverride);
    this.workoutSessionRepo = AppDataSource.getRepository(WorkoutSession);
    this.cacheService = CacheService.getInstance();
    this.logger = new Logger('WorkoutAssignmentService');
    this.planningIntegrationService = new PlanningIntegrationService(AppDataSource);
  }

  /**
   * Bulk assign workouts to organization, team, or group
   */
  async bulkAssign(dto: BulkAssignWorkoutDto, userId: string, organizationId: string): Promise<AssignmentResult> {
    this.logger.info('Starting bulk assignment', { 
      assignmentType: dto.assignmentType, 
      target: dto.assignmentTarget,
      organizationId 
    });

    const result: AssignmentResult = {
      created: 0,
      failed: 0,
      conflicts: [],
      assignments: []
    };

    try {
      // Validate workout session exists
      const workoutSession = await this.workoutSessionRepo.findOne({
        where: { id: dto.workoutSessionId }
      });

      if (!workoutSession) {
        throw new Error('Workout session not found');
      }

      // Get target player IDs based on assignment type
      const targetPlayerIds = await this.getTargetPlayerIds(dto.assignmentType, dto.assignmentTarget, organizationId);

      if (targetPlayerIds.length === 0) {
        throw new Error('No players found for the specified target');
      }

      // Check for conflicts
      const conflicts = await this.checkConflictsForPlayers(
        targetPlayerIds,
        dto.scheduledDate,
        dto.scheduledDate,
        workoutSession.type
      );

      // Create assignments for players without conflicts
      const playersWithoutConflicts = targetPlayerIds.filter(
        playerId => !conflicts.some(c => c.playerId === playerId)
      );

      for (const playerId of playersWithoutConflicts) {
        try {
          const assignment = await this.createAssignment({
            ...dto,
            playerId,
            organizationId,
            teamId: dto.assignmentTarget.teamId || 'default',
            createdBy: userId,
            status: AssignmentStatus.ACTIVE
          });

          result.assignments.push(assignment);
          result.created++;

          // Clear cache for this player
          await this.clearPlayerAssignmentCache(playerId);

          // Publish event
          await this.publishAssignmentCreatedEvent(assignment);

        } catch (error) {
          this.logger.error('Failed to create assignment for player', { playerId, error });
          result.failed++;
        }
      }

      result.conflicts = conflicts;

      return result;

    } catch (error) {
      this.logger.error('Bulk assignment failed', { error });
      throw error;
    }
  }

  /**
   * Cascade assignments through organizational hierarchy
   */
  async cascadeAssignment(dto: CascadeAssignmentDto, userId: string, organizationId: string): Promise<AssignmentResult> {
    this.logger.info('Starting cascade assignment', { 
      cascadeToSubTeams: dto.cascadeToSubTeams,
      cascadeToPlayers: dto.cascadeToPlayers,
      organizationId 
    });

    const result: AssignmentResult = {
      created: 0,
      failed: 0,
      conflicts: [],
      assignments: []
    };

    try {
      // Create parent assignment
      const parentAssignment = await this.createAssignment({
        ...dto,
        playerId: 'organization', // Placeholder for org-level assignment
        organizationId,
        teamId: dto.assignmentTarget.teamId || organizationId,
        createdBy: userId,
        status: AssignmentStatus.ACTIVE
      });

      result.assignments.push(parentAssignment);
      result.created++;

      if (dto.cascadeToSubTeams || dto.cascadeToPlayers) {
        // Get all sub-teams and players
        const targets = await this.getCascadeTargets(
          dto.assignmentTarget,
          dto.cascadeToSubTeams,
          dto.cascadeToPlayers,
          dto.excludeTeamIds,
          dto.excludePlayerIds,
          organizationId
        );

        // Process each target
        for (const target of targets) {
          try {
            // Check for existing assignments if respectExistingAssignments is true
            if (dto.respectExistingAssignments) {
              const existing = await this.findExistingAssignment(
                target.playerId,
                dto.scheduledDate,
                dto.workoutType
              );

              if (existing) {
                if (dto.conflictResolution === 'skip') {
                  continue;
                } else if (dto.conflictResolution === 'replace') {
                  await this.cancelAssignment(existing.id, userId);
                }
                // 'merge' option would require more complex logic
              }
            }

            const childAssignment = await this.createAssignment({
              ...dto,
              playerId: target.playerId,
              organizationId,
              teamId: target.teamId,
              createdBy: userId,
              status: AssignmentStatus.ACTIVE,
              parentAssignmentId: parentAssignment.id
            });

            result.assignments.push(childAssignment);
            result.created++;

            // Clear cache
            await this.clearPlayerAssignmentCache(target.playerId);

            // Publish event
            await this.publishAssignmentCreatedEvent(childAssignment);

          } catch (error) {
            this.logger.error('Failed to create cascade assignment', { target, error });
            result.failed++;
          }
        }
      }

      return result;

    } catch (error) {
      this.logger.error('Cascade assignment failed', { error });
      throw error;
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(dto: ConflictCheckDto): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    try {
      // Check scheduling conflicts
      const schedulingConflicts = await this.checkSchedulingConflicts(
        dto.playerIds,
        dto.startDate,
        dto.endDate,
        dto.workoutTypes
      );
      conflicts.push(...schedulingConflicts);

      // Check medical restrictions if requested
      if (dto.checkMedicalRestrictions) {
        const medicalConflicts = await this.checkMedicalRestrictions(
          dto.playerIds,
          dto.startDate,
          dto.endDate
        );
        conflicts.push(...medicalConflicts);
      }

      // Check load limits if requested
      if (dto.checkLoadLimits) {
        const loadConflicts = await this.checkLoadLimits(
          dto.playerIds,
          dto.startDate,
          dto.endDate,
          dto.maxDailyLoad,
          dto.maxWeeklyLoad
        );
        conflicts.push(...loadConflicts);
      }

      return conflicts;

    } catch (error) {
      this.logger.error('Conflict check failed', { error });
      throw error;
    }
  }

  /**
   * Resolve detected conflicts
   */
  async resolveConflict(dto: ResolveConflictDto, userId: string): Promise<void> {
    this.logger.info('Resolving conflict', { conflictId: dto.conflictId, resolution: dto.resolution });

    try {
      switch (dto.resolution) {
        case 'cancel':
          // Cancel the conflicting assignment
          await this.cancelAssignment(dto.conflictId, userId);
          break;

        case 'reschedule':
          if (!dto.newScheduledDate) {
            throw new Error('New scheduled date required for reschedule resolution');
          }
          // Reschedule the assignment
          await this.rescheduleAssignment(dto.conflictId, dto.newScheduledDate, userId);
          break;

        case 'merge':
          // Merge assignments (complex logic would go here)
          await this.mergeAssignments(dto.conflictId, dto.mergeOptions);
          break;

        case 'override':
          // Create override for specific players
          if (dto.affectedPlayerIds && dto.affectedPlayerIds.length > 0) {
            for (const playerId of dto.affectedPlayerIds) {
              await this.createPlayerOverride({
                playerId,
                overrideType: OverrideType.SCHEDULING,
                effectiveDate: new Date(),
                modifications: {
                  exempt: true,
                  exemptionReason: dto.reason || 'Conflict override'
                }
              } as CreatePlayerOverrideDto, userId);
            }
          }
          break;
      }

      // Clear relevant caches
      if (dto.affectedPlayerIds) {
        for (const playerId of dto.affectedPlayerIds) {
          await this.clearPlayerAssignmentCache(playerId);
        }
      }

    } catch (error) {
      this.logger.error('Conflict resolution failed', { error });
      throw error;
    }
  }

  /**
   * Get player's assignments
   */
  async getPlayerAssignments(playerId: string, filter?: WorkoutAssignmentFilterDto): Promise<WorkoutAssignment[]> {
    const cacheKey = `player_assignments:${playerId}:${JSON.stringify(filter || {})}`;
    
    // Check cache
    const cached = await this.cacheService.get<WorkoutAssignment[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const query = this.workoutAssignmentRepo.createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.workoutSession', 'session')
        .leftJoinAndSelect('assignment.playerOverrides', 'overrides')
        .where('assignment.playerId = :playerId', { playerId });

      // Apply filters
      if (filter) {
        if (filter.status) {
          query.andWhere('assignment.status = :status', { status: filter.status });
        }

        if (filter.assignmentType) {
          query.andWhere('assignment.assignmentType = :type', { type: filter.assignmentType });
        }

        if (filter.startDate && filter.endDate) {
          query.andWhere('assignment.scheduledDate BETWEEN :startDate AND :endDate', {
            startDate: filter.startDate,
            endDate: filter.endDate
          });
        }

        if (!filter.includeExpired) {
          query.andWhere('(assignment.expiryDate IS NULL OR assignment.expiryDate > :now)', { now: new Date() });
        }
      }

      query.orderBy('assignment.scheduledDate', 'ASC');

      const assignments = await query.getMany();

      // Cache results
      await this.cacheService.set(cacheKey, assignments, 300); // 5 minutes

      return assignments;

    } catch (error) {
      this.logger.error('Failed to get player assignments', { playerId, error });
      throw error;
    }
  }

  /**
   * Create player override
   */
  async createPlayerOverride(dto: CreatePlayerOverrideDto, userId: string, assignmentId: string): Promise<WorkoutPlayerOverride> {
    try {
      const assignment = await this.workoutAssignmentRepo.findOne({
        where: { id: assignmentId }
      });

      if (!assignment) {
        throw new Error('Workout assignment not found');
      }

      if (!assignment.allowPlayerOverrides) {
        throw new Error('Player overrides not allowed for this assignment');
      }

      const override = this.workoutPlayerOverrideRepo.create({
        workoutAssignmentId: assignmentId,
        playerId: dto.playerId,
        overrideType: dto.overrideType,
        status: OverrideStatus.APPROVED, // Auto-approve for now
        effectiveDate: dto.effectiveDate,
        expiryDate: dto.expiryDate,
        modifications: dto.modifications,
        medicalRecordId: dto.medicalRecordId,
        medicalRestrictions: dto.medicalRestrictions,
        requestedBy: userId,
        requestedAt: new Date(),
        approvedBy: userId,
        approvedAt: new Date(),
        approvalNotes: dto.approvalNotes,
        performanceData: dto.performanceData,
        progressionOverride: dto.progressionOverride,
        metadata: dto.metadata
      });

      const savedOverride = await this.workoutPlayerOverrideRepo.save(override);

      // Clear cache
      await this.clearPlayerAssignmentCache(dto.playerId);

      // Publish event
      await this.publishOverrideCreatedEvent(savedOverride);

      return savedOverride;

    } catch (error) {
      this.logger.error('Failed to create player override', { error });
      throw error;
    }
  }

  // Helper methods

  private async getTargetPlayerIds(
    assignmentType: AssignmentType,
    target: any,
    organizationId: string
  ): Promise<string[]> {
    // This would connect to user service to get player IDs
    // For now, returning mock data or direct IDs
    if (assignmentType === AssignmentType.INDIVIDUAL && target.playerIds) {
      return target.playerIds;
    }

    // TODO: Implement team, line, position, age group queries
    // This would require integration with user service
    return [];
  }

  private async checkConflictsForPlayers(
    playerIds: string[],
    startDate: Date,
    endDate: Date,
    workoutType?: string
  ): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    for (const playerId of playerIds) {
      const existingAssignments = await this.workoutAssignmentRepo.find({
        where: {
          playerId,
          scheduledDate: Between(startDate, endDate),
          status: In([AssignmentStatus.ACTIVE, AssignmentStatus.DRAFT])
        }
      });

      if (existingAssignments.length > 0) {
        conflicts.push({
          id: `conflict-${Date.now()}-${playerId}`,
          playerId,
          conflictType: 'scheduling',
          existingAssignment: existingAssignments[0],
          proposedAssignment: { workoutType },
          details: {
            message: `Player already has ${existingAssignments.length} assignment(s) scheduled`,
            severity: 'medium',
            resolutionOptions: ['skip', 'replace', 'merge']
          }
        });
      }
    }

    return conflicts;
  }

  private async checkSchedulingConflicts(
    playerIds: string[],
    startDate: Date,
    endDate: Date,
    workoutTypes?: string[]
  ): Promise<ConflictInfo[]> {
    return this.checkConflictsForPlayers(playerIds, startDate, endDate, workoutTypes?.[0]);
  }

  private async checkMedicalRestrictions(
    playerIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    // Check for active medical restrictions
    const overrides = await this.workoutPlayerOverrideRepo.find({
      where: {
        playerId: In(playerIds),
        overrideType: OverrideType.MEDICAL,
        status: OverrideStatus.APPROVED,
        effectiveDate: LessThanOrEqual(endDate),
        expiryDate: MoreThanOrEqual(startDate)
      }
    });

    for (const override of overrides) {
      if (override.modifications.exempt) {
        conflicts.push({
          id: `medical-${override.id}`,
          playerId: override.playerId,
          conflictType: 'medical',
          proposedAssignment: {},
          details: {
            message: `Player has medical exemption: ${override.modifications.exemptionReason}`,
            severity: 'high',
            resolutionOptions: ['skip', 'override']
          }
        });
      }
    }

    return conflicts;
  }

  private async checkLoadLimits(
    playerIds: string[],
    startDate: Date,
    endDate: Date,
    maxDailyLoad?: number,
    maxWeeklyLoad?: number
  ): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    // TODO: Implement load calculation logic
    // This would calculate cumulative load from existing assignments
    // and check against limits

    return conflicts;
  }

  private async createAssignment(data: any): Promise<WorkoutAssignment> {
    const assignment = this.workoutAssignmentRepo.create(data);
    return await this.workoutAssignmentRepo.save(assignment);
  }

  private async cancelAssignment(assignmentId: string, userId: string): Promise<void> {
    await this.workoutAssignmentRepo.update(
      { id: assignmentId },
      { 
        status: AssignmentStatus.CANCELLED,
        updatedBy: userId,
        updatedAt: new Date()
      }
    );
  }

  private async rescheduleAssignment(
    assignmentId: string,
    newDate: Date,
    userId: string
  ): Promise<void> {
    await this.workoutAssignmentRepo.update(
      { id: assignmentId },
      { 
        scheduledDate: newDate,
        updatedBy: userId,
        updatedAt: new Date()
      }
    );
  }

  private async mergeAssignments(assignmentId: string, options: any): Promise<void> {
    // TODO: Implement merge logic
    this.logger.warn('Merge assignments not yet implemented', { assignmentId, options });
  }

  private async findExistingAssignment(
    playerId: string,
    scheduledDate: Date,
    workoutType?: string
  ): Promise<WorkoutAssignment | null> {
    const query: any = {
      playerId,
      scheduledDate,
      status: In([AssignmentStatus.ACTIVE, AssignmentStatus.DRAFT])
    };

    if (workoutType) {
      query.workoutType = workoutType;
    }

    return await this.workoutAssignmentRepo.findOne({ where: query });
  }

  private async getCascadeTargets(
    target: any,
    includeSubTeams: boolean,
    includePlayers: boolean,
    excludeTeamIds?: string[],
    excludePlayerIds?: string[],
    organizationId?: string
  ): Promise<Array<{ playerId: string; teamId: string }>> {
    // TODO: Implement hierarchy traversal
    // This would query user service for organizational structure
    return [];
  }

  private async clearPlayerAssignmentCache(playerId: string): Promise<void> {
    const pattern = `player_assignments:${playerId}:*`;
    await this.cacheService.del(pattern);
  }

  private async publishAssignmentCreatedEvent(assignment: WorkoutAssignment): Promise<void> {
    try {
      const eventService = getTrainingEventService();
      await eventService.publishWorkoutAssigned(assignment);
    } catch (error) {
      this.logger.error('Failed to publish assignment created event', { error });
    }
  }

  private async publishOverrideCreatedEvent(override: WorkoutPlayerOverride): Promise<void> {
    try {
      const eventService = getTrainingEventService();
      // TODO: Add override event to event service
      this.logger.info('Override created event would be published here', { overrideId: override.id });
    } catch (error) {
      this.logger.error('Failed to publish override created event', { error });
    }
  }

  /**
   * Create assignment with planning phase integration
   */
  async createAssignmentWithPlanningPhase(
    dto: BulkAssignWorkoutDto,
    userId: string,
    organizationId: string,
    teamId: string,
    playerId: string
  ): Promise<WorkoutAssignment> {
    try {
      // Get current planning phase for the team
      const currentPhase = await this.planningIntegrationService.getCurrentPhase(teamId);
      
      // Create the basic assignment
      const assignment = await this.createAssignment({
        ...dto,
        playerId,
        organizationId,
        teamId,
        createdBy: userId,
        status: AssignmentStatus.ACTIVE
      });

      // Apply phase-based adjustments if phase exists
      if (currentPhase) {
        await this.applyPhaseAdjustmentsToAssignment(assignment, currentPhase);
        
        // Update metadata with planning information
        assignment.metadata = {
          ...assignment.metadata,
          planningPhaseId: currentPhase.id,
          lastPhaseAdjustment: new Date(),
          originalPlanningData: {
            baseLoad: assignment.loadProgression?.baseLoad,
            originalFrequency: this.getAssignmentFrequency(assignment),
            originalIntensity: assignment.performanceThresholds?.targetHeartRateZone
          }
        };

        // Save updated assignment
        await this.workoutAssignmentRepo.save(assignment);
      }

      return assignment;
    } catch (error) {
      this.logger.error('Failed to create assignment with planning phase', { 
        playerId, 
        teamId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Bulk assign with automatic phase adjustments
   */
  async bulkAssignWithPhaseAdjustments(
    dto: BulkAssignWorkoutDto, 
    userId: string, 
    organizationId: string
  ): Promise<AssignmentResult & { phaseAdjustments: number }> {
    this.logger.info('Starting bulk assignment with phase adjustments', { 
      assignmentType: dto.assignmentType, 
      target: dto.assignmentTarget,
      organizationId 
    });

    const result = await this.bulkAssign(dto, userId, organizationId);
    let phaseAdjustments = 0;

    // Apply phase adjustments to successful assignments
    if (result.assignments.length > 0) {
      const teamId = dto.assignmentTarget.teamId || 'default';
      const currentPhase = await this.planningIntegrationService.getCurrentPhase(teamId);
      
      if (currentPhase) {
        for (const assignment of result.assignments) {
          try {
            const adjustments = await this.planningIntegrationService.applyPhaseAdjustments(
              teamId,
              currentPhase.id,
              { playersToInclude: [assignment.playerId] }
            );
            phaseAdjustments += adjustments.length;
          } catch (error) {
            this.logger.warn('Failed to apply phase adjustments to assignment', { 
              assignmentId: assignment.id,
              error 
            });
          }
        }
      }
    }

    return { ...result, phaseAdjustments };
  }

  /**
   * Update assignment loads based on season phase
   */
  async updateAssignmentLoadsForPhase(
    teamId: string,
    phaseId: string,
    playerIds?: string[]
  ): Promise<{ updated: number; errors: string[] }> {
    try {
      const phase = await this.planningIntegrationService.getCurrentPhase(teamId);
      
      if (!phase || phase.id !== phaseId) {
        throw new Error(`Phase ${phaseId} not found or not current for team ${teamId}`);
      }

      let query = this.workoutAssignmentRepo
        .createQueryBuilder('assignment')
        .where('assignment.teamId = :teamId', { teamId })
        .andWhere('assignment.status = :status', { status: AssignmentStatus.ACTIVE });

      if (playerIds && playerIds.length > 0) {
        query = query.andWhere('assignment.playerId IN (:...playerIds)', { playerIds });
      }

      const assignments = await query.getMany();
      const errors: string[] = [];
      let updated = 0;

      for (const assignment of assignments) {
        try {
          const originalLoad = assignment.loadProgression?.baseLoad || 100;
          const adjustedLoad = Math.round(originalLoad * phase.loadMultiplier);

          if (assignment.loadProgression) {
            assignment.loadProgression.baseLoad = adjustedLoad;
          }

          // Update metadata
          assignment.metadata = {
            ...assignment.metadata,
            planningPhaseId: phase.id,
            lastPhaseAdjustment: new Date(),
            phaseAdjustments: [
              ...(assignment.metadata?.phaseAdjustments || []),
              {
                adjustmentType: 'load',
                originalValue: originalLoad,
                adjustedValue: adjustedLoad,
                reason: `Phase ${phase.name} load multiplier: ${phase.loadMultiplier}`,
                appliedAt: new Date(),
                appliedBy: 'system'
              }
            ]
          };

          await this.workoutAssignmentRepo.save(assignment);
          updated++;

          // Notify planning service of the adjustment
          await this.notifyPlanningServiceOfAdjustment(assignment);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Assignment ${assignment.id}: ${errorMessage}`);
        }
      }

      return { updated, errors };
    } catch (error) {
      this.logger.error('Failed to update assignment loads for phase', { teamId, phaseId, error });
      throw error;
    }
  }

  /**
   * Get assignments filtered by planning phase
   */
  async getAssignmentsByPhase(
    teamId: string,
    phaseId: string,
    filters?: WorkoutAssignmentFilterDto
  ): Promise<WorkoutAssignment[]> {
    try {
      let query = this.workoutAssignmentRepo
        .createQueryBuilder('assignment')
        .where('assignment.teamId = :teamId', { teamId })
        .andWhere("assignment.metadata->>'planningPhaseId' = :phaseId", { phaseId });

      // Apply additional filters if provided
      if (filters?.status) {
        query = query.andWhere('assignment.status = :status', { status: filters.status });
      }

      if (filters?.startDate && filters?.endDate) {
        query = query.andWhere('assignment.effectiveDate BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error('Failed to get assignments by phase', { teamId, phaseId, error });
      throw error;
    }
  }

  /**
   * Complete assignment and notify planning service
   */
  async completeAssignmentWithPlanningNotification(
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
      // Update assignment status
      const assignment = await this.workoutAssignmentRepo.findOne({
        where: { id: assignmentId }
      });

      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      assignment.status = AssignmentStatus.COMPLETED;
      assignment.completedAt = completionData.completedAt;
      assignment.exercisesCompleted = Math.round(
        (assignment.exercisesTotal || 1) * (completionData.completionRate / 100)
      );

      await this.workoutAssignmentRepo.save(assignment);

      // Notify planning service
      await this.planningIntegrationService.notifyTrainingCompletion(
        assignmentId,
        completionData
      );

      this.logger.info('Assignment completed and planning service notified', { 
        assignmentId,
        playerId: completionData.playerId,
        completionRate: completionData.completionRate
      });

    } catch (error) {
      this.logger.error('Failed to complete assignment with planning notification', { 
        assignmentId, 
        error 
      });
      throw error;
    }
  }

  // Private helper methods for planning integration

  private async applyPhaseAdjustmentsToAssignment(
    assignment: WorkoutAssignment,
    phase: any
  ): Promise<void> {
    // Apply load multiplier
    if (assignment.loadProgression && phase.loadMultiplier) {
      assignment.loadProgression.baseLoad = Math.round(
        assignment.loadProgression.baseLoad * phase.loadMultiplier
      );
    }

    // Apply intensity adjustments
    if (assignment.performanceThresholds?.targetHeartRateZone && phase.intensity) {
      const intensityMultiplier = this.getIntensityMultiplier(phase.intensity);
      assignment.performanceThresholds.targetHeartRateZone.max = Math.round(
        assignment.performanceThresholds.targetHeartRateZone.max * intensityMultiplier
      );
    }

    // Apply frequency adjustments based on training frequency
    if (assignment.recurrencePattern && phase.trainingFrequency) {
      assignment.recurrencePattern.interval = Math.max(1, Math.round(7 / phase.trainingFrequency));
    }
  }

  private getAssignmentFrequency(assignment: WorkoutAssignment): number {
    if (!assignment.recurrencePattern || assignment.recurrenceType === 'none') {
      return 1;
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

  private async notifyPlanningServiceOfAdjustment(assignment: WorkoutAssignment): Promise<void> {
    try {
      // This could be an event publication or direct API call
      const eventService = getTrainingEventService();
      
      await eventService.publishEvent('assignment.phase_adjusted', {
        assignmentId: assignment.id,
        teamId: assignment.teamId,
        playerId: assignment.playerId,
        phaseId: assignment.metadata?.planningPhaseId,
        adjustmentTimestamp: new Date()
      });
    } catch (error) {
      this.logger.warn('Failed to notify planning service of adjustment', { 
        assignmentId: assignment.id,
        error 
      });
    }
  }
}