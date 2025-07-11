"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalIntegrationService = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const WorkoutPlayerOverride_1 = require("../entities/WorkoutPlayerOverride");
const WorkoutAssignment_1 = require("../entities/WorkoutAssignment");
const ExerciseTemplate_1 = require("../entities/ExerciseTemplate");
const medical_integration_dto_1 = require("../dto/medical-integration.dto");
class MedicalIntegrationService {
    constructor(dataSource, medicalServiceUrl = process.env.MEDICAL_SERVICE_URL || 'http://localhost:3005') {
        this.dataSource = dataSource;
        this.CACHE_TTL = 300; // 5 minutes
        this.CACHE_PREFIX = 'medical:';
        this.overrideRepository = dataSource.getRepository(WorkoutPlayerOverride_1.WorkoutPlayerOverride);
        this.assignmentRepository = dataSource.getRepository(WorkoutAssignment_1.WorkoutAssignment);
        this.exerciseRepository = dataSource.getRepository(ExerciseTemplate_1.ExerciseTemplate);
        this.medicalServiceClient = new shared_lib_1.ServiceClient({
            serviceName: 'training-service',
            serviceVersion: '1.0.0',
            baseURL: medicalServiceUrl
        });
        this.cacheService = (0, shared_lib_1.getCacheService)();
        this.setupEventListeners();
    }
    setupEventListeners() {
        const eventBus = (0, shared_lib_1.getGlobalEventBus)();
        // Listen for medical restriction updates
        eventBus.subscribe('medical.restriction.created', this.handleMedicalRestrictionEvent.bind(this));
        eventBus.subscribe('medical.restriction.updated', this.handleMedicalRestrictionEvent.bind(this));
        eventBus.subscribe('medical.restriction.cleared', this.handleMedicalRestrictionCleared.bind(this));
        eventBus.subscribe('medical.injury.reported', this.handleInjuryReported.bind(this));
    }
    async syncMedicalRestrictions(dto) {
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
                }
                else {
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
            (0, shared_lib_1.getGlobalEventBus)().emit('training.medical.sync.completed', {
                organizationId: dto.organizationId,
                teamId: dto.teamId,
                synced: restrictions.length,
                created,
                updated,
                timestamp: new Date()
            });
            return { synced: restrictions.length, created, updated };
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to sync medical restrictions', { error, dto });
            throw error;
        }
    }
    async fetchMedicalRestrictions(dto) {
        try {
            const params = {
                organizationId: dto.organizationId,
                status: dto.includeExpired ? undefined : medical_integration_dto_1.RestrictionStatus.ACTIVE
            };
            if (dto.teamId)
                params.teamId = dto.teamId;
            if (dto.playerIds?.length)
                params.playerIds = dto.playerIds.join(',');
            if (dto.fromDate)
                params.fromDate = dto.fromDate.toISOString();
            const restrictions = await this.medicalServiceClient.get('/api/v1/medical/restrictions', { params });
            return restrictions;
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to fetch medical restrictions', { error, dto });
            throw error;
        }
    }
    async createOrUpdateMedicalOverride(restriction) {
        // Find active workout assignments for the player
        const activeAssignments = await this.assignmentRepository.find({
            where: {
                assignedPlayers: {
                    playerId: restriction.playerId
                },
                isActive: true,
                startDate: (0, typeorm_1.LessThanOrEqual)(new Date()),
                endDate: (0, typeorm_1.MoreThanOrEqual)(new Date())
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
                    status: (0, typeorm_1.In)([WorkoutPlayerOverride_1.OverrideStatus.PENDING, WorkoutPlayerOverride_1.OverrideStatus.APPROVED])
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
            }
            else {
                // Create new override
                const newOverride = this.overrideRepository.create({
                    workoutAssignmentId: assignment.id,
                    playerId: restriction.playerId,
                    overrideType: WorkoutPlayerOverride_1.OverrideType.MEDICAL,
                    status: restriction.requiresSupervision ? WorkoutPlayerOverride_1.OverrideStatus.PENDING : WorkoutPlayerOverride_1.OverrideStatus.APPROVED,
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
    async generateModifications(restriction) {
        const modifications = {};
        // Load multiplier based on severity
        switch (restriction.severity) {
            case medical_integration_dto_1.RestrictionSeverity.MILD:
                modifications.loadMultiplier = 0.8;
                modifications.restMultiplier = 1.2;
                break;
            case medical_integration_dto_1.RestrictionSeverity.MODERATE:
                modifications.loadMultiplier = 0.6;
                modifications.restMultiplier = 1.5;
                break;
            case medical_integration_dto_1.RestrictionSeverity.SEVERE:
                modifications.loadMultiplier = 0.3;
                modifications.restMultiplier = 2.0;
                break;
            case medical_integration_dto_1.RestrictionSeverity.COMPLETE:
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
            modifications.excludeExercises = await this.findExercisesToExclude(restriction.restrictedMovements, restriction.affectedBodyParts);
        }
        return modifications;
    }
    async findExercisesToExclude(restrictedMovements, affectedBodyParts) {
        const exercises = await this.exerciseRepository.find({
            where: [
                { movementPatterns: (0, typeorm_1.In)(restrictedMovements) },
                { primaryMuscles: (0, typeorm_1.In)(affectedBodyParts) },
                { secondaryMuscles: (0, typeorm_1.In)(affectedBodyParts) }
            ]
        });
        return exercises.map(e => e.id);
    }
    async checkSessionCompliance(dto) {
        const cacheKey = `${this.CACHE_PREFIX}compliance:${dto.sessionId}:${dto.playerId || 'all'}`;
        // Try cache first
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        try {
            // Get session workout assignments
            const assignments = await this.assignmentRepository.find({
                where: {
                    sessionIds: (0, typeorm_1.In)([dto.sessionId])
                },
                relations: ['assignedPlayers', 'workoutTemplate', 'workoutTemplate.exercises']
            });
            const playerCompliance = [];
            let overallStatus = medical_integration_dto_1.ComplianceStatus.COMPLIANT;
            let requiresApproval = false;
            for (const assignment of assignments) {
                const players = dto.playerId
                    ? assignment.assignedPlayers.filter(ap => ap.playerId === dto.playerId)
                    : assignment.assignedPlayers;
                for (const assignedPlayer of players) {
                    const compliance = await this.checkPlayerCompliance(assignedPlayer.playerId, assignment, dto.detailed || false);
                    playerCompliance.push(compliance);
                    if (compliance.status === medical_integration_dto_1.ComplianceStatus.NON_COMPLIANT) {
                        overallStatus = medical_integration_dto_1.ComplianceStatus.NON_COMPLIANT;
                        requiresApproval = true;
                    }
                    else if (compliance.status === medical_integration_dto_1.ComplianceStatus.PARTIAL && overallStatus !== medical_integration_dto_1.ComplianceStatus.NON_COMPLIANT) {
                        overallStatus = medical_integration_dto_1.ComplianceStatus.PARTIAL;
                    }
                }
            }
            const result = {
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
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to check session compliance', { error, dto });
            throw error;
        }
    }
    async checkPlayerCompliance(playerId, assignment, detailed) {
        // Get player's active medical overrides
        const overrides = await this.overrideRepository.find({
            where: {
                playerId,
                workoutAssignmentId: assignment.id,
                overrideType: WorkoutPlayerOverride_1.OverrideType.MEDICAL,
                status: (0, typeorm_1.In)([WorkoutPlayerOverride_1.OverrideStatus.APPROVED, WorkoutPlayerOverride_1.OverrideStatus.PENDING]),
                effectiveDate: (0, typeorm_1.LessThanOrEqual)(new Date()),
                expiryDate: (0, typeorm_1.MoreThanOrEqual)(new Date())
            }
        });
        if (overrides.length === 0) {
            return {
                playerId,
                status: medical_integration_dto_1.ComplianceStatus.NOT_APPLICABLE,
                restrictions: [],
                violations: [],
                recommendations: []
            };
        }
        const violations = [];
        const restrictions = [];
        const recommendations = [];
        for (const override of overrides) {
            // Map override to restriction DTO
            const restriction = await this.mapOverrideToRestriction(override);
            restrictions.push(restriction);
            if (detailed && assignment.workoutTemplate?.exercises) {
                // Check each exercise for violations
                for (const exercise of assignment.workoutTemplate.exercises) {
                    const exerciseViolations = await this.checkExerciseViolations(exercise, override, restriction);
                    violations.push(...exerciseViolations);
                }
            }
            // Generate recommendations
            if (override.modifications.exempt) {
                recommendations.push(`Player should be exempted from this workout due to ${override.medicalRestrictions.restrictionType}`);
            }
            else if (override.modifications.loadMultiplier < 1) {
                recommendations.push(`Reduce workout load to ${override.modifications.loadMultiplier * 100}% of prescribed`);
            }
            if (override.medicalRestrictions.requiresSupervision) {
                recommendations.push('This player requires direct supervision during workout');
            }
        }
        const status = violations.length > 0
            ? medical_integration_dto_1.ComplianceStatus.NON_COMPLIANT
            : overrides.some(o => o.status === WorkoutPlayerOverride_1.OverrideStatus.PENDING)
                ? medical_integration_dto_1.ComplianceStatus.PARTIAL
                : medical_integration_dto_1.ComplianceStatus.COMPLIANT;
        return {
            playerId,
            status,
            restrictions,
            violations,
            recommendations
        };
    }
    async mapOverrideToRestriction(override) {
        return {
            id: override.medicalRecordId,
            playerId: override.playerId,
            severity: this.mapPriorityToSeverity(override.metadata?.priority),
            status: override.expiryDate && override.expiryDate < new Date()
                ? medical_integration_dto_1.RestrictionStatus.EXPIRED
                : medical_integration_dto_1.RestrictionStatus.ACTIVE,
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
    async checkExerciseViolations(exercise, override, restriction) {
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
            const hasRestrictedMovement = exerciseTemplate.movementPatterns?.some((movement) => restrictedMovements.has(movement));
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
                severity: medical_integration_dto_1.RestrictionSeverity.MODERATE
            });
        }
        return violations;
    }
    async reportMedicalConcern(dto) {
        try {
            // Forward to medical service
            const response = await this.medicalServiceClient.post('/api/v1/medical/concerns', dto);
            // Create or update player override if session/exercise specified
            if (dto.sessionId && dto.severity !== 'low') {
                const assignments = await this.assignmentRepository.find({
                    where: {
                        sessionIds: (0, typeorm_1.In)([dto.sessionId])
                    }
                });
                for (const assignment of assignments) {
                    const override = this.overrideRepository.create({
                        workoutAssignmentId: assignment.id,
                        playerId: dto.playerId,
                        overrideType: WorkoutPlayerOverride_1.OverrideType.MEDICAL,
                        status: WorkoutPlayerOverride_1.OverrideStatus.PENDING,
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
                            priority: dto.severity,
                            relatedIncidentId: response.id
                        }
                    });
                    await this.overrideRepository.save(override);
                }
            }
            // Emit event
            (0, shared_lib_1.getGlobalEventBus)().emit('training.medical.concern.reported', {
                concernId: response.id,
                playerId: dto.playerId,
                sessionId: dto.sessionId,
                severity: dto.severity,
                reportedBy: dto.reportedBy,
                timestamp: new Date()
            });
            return { concernId: response.id, status: response.status };
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to report medical concern', { error, dto });
            throw error;
        }
    }
    async getExerciseAlternatives(dto) {
        const cacheKey = `${this.CACHE_PREFIX}alternatives:${dto.playerId}:${dto.workoutId || 'general'}`;
        // Try cache first
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
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
            let exercisesToEvaluate = [];
            if (dto.exerciseIds?.length) {
                exercisesToEvaluate = await this.exerciseRepository.findBy({
                    id: (0, typeorm_1.In)(dto.exerciseIds)
                });
            }
            else if (dto.workoutId) {
                // Get exercises from workout
                const assignment = await this.assignmentRepository.findOne({
                    where: { id: dto.workoutId },
                    relations: ['workoutTemplate', 'workoutTemplate.exercises']
                });
                if (assignment?.workoutTemplate?.exercises) {
                    const exerciseIds = assignment.workoutTemplate.exercises.map(e => e.exerciseTemplateId);
                    exercisesToEvaluate = await this.exerciseRepository.findBy({
                        id: (0, typeorm_1.In)(exerciseIds)
                    });
                }
            }
            // Generate alternatives for each exercise
            const alternatives = await Promise.all(exercisesToEvaluate.map(exercise => this.generateAlternativesForExercise(exercise, restrictions)));
            // Calculate overall adjustments
            const severities = restrictions.map(r => r.severity);
            const loadAdjustment = this.calculateLoadAdjustment(severities);
            const restAdjustment = this.calculateRestAdjustment(severities);
            // Generate recommendations
            const recommendations = this.generateGeneralRecommendations(restrictions);
            const result = {
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
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to get exercise alternatives', { error, dto });
            throw error;
        }
    }
    async getPlayerActiveRestrictions(playerId) {
        // Try to get from medical service first
        try {
            const restrictions = await this.medicalServiceClient.get(`/api/v1/medical/restrictions/player/${playerId}`, { params: { active: true } });
            return restrictions;
        }
        catch (error) {
            // Fallback to local overrides
            const overrides = await this.overrideRepository.find({
                where: {
                    playerId,
                    overrideType: WorkoutPlayerOverride_1.OverrideType.MEDICAL,
                    status: (0, typeorm_1.In)([WorkoutPlayerOverride_1.OverrideStatus.APPROVED, WorkoutPlayerOverride_1.OverrideStatus.PENDING]),
                    effectiveDate: (0, typeorm_1.LessThanOrEqual)(new Date())
                }
            });
            return Promise.all(overrides.map(o => this.mapOverrideToRestriction(o)));
        }
    }
    async generateAlternativesForExercise(exercise, restrictions) {
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
    checkIfExerciseProhibited(exercise, restrictions) {
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
    async findSafeAlternatives(originalExercise, restrictions) {
        // Get all exercises in the same category
        const candidateExercises = await this.exerciseRepository.find({
            where: {
                category: originalExercise.category,
                organizationId: originalExercise.organizationId
            }
        });
        const alternatives = [];
        for (const candidate of candidateExercises) {
            if (candidate.id === originalExercise.id)
                continue;
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
    calculateSuitabilityScore(original, alternative, restrictions) {
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
    generateAlternativeReason(original, alternative, restrictions) {
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
    generateExerciseModifications(exercise, restrictions) {
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
    generateModificationsList(exercise, restrictions) {
        const mods = this.generateExerciseModifications(exercise, restrictions);
        return mods.modifications;
    }
    calculateLoadAdjustment(severities) {
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.COMPLETE))
            return 0;
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.SEVERE))
            return 0.3;
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.MODERATE))
            return 0.6;
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.MILD))
            return 0.8;
        return 1.0;
    }
    calculateLoadMultiplier(severities) {
        return this.calculateLoadAdjustment(severities);
    }
    calculateRestAdjustment(severities) {
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.SEVERE))
            return 2.0;
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.MODERATE))
            return 1.5;
        if (severities.includes(medical_integration_dto_1.RestrictionSeverity.MILD))
            return 1.2;
        return 1.0;
    }
    calculateRestMultiplier(severities) {
        return this.calculateRestAdjustment(severities);
    }
    generateGeneralRecommendations(restrictions) {
        const recommendations = new Set();
        for (const restriction of restrictions) {
            if (restriction.severity === medical_integration_dto_1.RestrictionSeverity.SEVERE || restriction.severity === medical_integration_dto_1.RestrictionSeverity.COMPLETE) {
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
    mapSeverityToPriority(severity) {
        switch (severity) {
            case medical_integration_dto_1.RestrictionSeverity.MILD:
                return 'low';
            case medical_integration_dto_1.RestrictionSeverity.MODERATE:
                return 'medium';
            case medical_integration_dto_1.RestrictionSeverity.SEVERE:
                return 'high';
            case medical_integration_dto_1.RestrictionSeverity.COMPLETE:
                return 'critical';
            default:
                return 'medium';
        }
    }
    mapPriorityToSeverity(priority) {
        switch (priority) {
            case 'low':
                return medical_integration_dto_1.RestrictionSeverity.MILD;
            case 'medium':
                return medical_integration_dto_1.RestrictionSeverity.MODERATE;
            case 'high':
                return medical_integration_dto_1.RestrictionSeverity.SEVERE;
            case 'critical':
                return medical_integration_dto_1.RestrictionSeverity.COMPLETE;
            default:
                return medical_integration_dto_1.RestrictionSeverity.MODERATE;
        }
    }
    // Event handlers
    async handleMedicalRestrictionEvent(event) {
        shared_lib_1.logger.info('Handling medical restriction event', { event });
        try {
            await this.syncMedicalRestrictions({
                organizationId: event.details.organizationId,
                playerIds: [event.playerId],
                includeExpired: false
            });
            await this.clearPlayerCache(event.playerId);
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to handle medical restriction event', { error, event });
        }
    }
    async handleMedicalRestrictionCleared(event) {
        shared_lib_1.logger.info('Handling medical restriction cleared event', { event });
        try {
            // Expire related overrides
            const overrides = await this.overrideRepository.find({
                where: {
                    playerId: event.playerId,
                    medicalRecordId: event.restrictionId,
                    status: (0, typeorm_1.In)([WorkoutPlayerOverride_1.OverrideStatus.APPROVED, WorkoutPlayerOverride_1.OverrideStatus.PENDING])
                }
            });
            for (const override of overrides) {
                override.status = WorkoutPlayerOverride_1.OverrideStatus.EXPIRED;
                override.expiryDate = new Date();
                await this.overrideRepository.save(override);
            }
            await this.clearPlayerCache(event.playerId);
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to handle restriction cleared event', { error, event });
        }
    }
    async handleInjuryReported(event) {
        shared_lib_1.logger.info('Handling injury reported event', { event });
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
        }
        catch (error) {
            shared_lib_1.logger.error('Failed to handle injury reported event', { error, event });
        }
    }
    async clearPlayerCache(playerId) {
        const patterns = [
            `${this.CACHE_PREFIX}compliance:*:${playerId}`,
            `${this.CACHE_PREFIX}alternatives:${playerId}:*`
        ];
        for (const pattern of patterns) {
            await this.cacheService.deletePattern(pattern);
        }
    }
    async createMedicalOverride(dto) {
        const override = this.overrideRepository.create({
            workoutAssignmentId: dto.workoutAssignmentId,
            playerId: dto.playerId,
            overrideType: WorkoutPlayerOverride_1.OverrideType.MEDICAL,
            status: dto.autoApprove ? WorkoutPlayerOverride_1.OverrideStatus.APPROVED : WorkoutPlayerOverride_1.OverrideStatus.PENDING,
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
        (0, shared_lib_1.getGlobalEventBus)().emit('training.medical.override.created', {
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
exports.MedicalIntegrationService = MedicalIntegrationService;
//# sourceMappingURL=MedicalIntegrationService.js.map