import { Repository, DataSource, In, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ServiceClient, getGlobalEventBus, logger, CacheService, getCacheService } from '@hockey-hub/shared-lib';
import { 
  WorkoutPlayerOverride, 
  OverrideType, 
  OverrideStatus 
} from '../entities/WorkoutPlayerOverride';
import { WorkoutAssignment } from '../entities/WorkoutAssignment';
import { ExerciseTemplate } from '../entities/ExerciseTemplate';
import {
  MedicalRestrictionDTO,
  SyncMedicalRestrictionsDTO,
  ComplianceCheckDTO,
  ComplianceResultDTO,
  ReportMedicalConcernDTO,
  AlternativeExerciseDTO,
  GetAlternativesDTO,
  AlternativesResultDTO,
  MedicalSyncEventDTO,
  CreateMedicalOverrideDTO,
  RestrictionSeverity,
  RestrictionStatus,
  ComplianceStatus
} from '../dto/medical-integration.dto';

export class MedicalIntegrationService {
  private overrideRepository: Repository<WorkoutPlayerOverride>;
  private assignmentRepository: Repository<WorkoutAssignment>;
  private exerciseRepository: Repository<ExerciseTemplate>;
  private medicalServiceClient: ServiceClient;
  private cacheService: CacheService;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'medical:';

  constructor(
    private dataSource: DataSource,
    medicalServiceUrl: string = process.env.MEDICAL_SERVICE_URL || 'http://localhost:3005'
  ) {
    this.overrideRepository = dataSource.getRepository(WorkoutPlayerOverride);
    this.assignmentRepository = dataSource.getRepository(WorkoutAssignment);
    this.exerciseRepository = dataSource.getRepository(ExerciseTemplate);
    
    this.medicalServiceClient = new ServiceClient({
      serviceName: 'training-service',
      serviceVersion: '1.0.0',
      baseURL: medicalServiceUrl
    });

    this.cacheService = getCacheService();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const eventBus = getGlobalEventBus();

    // Listen for medical restriction updates
    eventBus.subscribe('medical.restriction.created', this.handleMedicalRestrictionEvent.bind(this));
    eventBus.subscribe('medical.restriction.updated', this.handleMedicalRestrictionEvent.bind(this));
    eventBus.subscribe('medical.restriction.cleared', this.handleMedicalRestrictionCleared.bind(this));
    eventBus.subscribe('medical.injury.reported', this.handleInjuryReported.bind(this));
  }

  async syncMedicalRestrictions(dto: SyncMedicalRestrictionsDTO): Promise<{ synced: number; created: number; updated: number }> {
    try {
      // Fetch restrictions from medical service
      const restrictions = await this.fetchMedicalRestrictions(dto);
      
      let created = 0;
      let updated = 0;

      // Process each restriction
      for (const restriction of restrictions) {
        const overrideCreated = await this.createOrUpdateMedicalOverride(restriction);
        if (overrideCreated) {
          created++;
        } else {
          updated++;
        }
      }

      // Clear cache for affected players
      if (dto.playerIds?.length) {
        for (const playerId of dto.playerIds) {
          await this.clearPlayerCache(playerId);
        }
      }

      // Emit sync completed event
      getGlobalEventBus().emit('training.medical.sync.completed', {
        organizationId: dto.organizationId,
        teamId: dto.teamId,
        synced: restrictions.length,
        created,
        updated,
        timestamp: new Date()
      });

      return { synced: restrictions.length, created, updated };
    } catch (error) {
      logger.error('Failed to sync medical restrictions', { error, dto });
      throw error;
    }
  }

  private async fetchMedicalRestrictions(dto: SyncMedicalRestrictionsDTO): Promise<MedicalRestrictionDTO[]> {
    try {
      const params: any = {
        organizationId: dto.organizationId,
        status: dto.includeExpired ? undefined : RestrictionStatus.ACTIVE
      };

      if (dto.teamId) params.teamId = dto.teamId;
      if (dto.playerIds?.length) params.playerIds = dto.playerIds.join(',');
      if (dto.fromDate) params.fromDate = dto.fromDate.toISOString();

      const restrictions = await this.medicalServiceClient.get<MedicalRestrictionDTO[]>(
        '/api/v1/medical/restrictions',
        { params }
      );

      return restrictions;
    } catch (error) {
      logger.error('Failed to fetch medical restrictions', { error, dto });
      throw error;
    }
  }

