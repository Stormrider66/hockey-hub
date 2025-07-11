"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingEventService = void 0;
const shared_lib_1 = require("@hockey-hub/shared-lib");
const TrainingEventPublisher_1 = require("../events/TrainingEventPublisher");
const WorkoutAssignment_1 = require("../entities/WorkoutAssignment");
const WorkoutSession_1 = require("../entities/WorkoutSession");
const uuid_1 = require("uuid");
class TrainingEventService {
    constructor(dataSource) {
        this.logger = new shared_lib_1.Logger('TrainingEventService');
        // Initialize repositories
        this.workoutAssignmentRepository = dataSource.getRepository(WorkoutAssignment_1.WorkoutAssignment);
        this.workoutSessionRepository = dataSource.getRepository(WorkoutSession_1.WorkoutSession);
        // Initialize event system
        const eventBus = (0, shared_lib_1.getGlobalEventBus)({
            enableLogging: true,
            asyncMode: true,
            maxListeners: 100
        });
        this.eventFactory = new shared_lib_1.EventFactory({
            source: 'training-service',
            version: '1.0.0'
        });
        this.eventPublisher = new TrainingEventPublisher_1.TrainingEventPublisher(eventBus, this.eventFactory);
    }
    /**
     * Set user context for events
     */
    setUserContext(userId, organizationId) {
        this.eventFactory.setUserContext(userId, organizationId);
    }
    /**
     * Publish workout created event
     */
    async publishWorkoutCreated(assignment, correlationId) {
        try {
            // Load the related session template with exercises
            const session = await this.workoutSessionRepository.findOne({
                where: { id: assignment.sessionTemplateId },
                relations: ['exercises']
            });
            if (!session) {
                this.logger.warn('Session template not found for workout creation event', {
                    sessionTemplateId: assignment.sessionTemplateId
                });
                return;
            }
            await this.eventPublisher.publishWorkoutCreated({
                workoutId: assignment.id,
                sessionTemplateId: assignment.sessionTemplateId,
                playerId: assignment.playerId,
                teamId: assignment.teamId,
                organizationId: assignment.organizationId,
                type: session.type,
                scheduledDate: assignment.scheduledDate,
                duration: session.estimatedDuration,
                exercises: session.exercises.map(ex => ({
                    exerciseTemplateId: ex.id,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    duration: ex.duration
                }))
            }, correlationId);
            // Update assignment with event metadata
            await this.updateAssignmentEventMetadata(assignment.id, 'workout_created');
        }
        catch (error) {
            this.logger.error('Failed to publish workout created event', error, {
                workoutId: assignment.id
            });
            throw error;
        }
    }
    /**
     * Publish workout assigned event
     */
    async publishWorkoutAssigned(assignment, correlationId) {
        try {
            await this.eventPublisher.publishWorkoutAssigned({
                assignmentId: assignment.id,
                workoutId: assignment.workoutSessionId,
                sessionTemplateId: assignment.sessionTemplateId,
                playerId: assignment.playerId,
                teamId: assignment.teamId,
                organizationId: assignment.organizationId,
                assignmentType: assignment.assignmentType,
                scheduledDate: assignment.scheduledDate,
                effectiveDate: assignment.effectiveDate,
                expiryDate: assignment.expiryDate,
                priority: assignment.priority,
                parentAssignmentId: assignment.parentAssignmentId
            }, correlationId);
            // Update assignment with event metadata
            await this.updateAssignmentEventMetadata(assignment.id, 'workout_assigned');
        }
        catch (error) {
            this.logger.error('Failed to publish workout assigned event', error, {
                assignmentId: assignment.id
            });
            throw error;
        }
    }
    /**
     * Publish workout completed event
     */
    async publishWorkoutCompleted(assignment, performanceMetrics, correlationId) {
        try {
            const completedAt = assignment.completedAt || new Date();
            const totalDuration = Math.floor((completedAt.getTime() - assignment.startedAt.getTime()) / 1000);
            await this.eventPublisher.publishWorkoutCompleted({
                workoutId: assignment.id,
                playerId: assignment.playerId,
                teamId: assignment.teamId,
                organizationId: assignment.organizationId,
                completedAt,
                totalDuration,
                exercisesCompleted: assignment.exercisesCompleted || 0,
                exercisesTotal: assignment.exercisesTotal || 0,
                performanceMetrics
            }, correlationId);
            // Update assignment with event metadata
            await this.updateAssignmentEventMetadata(assignment.id, 'workout_completed');
        }
        catch (error) {
            this.logger.error('Failed to publish workout completed event', error, {
                workoutId: assignment.id
            });
            throw error;
        }
    }
    /**
     * Publish workout cancelled event
     */
    async publishWorkoutCancelled(assignment, cancelledBy, reason, correlationId) {
        try {
            await this.eventPublisher.publishWorkoutCancelled({
                workoutId: assignment.id,
                playerId: assignment.playerId,
                teamId: assignment.teamId,
                organizationId: assignment.organizationId,
                reason,
                cancelledBy
            }, correlationId);
            // Update assignment with event metadata
            await this.updateAssignmentEventMetadata(assignment.id, 'workout_cancelled');
        }
        catch (error) {
            this.logger.error('Failed to publish workout cancelled event', error, {
                workoutId: assignment.id
            });
            throw error;
        }
    }
    /**
     * Publish injury reported event
     */
    async publishInjuryReported(injuryData, correlationId) {
        try {
            const injuryId = (0, uuid_1.v4)();
            await this.eventPublisher.publishInjuryReported({
                injuryId,
                ...injuryData
            }, correlationId);
            if (injuryData.workoutId) {
                await this.updateAssignmentEventMetadata(injuryData.workoutId, 'injury_reported');
            }
        }
        catch (error) {
            this.logger.error('Failed to publish injury reported event', error);
            throw error;
        }
    }
    /**
     * Publish milestone achieved event
     */
    async publishMilestoneAchieved(milestoneData, correlationId) {
        try {
            const milestoneId = (0, uuid_1.v4)();
            await this.eventPublisher.publishMilestoneAchieved({
                milestoneId,
                achievedAt: new Date(),
                ...milestoneData
            }, correlationId);
            if (milestoneData.relatedWorkoutId) {
                await this.updateAssignmentEventMetadata(milestoneData.relatedWorkoutId, 'milestone_achieved');
            }
        }
        catch (error) {
            this.logger.error('Failed to publish milestone achieved event', error);
            throw error;
        }
    }
    /**
     * Update workout assignment with event metadata
     */
    async updateAssignmentEventMetadata(assignmentId, eventType) {
        try {
            const assignment = await this.workoutAssignmentRepository.findOne({
                where: { id: assignmentId }
            });
            if (!assignment) {
                this.logger.warn('Assignment not found for event metadata update', {
                    assignmentId,
                    eventType
                });
                return;
            }
            // Initialize event metadata if not exists
            if (!assignment.eventMetadata) {
                assignment.eventMetadata = {
                    publishedEvents: []
                };
            }
            // Add event to published events
            assignment.eventMetadata.publishedEvents.push({
                type: eventType,
                publishedAt: new Date().toISOString(),
                eventId: (0, uuid_1.v4)()
            });
            await this.workoutAssignmentRepository.save(assignment);
        }
        catch (error) {
            this.logger.error('Failed to update assignment event metadata', error, {
                assignmentId,
                eventType
            });
            // Don't throw - this is a non-critical operation
        }
    }
    /**
     * Check if an event has been published for an assignment
     */
    async hasEventBeenPublished(assignmentId, eventType) {
        try {
            const assignment = await this.workoutAssignmentRepository.findOne({
                where: { id: assignmentId }
            });
            if (!assignment || !assignment.eventMetadata) {
                return false;
            }
            return assignment.eventMetadata.publishedEvents.some(event => event.type === eventType);
        }
        catch (error) {
            this.logger.error('Failed to check event publication status', error, {
                assignmentId,
                eventType
            });
            return false;
        }
    }
}
exports.TrainingEventService = TrainingEventService;
//# sourceMappingURL=TrainingEventService.js.map