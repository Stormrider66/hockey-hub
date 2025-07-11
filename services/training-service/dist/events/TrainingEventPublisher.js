"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingEventPublisher = void 0;
const shared_lib_1 = require("@hockey-hub/shared-lib");
class TrainingEventPublisher extends shared_lib_1.EventPublisher {
    constructor(eventBus, eventFactory) {
        super({
            eventBus,
            eventFactory,
            enableRetry: true,
            retryAttempts: 3,
            retryDelay: 500
        });
    }
    // Workout Events
    async publishWorkoutAssigned(data, correlationId) {
        this.logger.info('Publishing workout assigned event', {
            assignmentId: data.assignmentId,
            playerId: data.playerId
        });
        // Using WORKOUT_CREATED as a placeholder until WORKOUT_ASSIGNED is added to shared-lib
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.WORKOUT_CREATED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.WORKOUT_CREATED, data);
        }
    }
    async publishWorkoutCreated(data, correlationId) {
        this.logger.info('Publishing workout created event', { workoutId: data.workoutId });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.WORKOUT_CREATED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.WORKOUT_CREATED, data);
        }
    }
    async publishWorkoutCompleted(data, correlationId) {
        this.logger.info('Publishing workout completed event', {
            workoutId: data.workoutId,
            playerId: data.playerId
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.WORKOUT_COMPLETED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.WORKOUT_COMPLETED, data);
        }
    }
    async publishWorkoutUpdated(data, correlationId) {
        this.logger.info('Publishing workout updated event', {
            workoutId: data.workoutId,
            changes: data.changes.length
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.WORKOUT_UPDATED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.WORKOUT_UPDATED, data);
        }
    }
    async publishWorkoutCancelled(data, correlationId) {
        this.logger.info('Publishing workout cancelled event', {
            workoutId: data.workoutId,
            reason: data.reason
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.WORKOUT_CANCELLED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.WORKOUT_CANCELLED, data);
        }
    }
    // Injury Events
    async publishInjuryReported(data, correlationId) {
        this.logger.info('Publishing injury reported event', {
            injuryId: data.injuryId,
            playerId: data.playerId,
            severity: data.severity
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.INJURY_REPORTED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.INJURY_REPORTED, data);
        }
    }
    async publishInjuryResolved(data, correlationId) {
        this.logger.info('Publishing injury resolved event', {
            injuryId: data.injuryId,
            playerId: data.playerId
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.INJURY_RESOLVED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.INJURY_RESOLVED, data);
        }
    }
    // Training Plan Events
    async publishPlanCreated(data, correlationId) {
        this.logger.info('Publishing plan created event', {
            planId: data.planId,
            name: data.name
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.PLAN_CREATED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.PLAN_CREATED, data);
        }
    }
    async publishPlanUpdated(data, correlationId) {
        this.logger.info('Publishing plan updated event', {
            planId: data.planId,
            changes: data.changes.length
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.PLAN_UPDATED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.PLAN_UPDATED, data);
        }
    }
    async publishPlanCompleted(data, correlationId) {
        this.logger.info('Publishing plan completed event', {
            planId: data.planId,
            completionRate: data.sessionsCompleted / data.sessionsTotal
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.PLAN_COMPLETED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.PLAN_COMPLETED, data);
        }
    }
    // Milestone Events
    async publishMilestoneAchieved(data, correlationId) {
        this.logger.info('Publishing milestone achieved event', {
            milestoneId: data.milestoneId,
            playerId: data.playerId,
            type: data.type
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.MILESTONE_ACHIEVED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.MILESTONE_ACHIEVED, data);
        }
    }
    // Exercise Events
    async publishExerciseAdded(data, correlationId) {
        this.logger.info('Publishing exercise added event', {
            exerciseId: data.exerciseId,
            workoutId: data.workoutId
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.EXERCISE_ADDED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.EXERCISE_ADDED, data);
        }
    }
    async publishExerciseRemoved(data, correlationId) {
        this.logger.info('Publishing exercise removed event', {
            exerciseId: data.exerciseId,
            workoutId: data.workoutId
        });
        if (correlationId) {
            await this.publishCorrelated(shared_lib_1.TRAINING_EVENTS.EXERCISE_REMOVED, data, correlationId);
        }
        else {
            await this.publish(shared_lib_1.TRAINING_EVENTS.EXERCISE_REMOVED, data);
        }
    }
}
exports.TrainingEventPublisher = TrainingEventPublisher;
//# sourceMappingURL=TrainingEventPublisher.js.map