  private async createOrUpdateMedicalOverride(restriction: MedicalRestrictionDTO): Promise<boolean> {
    // Find active workout assignments for the player
    const activeAssignments = await this.assignmentRepository.find({
      where: {
        assignedPlayers: {
          playerId: restriction.playerId
        },
        isActive: true,
        startDate: LessThanOrEqual(new Date()),
        endDate: MoreThanOrEqual(new Date())
      }
    });

    let created = false;

    for (const assignment of activeAssignments) {
      // Check if override already exists
      const existingOverride = await this.overrideRepository.findOne({
        where: {
          workoutAssignmentId: assignment.id,
          playerId: restriction.playerId,
          medicalRecordId: restriction.id,
          status: In([OverrideStatus.PENDING, OverrideStatus.APPROVED])
        }
      });

      if (existingOverride) {
        // Update existing override
        existingOverride.medicalRestrictions = {
          restrictionType: 'injury',
          affectedBodyParts: restriction.affectedBodyParts,
          restrictedMovements: restriction.restrictedMovements,
          maxExertionLevel: restriction.maxExertionLevel,
          requiresSupervision: restriction.requiresSupervision,
          clearanceRequired: restriction.clearanceRequired,
          medicalNotes: restriction.medicalNotes
        };
        existingOverride.expiryDate = restriction.expiryDate || null;
        existingOverride.metadata = {
          ...existingOverride.metadata,
          lastSyncedAt: new Date().toISOString()
        };

        await this.overrideRepository.save(existingOverride);
      } else {
        // Create new override
        const newOverride = this.overrideRepository.create({
          workoutAssignmentId: assignment.id,
          playerId: restriction.playerId,
          overrideType: OverrideType.MEDICAL,
          status: restriction.requiresSupervision ? OverrideStatus.PENDING : OverrideStatus.APPROVED,
          effectiveDate: restriction.effectiveDate,
          expiryDate: restriction.expiryDate,
          modifications: await this.generateModifications(restriction),
          medicalRecordId: restriction.id,
          medicalRestrictions: {
            restrictionType: 'injury',
            affectedBodyParts: restriction.affectedBodyParts,
            restrictedMovements: restriction.restrictedMovements,
            maxExertionLevel: restriction.maxExertionLevel,
            requiresSupervision: restriction.requiresSupervision,
            clearanceRequired: restriction.clearanceRequired,
            medicalNotes: restriction.medicalNotes
          },
          requestedBy: restriction.prescribedBy,
          requestedAt: restriction.prescribedAt,
          approvedBy: restriction.requiresSupervision ? null : 'system',
          approvedAt: restriction.requiresSupervision ? null : new Date(),
          metadata: {
            source: 'medical_staff',
            priority: this.mapSeverityToPriority(restriction.severity),
            syncedAt: new Date().toISOString()
          }
        });

        await this.overrideRepository.save(newOverride);
        created = true;
      }
    }

    return created;
  }

  private async generateModifications(restriction: MedicalRestrictionDTO): Promise<any> {
    const modifications: any = {};

    // Load multiplier based on severity
    switch (restriction.severity) {
      case RestrictionSeverity.MILD:
        modifications.loadMultiplier = 0.8;
        modifications.restMultiplier = 1.2;
        break;
      case RestrictionSeverity.MODERATE:
        modifications.loadMultiplier = 0.6;
        modifications.restMultiplier = 1.5;
        break;
      case RestrictionSeverity.SEVERE:
        modifications.loadMultiplier = 0.3;
        modifications.restMultiplier = 2.0;
        break;
      case RestrictionSeverity.COMPLETE:
        modifications.exempt = true;
        modifications.exemptionReason = 'Medical restriction - complete rest required';
        break;
    }

    // Intensity zone restrictions
    if (restriction.maxExertionLevel < 100) {
      modifications.intensityZone = {
        min: 0,
        max: restriction.maxExertionLevel
      };
      modifications.maxHeartRate = Math.round(220 - 30) * (restriction.maxExertionLevel / 100); // Rough estimate
    }

    // Exercise exclusions based on restricted movements
    if (restriction.restrictedMovements.length > 0) {
      modifications.excludeExercises = await this.findExercisesToExclude(
        restriction.restrictedMovements,
        restriction.affectedBodyParts
      );
    }

    return modifications;
  }

  private async findExercisesToExclude(
    restrictedMovements: string[], 
    affectedBodyParts: string[]
  ): Promise<string[]> {
    const exercises = await this.exerciseRepository.find({
      where: [
        { movementPatterns: In(restrictedMovements) },
        { primaryMuscles: In(affectedBodyParts) },
        { secondaryMuscles: In(affectedBodyParts) }
      ]
    });

    return exercises.map(e => e.id);
  }

