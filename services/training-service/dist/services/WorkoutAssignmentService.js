"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutAssignmentService = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const WorkoutAssignment_1 = require("../entities/WorkoutAssignment");
const WorkoutPlayerOverride_1 = require("../entities/WorkoutPlayerOverride");
const WorkoutSession_1 = require("../entities/WorkoutSession");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const index_1 = require("../index");
class WorkoutAssignmentService extends shared_lib_1.BaseService {
    constructor() {
        super(database_1.AppDataSource.getRepository(WorkoutAssignment_1.WorkoutAssignment));
        this.workoutAssignmentRepo = database_1.AppDataSource.getRepository(WorkoutAssignment_1.WorkoutAssignment);
        this.workoutPlayerOverrideRepo = database_1.AppDataSource.getRepository(WorkoutPlayerOverride_1.WorkoutPlayerOverride);
        this.workoutSessionRepo = database_1.AppDataSource.getRepository(WorkoutSession_1.WorkoutSession);
        this.cacheService = shared_lib_1.CacheService.getInstance();
        this.logger = new shared_lib_1.Logger('WorkoutAssignmentService');
    }
    /**
     * Bulk assign workouts to organization, team, or group
     */
    async bulkAssign(dto, userId, organizationId) {
        this.logger.info('Starting bulk assignment', {
            assignmentType: dto.assignmentType,
            target: dto.assignmentTarget,
            organizationId
        });
        const result = {
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
            const conflicts = await this.checkConflictsForPlayers(targetPlayerIds, dto.scheduledDate, dto.scheduledDate, workoutSession.type);
            // Create assignments for players without conflicts
            const playersWithoutConflicts = targetPlayerIds.filter(playerId => !conflicts.some(c => c.playerId === playerId));
            for (const playerId of playersWithoutConflicts) {
                try {
                    const assignment = await this.createAssignment({
                        ...dto,
                        playerId,
                        organizationId,
                        teamId: dto.assignmentTarget.teamId || 'default',
                        createdBy: userId,
                        status: WorkoutAssignment_1.AssignmentStatus.ACTIVE
                    });
                    result.assignments.push(assignment);
                    result.created++;
                    // Clear cache for this player
                    await this.clearPlayerAssignmentCache(playerId);
                    // Publish event
                    await this.publishAssignmentCreatedEvent(assignment);
                }
                catch (error) {
                    this.logger.error('Failed to create assignment for player', { playerId, error });
                    result.failed++;
                }
            }
            result.conflicts = conflicts;
            return result;
        }
        catch (error) {
            this.logger.error('Bulk assignment failed', { error });
            throw error;
        }
    }
    /**
     * Cascade assignments through organizational hierarchy
     */
    async cascadeAssignment(dto, userId, organizationId) {
        this.logger.info('Starting cascade assignment', {
            cascadeToSubTeams: dto.cascadeToSubTeams,
            cascadeToPlayers: dto.cascadeToPlayers,
            organizationId
        });
        const result = {
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
                status: WorkoutAssignment_1.AssignmentStatus.ACTIVE
            });
            result.assignments.push(parentAssignment);
            result.created++;
            if (dto.cascadeToSubTeams || dto.cascadeToPlayers) {
                // Get all sub-teams and players
                const targets = await this.getCascadeTargets(dto.assignmentTarget, dto.cascadeToSubTeams, dto.cascadeToPlayers, dto.excludeTeamIds, dto.excludePlayerIds, organizationId);
                // Process each target
                for (const target of targets) {
                    try {
                        // Check for existing assignments if respectExistingAssignments is true
                        if (dto.respectExistingAssignments) {
                            const existing = await this.findExistingAssignment(target.playerId, dto.scheduledDate, dto.workoutType);
                            if (existing) {
                                if (dto.conflictResolution === 'skip') {
                                    continue;
                                }
                                else if (dto.conflictResolution === 'replace') {
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
                            status: WorkoutAssignment_1.AssignmentStatus.ACTIVE,
                            parentAssignmentId: parentAssignment.id
                        });
                        result.assignments.push(childAssignment);
                        result.created++;
                        // Clear cache
                        await this.clearPlayerAssignmentCache(target.playerId);
                        // Publish event
                        await this.publishAssignmentCreatedEvent(childAssignment);
                    }
                    catch (error) {
                        this.logger.error('Failed to create cascade assignment', { target, error });
                        result.failed++;
                    }
                }
            }
            return result;
        }
        catch (error) {
            this.logger.error('Cascade assignment failed', { error });
            throw error;
        }
    }
    /**
     * Check for scheduling conflicts
     */
    async checkConflicts(dto) {
        const conflicts = [];
        try {
            // Check scheduling conflicts
            const schedulingConflicts = await this.checkSchedulingConflicts(dto.playerIds, dto.startDate, dto.endDate, dto.workoutTypes);
            conflicts.push(...schedulingConflicts);
            // Check medical restrictions if requested
            if (dto.checkMedicalRestrictions) {
                const medicalConflicts = await this.checkMedicalRestrictions(dto.playerIds, dto.startDate, dto.endDate);
                conflicts.push(...medicalConflicts);
            }
            // Check load limits if requested
            if (dto.checkLoadLimits) {
                const loadConflicts = await this.checkLoadLimits(dto.playerIds, dto.startDate, dto.endDate, dto.maxDailyLoad, dto.maxWeeklyLoad);
                conflicts.push(...loadConflicts);
            }
            return conflicts;
        }
        catch (error) {
            this.logger.error('Conflict check failed', { error });
            throw error;
        }
    }
    /**
     * Resolve detected conflicts
     */
    async resolveConflict(dto, userId) {
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
                                overrideType: WorkoutPlayerOverride_1.OverrideType.SCHEDULING,
                                effectiveDate: new Date(),
                                modifications: {
                                    exempt: true,
                                    exemptionReason: dto.reason || 'Conflict override'
                                }
                            }, userId);
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
        }
        catch (error) {
            this.logger.error('Conflict resolution failed', { error });
            throw error;
        }
    }
    /**
     * Get player's assignments
     */
    async getPlayerAssignments(playerId, filter) {
        const cacheKey = `player_assignments:${playerId}:${JSON.stringify(filter || {})}`;
        // Check cache
        const cached = await this.cacheService.get(cacheKey);
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
        }
        catch (error) {
            this.logger.error('Failed to get player assignments', { playerId, error });
            throw error;
        }
    }
    /**
     * Create player override
     */
    async createPlayerOverride(dto, userId, assignmentId) {
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
                status: WorkoutPlayerOverride_1.OverrideStatus.APPROVED, // Auto-approve for now
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
        }
        catch (error) {
            this.logger.error('Failed to create player override', { error });
            throw error;
        }
    }
    // Helper methods
    async getTargetPlayerIds(assignmentType, target, organizationId) {
        // This would connect to user service to get player IDs
        // For now, returning mock data or direct IDs
        if (assignmentType === WorkoutAssignment_1.AssignmentType.INDIVIDUAL && target.playerIds) {
            return target.playerIds;
        }
        // TODO: Implement team, line, position, age group queries
        // This would require integration with user service
        return [];
    }
    async checkConflictsForPlayers(playerIds, startDate, endDate, workoutType) {
        const conflicts = [];
        for (const playerId of playerIds) {
            const existingAssignments = await this.workoutAssignmentRepo.find({
                where: {
                    playerId,
                    scheduledDate: (0, typeorm_1.Between)(startDate, endDate),
                    status: (0, typeorm_1.In)([WorkoutAssignment_1.AssignmentStatus.ACTIVE, WorkoutAssignment_1.AssignmentStatus.DRAFT])
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
    async checkSchedulingConflicts(playerIds, startDate, endDate, workoutTypes) {
        return this.checkConflictsForPlayers(playerIds, startDate, endDate, workoutTypes?.[0]);
    }
    async checkMedicalRestrictions(playerIds, startDate, endDate) {
        const conflicts = [];
        // Check for active medical restrictions
        const overrides = await this.workoutPlayerOverrideRepo.find({
            where: {
                playerId: (0, typeorm_1.In)(playerIds),
                overrideType: WorkoutPlayerOverride_1.OverrideType.MEDICAL,
                status: WorkoutPlayerOverride_1.OverrideStatus.APPROVED,
                effectiveDate: (0, typeorm_1.LessThanOrEqual)(endDate),
                expiryDate: (0, typeorm_1.MoreThanOrEqual)(startDate)
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
    async checkLoadLimits(playerIds, startDate, endDate, maxDailyLoad, maxWeeklyLoad) {
        const conflicts = [];
        // TODO: Implement load calculation logic
        // This would calculate cumulative load from existing assignments
        // and check against limits
        return conflicts;
    }
    async createAssignment(data) {
        const assignment = this.workoutAssignmentRepo.create(data);
        return await this.workoutAssignmentRepo.save(assignment);
    }
    async cancelAssignment(assignmentId, userId) {
        await this.workoutAssignmentRepo.update({ id: assignmentId }, {
            status: WorkoutAssignment_1.AssignmentStatus.CANCELLED,
            updatedBy: userId,
            updatedAt: new Date()
        });
    }
    async rescheduleAssignment(assignmentId, newDate, userId) {
        await this.workoutAssignmentRepo.update({ id: assignmentId }, {
            scheduledDate: newDate,
            updatedBy: userId,
            updatedAt: new Date()
        });
    }
    async mergeAssignments(assignmentId, options) {
        // TODO: Implement merge logic
        this.logger.warn('Merge assignments not yet implemented', { assignmentId, options });
    }
    async findExistingAssignment(playerId, scheduledDate, workoutType) {
        const query = {
            playerId,
            scheduledDate,
            status: (0, typeorm_1.In)([WorkoutAssignment_1.AssignmentStatus.ACTIVE, WorkoutAssignment_1.AssignmentStatus.DRAFT])
        };
        if (workoutType) {
            query.workoutType = workoutType;
        }
        return await this.workoutAssignmentRepo.findOne({ where: query });
    }
    async getCascadeTargets(target, includeSubTeams, includePlayers, excludeTeamIds, excludePlayerIds, organizationId) {
        // TODO: Implement hierarchy traversal
        // This would query user service for organizational structure
        return [];
    }
    async clearPlayerAssignmentCache(playerId) {
        const pattern = `player_assignments:${playerId}:*`;
        await this.cacheService.del(pattern);
    }
    async publishAssignmentCreatedEvent(assignment) {
        try {
            const eventService = (0, index_1.getTrainingEventService)();
            await eventService.publishWorkoutAssigned(assignment);
        }
        catch (error) {
            this.logger.error('Failed to publish assignment created event', { error });
        }
    }
    async publishOverrideCreatedEvent(override) {
        try {
            const eventService = (0, index_1.getTrainingEventService)();
            // TODO: Add override event to event service
            this.logger.info('Override created event would be published here', { overrideId: override.id });
        }
        catch (error) {
            this.logger.error('Failed to publish override created event', { error });
        }
    }
}
exports.WorkoutAssignmentService = WorkoutAssignmentService;
//# sourceMappingURL=WorkoutAssignmentService.js.map