  async checkSessionCompliance(dto: ComplianceCheckDTO): Promise<ComplianceResultDTO> {
    const cacheKey = `${this.CACHE_PREFIX}compliance:${dto.sessionId}:${dto.playerId || 'all'}`;
    
    // Try cache first
    const cached = await this.cacheService.get<ComplianceResultDTO>(cacheKey);
    if (cached) return cached;

    try {
      // Get session workout assignments
      const assignments = await this.assignmentRepository.find({
        where: {
          sessionIds: In([dto.sessionId])
        },
        relations: ['assignedPlayers', 'workoutTemplate', 'workoutTemplate.exercises']
      });

      const playerCompliance: any[] = [];
      let overallStatus = ComplianceStatus.COMPLIANT;
      let requiresApproval = false;

      for (const assignment of assignments) {
        const players = dto.playerId 
          ? assignment.assignedPlayers.filter(ap => ap.playerId === dto.playerId)
          : assignment.assignedPlayers;

        for (const assignedPlayer of players) {
          const compliance = await this.checkPlayerCompliance(
            assignedPlayer.playerId,
            assignment,
            dto.detailed || false
          );
          
          playerCompliance.push(compliance);
          
          if (compliance.status === ComplianceStatus.NON_COMPLIANT) {
            overallStatus = ComplianceStatus.NON_COMPLIANT;
            requiresApproval = true;
          } else if (compliance.status === ComplianceStatus.PARTIAL && overallStatus !== ComplianceStatus.NON_COMPLIANT) {
            overallStatus = ComplianceStatus.PARTIAL;
          }
        }
      }

      const result: ComplianceResultDTO = {
        sessionId: dto.sessionId,
        overallStatus,
        checkedAt: new Date(),
        playerCompliance,
        requiresApproval,
        approvalStatus: requiresApproval ? 'pending' : undefined
      };

      // Cache result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to check session compliance', { error, dto });
      throw error;
    }
  }

  private async checkPlayerCompliance(
    playerId: string,
    assignment: WorkoutAssignment,
    detailed: boolean
  ): Promise<any> {
    // Get player's active medical overrides
    const overrides = await this.overrideRepository.find({
      where: {
        playerId,
        workoutAssignmentId: assignment.id,
        overrideType: OverrideType.MEDICAL,
        status: In([OverrideStatus.APPROVED, OverrideStatus.PENDING]),
        effectiveDate: LessThanOrEqual(new Date()),
        expiryDate: MoreThanOrEqual(new Date())
      }
    });

    if (overrides.length === 0) {
      return {
        playerId,
        status: ComplianceStatus.NOT_APPLICABLE,
        restrictions: [],
        violations: [],
        recommendations: []
      };
    }

    const violations: any[] = [];
    const restrictions: MedicalRestrictionDTO[] = [];
    const recommendations: string[] = [];

    for (const override of overrides) {
      // Map override to restriction DTO
      const restriction = await this.mapOverrideToRestriction(override);
      restrictions.push(restriction);

      if (detailed && assignment.workoutTemplate?.exercises) {
        // Check each exercise for violations
        for (const exercise of assignment.workoutTemplate.exercises) {
          const exerciseViolations = await this.checkExerciseViolations(
            exercise,
            override,
            restriction
          );
          violations.push(...exerciseViolations);
        }
      }

      // Generate recommendations
      if (override.modifications.exempt) {
        recommendations.push(`Player should be exempted from this workout due to ${override.medicalRestrictions.restrictionType}`);
      } else if (override.modifications.loadMultiplier < 1) {
        recommendations.push(`Reduce workout load to ${override.modifications.loadMultiplier * 100}% of prescribed`);
      }

      if (override.medicalRestrictions.requiresSupervision) {
        recommendations.push('This player requires direct supervision during workout');
      }
    }

    const status = violations.length > 0 
      ? ComplianceStatus.NON_COMPLIANT
      : overrides.some(o => o.status === OverrideStatus.PENDING)
      ? ComplianceStatus.PARTIAL
      : ComplianceStatus.COMPLIANT;

    return {
      playerId,
      status,
      restrictions,
      violations,
      recommendations
    };
  }

  private async mapOverrideToRestriction(override: WorkoutPlayerOverride): Promise<MedicalRestrictionDTO> {
    return {
      id: override.medicalRecordId,
      playerId: override.playerId,
      severity: this.mapPriorityToSeverity(override.metadata?.priority),
      status: override.expiryDate && override.expiryDate < new Date() 
        ? RestrictionStatus.EXPIRED 
        : RestrictionStatus.ACTIVE,
      affectedBodyParts: override.medicalRestrictions?.affectedBodyParts || [],
      restrictedMovements: override.medicalRestrictions?.restrictedMovements || [],
      restrictedExerciseTypes: override.modifications?.excludeExercises || [],
      maxExertionLevel: override.medicalRestrictions?.maxExertionLevel || 100,
      requiresSupervision: override.medicalRestrictions?.requiresSupervision || false,
      clearanceRequired: override.medicalRestrictions?.clearanceRequired || false,
      effectiveDate: override.effectiveDate,
      expiryDate: override.expiryDate,
      medicalNotes: override.medicalRestrictions?.medicalNotes,
      prescribedBy: override.requestedBy,
      prescribedAt: override.requestedAt
    };
  }

  private async checkExerciseViolations(
    exercise: any,
    override: WorkoutPlayerOverride,
    restriction: MedicalRestrictionDTO
  ): Promise<any[]> {
    const violations = [];

    // Check if exercise is explicitly excluded
    if (override.modifications?.excludeExercises?.includes(exercise.id)) {
      violations.push({
        restrictionId: restriction.id,
        exerciseId: exercise.id,
        violationType: 'movement',
        description: `Exercise "${exercise.name}" is restricted due to medical condition`,
        severity: restriction.severity
      });
    }

    // Check movement patterns
    const exerciseTemplate = await this.exerciseRepository.findOne({
      where: { id: exercise.exerciseTemplateId }
    });

    if (exerciseTemplate) {
      const restrictedMovements = new Set(restriction.restrictedMovements);
      const hasRestrictedMovement = exerciseTemplate.movementPatterns?.some(
        (movement: string) => restrictedMovements.has(movement)
      );

      if (hasRestrictedMovement) {
        violations.push({
          restrictionId: restriction.id,
          exerciseId: exercise.id,
          violationType: 'movement',
          description: `Exercise contains restricted movement patterns`,
          severity: restriction.severity
        });
      }

      // Check intensity violations
      if (exerciseTemplate.defaultIntensity > restriction.maxExertionLevel) {
        violations.push({
          restrictionId: restriction.id,
          exerciseId: exercise.id,
          violationType: 'intensity',
          description: `Exercise intensity (${exerciseTemplate.defaultIntensity}%) exceeds maximum allowed (${restriction.maxExertionLevel}%)`,
          severity: restriction.severity
        });
      }
    }

    // Check supervision requirements
    if (restriction.requiresSupervision && !exercise.requiresSupervision) {
      violations.push({
        restrictionId: restriction.id,
        exerciseId: exercise.id,
        violationType: 'supervision',
        description: 'Exercise requires supervision due to medical restriction',
        severity: RestrictionSeverity.MODERATE
      });
    }

    return violations;
  }

  async reportMedicalConcern(dto: ReportMedicalConcernDTO): Promise<{ concernId: string; status: string }> {
    try {
      // Forward to medical service
      const response = await this.medicalServiceClient.post<{ id: string; status: string }>(
        '/api/v1/medical/concerns',
        dto
      );

      // Create or update player override if session/exercise specified
      if (dto.sessionId && dto.severity !== 'low') {
        const assignments = await this.assignmentRepository.find({
          where: {
            sessionIds: In([dto.sessionId])
          }
        });

        for (const assignment of assignments) {
          const override = this.overrideRepository.create({
            workoutAssignmentId: assignment.id,
            playerId: dto.playerId,
            overrideType: OverrideType.MEDICAL,
            status: OverrideStatus.PENDING,
            effectiveDate: new Date(),
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            modifications: {
              loadMultiplier: dto.severity === 'critical' ? 0 : dto.severity === 'high' ? 0.5 : 0.7,
              restMultiplier: 1.5,
              customModifications: {
                concernId: response.id,
                concernType: dto.concernType,
                reportedAt: dto.occurredAt
              }
            },
            medicalRecordId: response.id,
            medicalRestrictions: {
              restrictionType: 'injury',
              affectedBodyParts: dto.affectedBodyParts || [],
              restrictedMovements: [],
              requiresSupervision: dto.severity === 'high' || dto.severity === 'critical',
              clearanceRequired: true,
              medicalNotes: `Concern reported: ${dto.description}`
            },
            requestedBy: dto.reportedBy,
            requestedAt: new Date(),
            requiresReview: true,
            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            metadata: {
              source: 'player_request',
              priority: dto.severity as any,
              relatedIncidentId: response.id
            }
          });

          await this.overrideRepository.save(override);
        }
      }

      // Emit event
      getGlobalEventBus().emit('training.medical.concern.reported', {
        concernId: response.id,
        playerId: dto.playerId,
        sessionId: dto.sessionId,
        severity: dto.severity,
        reportedBy: dto.reportedBy,
        timestamp: new Date()
      });

      return { concernId: response.id, status: response.status };
    } catch (error) {
      logger.error('Failed to report medical concern', { error, dto });
      throw error;
    }
  }

  async getExerciseAlternatives(dto: GetAlternativesDTO): Promise<AlternativesResultDTO> {
    const cacheKey = `${this.CACHE_PREFIX}alternatives:${dto.playerId}:${dto.workoutId || 'general'}`;
    
    // Try cache first
    const cached = await this.cacheService.get<AlternativesResultDTO>(cacheKey);
    if (cached) return cached;

    try {
      // Get player's active restrictions
      const restrictions = await this.getPlayerActiveRestrictions(dto.playerId);
      
      if (restrictions.length === 0) {
        return {
          playerId: dto.playerId,
          restrictions: [],
          alternatives: [],
          generalRecommendations: ['No active medical restrictions found'],
          loadAdjustment: 1.0,
          restAdjustment: 1.0
        };
      }

      // Get exercises to evaluate
      let exercisesToEvaluate: ExerciseTemplate[] = [];
      
      if (dto.exerciseIds?.length) {
        exercisesToEvaluate = await this.exerciseRepository.findBy({
          id: In(dto.exerciseIds)
        });
      } else if (dto.workoutId) {
        // Get exercises from workout
        const assignment = await this.assignmentRepository.findOne({
          where: { id: dto.workoutId },
          relations: ['workoutTemplate', 'workoutTemplate.exercises']
        });
        
        if (assignment?.workoutTemplate?.exercises) {
          const exerciseIds = assignment.workoutTemplate.exercises.map(e => e.exerciseTemplateId);
          exercisesToEvaluate = await this.exerciseRepository.findBy({
            id: In(exerciseIds)
          });
        }
      }

      // Generate alternatives for each exercise
      const alternatives = await Promise.all(
        exercisesToEvaluate.map(exercise => this.generateAlternativesForExercise(exercise, restrictions))
      );

      // Calculate overall adjustments
      const severities = restrictions.map(r => r.severity);
      const loadAdjustment = this.calculateLoadAdjustment(severities);
      const restAdjustment = this.calculateRestAdjustment(severities);

      // Generate recommendations
      const recommendations = this.generateGeneralRecommendations(restrictions);

      const result: AlternativesResultDTO = {
        playerId: dto.playerId,
        restrictions,
        alternatives,
        generalRecommendations: recommendations,
        loadAdjustment,
        restAdjustment
      };

      // Cache result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to get exercise alternatives', { error, dto });
      throw error;
    }
  }

  private async getPlayerActiveRestrictions(playerId: string): Promise<MedicalRestrictionDTO[]> {
    // Try to get from medical service first
    try {
      const restrictions = await this.medicalServiceClient.get<MedicalRestrictionDTO[]>(
        `/api/v1/medical/restrictions/player/${playerId}`,
        { params: { active: true } }
      );
      return restrictions;
    } catch (error) {
      // Fallback to local overrides
      const overrides = await this.overrideRepository.find({
        where: {
          playerId,
          overrideType: OverrideType.MEDICAL,
          status: In([OverrideStatus.APPROVED, OverrideStatus.PENDING]),
          effectiveDate: LessThanOrEqual(new Date())
        }
      });

      return Promise.all(overrides.map(o => this.mapOverrideToRestriction(o)));
    }
  }

  private async generateAlternativesForExercise(
    exercise: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): Promise<any> {
    const cannotPerform = this.checkIfExerciseProhibited(exercise, restrictions);
    
    if (cannotPerform) {
      const alternatives = await this.findSafeAlternatives(exercise, restrictions);
      return {
        originalExercise: {
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
          primaryMuscles: exercise.primaryMuscles || [],
          equipment: exercise.equipment || []
        },
        suggestedAlternatives: alternatives,
        cannotPerform: true,
        requiresApproval: true
      };
    }

    // Exercise can be performed with modifications
    const modifications = this.generateExerciseModifications(exercise, restrictions);
    return {
      originalExercise: {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        primaryMuscles: exercise.primaryMuscles || [],
        equipment: exercise.equipment || []
      },
      suggestedAlternatives: [{
        originalExerciseId: exercise.id,
        alternativeExerciseId: exercise.id,
        reason: 'Can be performed with modifications',
        loadMultiplier: modifications.loadMultiplier,
        restMultiplier: modifications.restMultiplier,
        modifications: modifications.modifications,
        requiresSupervision: modifications.requiresSupervision,
        suitabilityScore: modifications.suitabilityScore
      }],
      cannotPerform: false,
      requiresApproval: modifications.requiresSupervision
    };
  }

  private checkIfExerciseProhibited(
    exercise: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): boolean {
    for (const restriction of restrictions) {
      // Check if exercise type is restricted
      if (restriction.restrictedExerciseTypes.includes(exercise.category)) {
        return true;
      }

      // Check movement patterns
      const restrictedMovements = new Set(restriction.restrictedMovements);
      if (exercise.movementPatterns?.some(m => restrictedMovements.has(m))) {
        return true;
      }

      // Check affected body parts
      const affectedParts = new Set(restriction.affectedBodyParts);
      if (exercise.primaryMuscles?.some(m => affectedParts.has(m))) {
        return true;
      }

      // Check intensity requirements
      if (exercise.defaultIntensity > restriction.maxExertionLevel) {
        return true;
      }
    }

    return false;
  }

  private async findSafeAlternatives(
    originalExercise: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): Promise<AlternativeExerciseDTO[]> {
    // Get all exercises in the same category
    const candidateExercises = await this.exerciseRepository.find({
      where: {
        category: originalExercise.category,
        organizationId: originalExercise.organizationId
      }
    });

    const alternatives: AlternativeExerciseDTO[] = [];

    for (const candidate of candidateExercises) {
      if (candidate.id === originalExercise.id) continue;
      
      if (!this.checkIfExerciseProhibited(candidate, restrictions)) {
        const suitability = this.calculateSuitabilityScore(originalExercise, candidate, restrictions);
        
        if (suitability > 60) { // Minimum 60% suitability
          alternatives.push({
            originalExerciseId: originalExercise.id,
            alternativeExerciseId: candidate.id,
            reason: this.generateAlternativeReason(originalExercise, candidate, restrictions),
            loadMultiplier: this.calculateLoadMultiplier(restrictions),
            restMultiplier: this.calculateRestMultiplier(restrictions),
            modifications: this.generateModificationsList(candidate, restrictions),
            requiresSupervision: restrictions.some(r => r.requiresSupervision),
            suitabilityScore: suitability
          });
        }
      }
    }

    // Sort by suitability score
    return alternatives.sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, 3);
  }

  private calculateSuitabilityScore(
    original: ExerciseTemplate,
    alternative: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): number {
    let score = 100;

    // Deduct points for different muscle groups
    const originalMuscles = new Set(original.primaryMuscles || []);
    const alternativeMuscles = new Set(alternative.primaryMuscles || []);
    const muscleOverlap = [...originalMuscles].filter(m => alternativeMuscles.has(m)).length;
    const muscleScore = (muscleOverlap / originalMuscles.size) * 30;
    score = score - (30 - muscleScore);

    // Deduct points for different equipment
    if (original.equipment?.join(',') !== alternative.equipment?.join(',')) {
      score -= 10;
    }

    // Deduct points for higher intensity
    if (alternative.defaultIntensity > original.defaultIntensity) {
      score -= 15;
    }

    // Bonus points for being safer
    const maxAllowedIntensity = Math.min(...restrictions.map(r => r.maxExertionLevel));
    if (alternative.defaultIntensity < maxAllowedIntensity * 0.8) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateAlternativeReason(
    original: ExerciseTemplate,
    alternative: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): string {
    const reasons = [];

    if (restrictions.some(r => r.restrictedMovements.length > 0)) {
      reasons.push('avoids restricted movement patterns');
    }

    if (restrictions.some(r => r.affectedBodyParts.length > 0)) {
      reasons.push('targets different muscle groups');
    }

    if (alternative.defaultIntensity < original.defaultIntensity) {
      reasons.push('lower intensity option');
    }

    if (alternative.equipment?.includes('bodyweight')) {
      reasons.push('no equipment required');
    }

    return reasons.length > 0 
      ? `Alternative exercise that ${reasons.join(', ')}`
      : 'Safe alternative based on medical restrictions';
  }

  private generateExerciseModifications(
    exercise: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): any {
    const modifications = [];
    let loadMultiplier = 1.0;
    let restMultiplier = 1.0;
    let requiresSupervision = false;

    for (const restriction of restrictions) {
      const restrictionLoad = this.calculateLoadMultiplier([restriction.severity]);
      const restrictionRest = this.calculateRestMultiplier([restriction.severity]);
      
      loadMultiplier = Math.min(loadMultiplier, restrictionLoad);
      restMultiplier = Math.max(restMultiplier, restrictionRest);
      
      if (restriction.requiresSupervision) {
        requiresSupervision = true;
      }

      // Generate specific modifications
      if (restriction.maxExertionLevel < 80) {
        modifications.push(`Keep heart rate below ${Math.round(restriction.maxExertionLevel)}% of maximum`);
      }

      if (restriction.affectedBodyParts.length > 0) {
        modifications.push(`Avoid excessive stress on ${restriction.affectedBodyParts.join(', ')}`);
      }

      if (loadMultiplier < 1.0) {
        modifications.push(`Reduce weight/resistance to ${Math.round(loadMultiplier * 100)}% of normal`);
      }

      if (restMultiplier > 1.0) {
        modifications.push(`Increase rest periods by ${Math.round((restMultiplier - 1) * 100)}%`);
      }
    }

    return {
      loadMultiplier,
      restMultiplier,
      modifications,
      requiresSupervision,
      suitabilityScore: 80 // Base score for modified exercises
    };
  }

  private generateModificationsList(
    exercise: ExerciseTemplate,
    restrictions: MedicalRestrictionDTO[]
  ): string[] {
    const mods = this.generateExerciseModifications(exercise, restrictions);
    return mods.modifications;
  }

  private calculateLoadAdjustment(severities: RestrictionSeverity[]): number {
    if (severities.includes(RestrictionSeverity.COMPLETE)) return 0;
    if (severities.includes(RestrictionSeverity.SEVERE)) return 0.3;
    if (severities.includes(RestrictionSeverity.MODERATE)) return 0.6;
    if (severities.includes(RestrictionSeverity.MILD)) return 0.8;
    return 1.0;
  }

  private calculateLoadMultiplier(severities: RestrictionSeverity[]): number {
    return this.calculateLoadAdjustment(severities);
  }

  private calculateRestAdjustment(severities: RestrictionSeverity[]): number {
    if (severities.includes(RestrictionSeverity.SEVERE)) return 2.0;
    if (severities.includes(RestrictionSeverity.MODERATE)) return 1.5;
    if (severities.includes(RestrictionSeverity.MILD)) return 1.2;
    return 1.0;
  }

  private calculateRestMultiplier(severities: RestrictionSeverity[]): number {
    return this.calculateRestAdjustment(severities);
  }

  private generateGeneralRecommendations(restrictions: MedicalRestrictionDTO[]): string[] {
    const recommendations = new Set<string>();

    for (const restriction of restrictions) {
      if (restriction.severity === RestrictionSeverity.SEVERE || restriction.severity === RestrictionSeverity.COMPLETE) {
        recommendations.add('Consider postponing high-intensity training until medical clearance');
      }

      if (restriction.requiresSupervision) {
        recommendations.add('Ensure qualified supervision is present during all training sessions');
      }

      if (restriction.maxExertionLevel < 70) {
        recommendations.add('Focus on technique and mobility work rather than strength/power');
      }

      if (restriction.affectedBodyParts.includes('back') || restriction.affectedBodyParts.includes('spine')) {
        recommendations.add('Prioritize core stability and avoid axial loading');
      }

      if (restriction.clearanceRequired) {
        recommendations.add('Obtain medical clearance before returning to full training');
      }
    }

    // Add general safety recommendations
    recommendations.add('Monitor for any signs of pain or discomfort during exercise');
    recommendations.add('Ensure proper warm-up and cool-down protocols are followed');
    
    if (restrictions.length > 1) {
      recommendations.add('Multiple restrictions present - consider individualized programming');
    }

    return Array.from(recommendations);
  }

  private mapSeverityToPriority(severity: RestrictionSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case RestrictionSeverity.MILD:
        return 'low';
      case RestrictionSeverity.MODERATE:
        return 'medium';
      case RestrictionSeverity.SEVERE:
        return 'high';
      case RestrictionSeverity.COMPLETE:
        return 'critical';
      default:
        return 'medium';
    }
  }

  private mapPriorityToSeverity(priority?: string): RestrictionSeverity {
    switch (priority) {
      case 'low':
        return RestrictionSeverity.MILD;
      case 'medium':
        return RestrictionSeverity.MODERATE;
      case 'high':
        return RestrictionSeverity.SEVERE;
      case 'critical':
        return RestrictionSeverity.COMPLETE;
      default:
        return RestrictionSeverity.MODERATE;
    }
  }

  // Event handlers
  private async handleMedicalRestrictionEvent(event: MedicalSyncEventDTO) {
    logger.info('Handling medical restriction event', { event });
    
    try {
      await this.syncMedicalRestrictions({
        organizationId: event.details.organizationId,
        playerIds: [event.playerId],
        includeExpired: false
      });
      
      await this.clearPlayerCache(event.playerId);
    } catch (error) {
      logger.error('Failed to handle medical restriction event', { error, event });
    }
  }

  private async handleMedicalRestrictionCleared(event: MedicalSyncEventDTO) {
    logger.info('Handling medical restriction cleared event', { event });
    
    try {
      // Expire related overrides
      const overrides = await this.overrideRepository.find({
        where: {
          playerId: event.playerId,
          medicalRecordId: event.restrictionId,
          status: In([OverrideStatus.APPROVED, OverrideStatus.PENDING])
        }
      });

      for (const override of overrides) {
        override.status = OverrideStatus.EXPIRED;
        override.expiryDate = new Date();
        await this.overrideRepository.save(override);
      }

      await this.clearPlayerCache(event.playerId);
    } catch (error) {
      logger.error('Failed to handle restriction cleared event', { error, event });
    }
  }

  private async handleInjuryReported(event: any) {
    logger.info('Handling injury reported event', { event });
    
    try {
      await this.reportMedicalConcern({
        playerId: event.playerId,
        concernType: 'injury',
        severity: event.severity || 'medium',
        description: event.description,
        affectedBodyParts: event.bodyParts,
        reportedBy: event.reportedBy,
        occurredAt: new Date(event.occurredAt)
      });
    } catch (error) {
      logger.error('Failed to handle injury reported event', { error, event });
    }
  }

  private async clearPlayerCache(playerId: string) {
    const patterns = [
      `${this.CACHE_PREFIX}compliance:*:${playerId}`,
      `${this.CACHE_PREFIX}alternatives:${playerId}:*`
    ];

    for (const pattern of patterns) {
      await this.cacheService.deletePattern(pattern);
    }
  }

  async createMedicalOverride(dto: CreateMedicalOverrideDTO): Promise<WorkoutPlayerOverride> {
    const override = this.overrideRepository.create({
      workoutAssignmentId: dto.workoutAssignmentId,
      playerId: dto.playerId,
      overrideType: OverrideType.MEDICAL,
      status: dto.autoApprove ? OverrideStatus.APPROVED : OverrideStatus.PENDING,
      effectiveDate: dto.restriction.effectiveDate,
      expiryDate: dto.restriction.expiryDate,
      modifications: {
        loadMultiplier: this.calculateLoadMultiplier([dto.restriction.severity]),
        restMultiplier: this.calculateRestMultiplier([dto.restriction.severity]),
        substituteExercises: dto.alternatives.map(alt => ({
          originalExerciseId: alt.originalExerciseId,
          substituteExerciseId: alt.alternativeExerciseId,
          reason: alt.reason
        }))
      },
      medicalRecordId: dto.medicalRecordId,
      medicalRestrictions: {
        restrictionType: 'injury',
        affectedBodyParts: dto.restriction.affectedBodyParts,
        restrictedMovements: dto.restriction.restrictedMovements,
        maxExertionLevel: dto.restriction.maxExertionLevel,
        requiresSupervision: dto.restriction.requiresSupervision,
        clearanceRequired: dto.restriction.clearanceRequired,
        medicalNotes: dto.restriction.medicalNotes
      },
      requestedBy: dto.restriction.prescribedBy,
      requestedAt: new Date(),
      approvedBy: dto.autoApprove ? 'system' : null,
      approvedAt: dto.autoApprove ? new Date() : null,
      approvalNotes: dto.notes,
      metadata: {
        source: 'medical_staff',
        priority: this.mapSeverityToPriority(dto.restriction.severity)
      }
    });

    const saved = await this.overrideRepository.save(override);
    
    // Clear cache
    await this.clearPlayerCache(dto.playerId);

    // Emit event
    getGlobalEventBus().emit('training.medical.override.created', {
      overrideId: saved.id,
      playerId: dto.playerId,
      workoutAssignmentId: dto.workoutAssignmentId,
      severity: dto.restriction.severity,
      autoApproved: dto.autoApprove,
      timestamp: new Date()
    });

    return saved;
  }
}