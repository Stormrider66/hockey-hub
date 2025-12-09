import { 
  EventPublisher, 
  EventBus, 
  EventFactory,
  TRAINING_EVENTS,
  WorkoutCreatedData,
  WorkoutCompletedData,
  WorkoutUpdatedData,
  WorkoutCancelledData,
  InjuryReportedData,
  InjuryResolvedData,
  PlanCreatedData,
  PlanUpdatedData,
  PlanCompletedData,
  MilestoneAchievedData,
  ExerciseAddedData,
  ExerciseRemovedData
} from '@hockey-hub/shared-lib';

export class TrainingEventPublisher extends EventPublisher {
  constructor(eventBus: EventBus, eventFactory: EventFactory) {
    super({
      eventBus,
      eventFactory,
      enableRetry: true,
      retryAttempts: 3,
      retryDelay: 500
    });
  }

  // Workout Events
  async publishWorkoutAssigned(data: any, correlationId?: string): Promise<void> {
    this.logger.info('Publishing workout assigned event', { 
      assignmentId: data.assignmentId,
      playerId: data.playerId 
    });
    
    // Using WORKOUT_CREATED as a placeholder until WORKOUT_ASSIGNED is added to shared-lib
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.WORKOUT_CREATED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.WORKOUT_CREATED, data);
    }
  }

  async publishWorkoutCreated(data: WorkoutCreatedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing workout created event', { workoutId: data.workoutId });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.WORKOUT_CREATED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.WORKOUT_CREATED, data);
    }
  }

  async publishWorkoutCompleted(data: WorkoutCompletedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing workout completed event', { 
      workoutId: data.workoutId,
      playerId: data.playerId 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.WORKOUT_COMPLETED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.WORKOUT_COMPLETED, data);
    }
  }

  async publishWorkoutUpdated(data: WorkoutUpdatedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing workout updated event', { 
      workoutId: data.workoutId,
      changes: data.changes.length 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.WORKOUT_UPDATED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.WORKOUT_UPDATED, data);
    }
  }

  async publishWorkoutCancelled(data: WorkoutCancelledData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing workout cancelled event', { 
      workoutId: data.workoutId,
      reason: data.reason 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.WORKOUT_CANCELLED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.WORKOUT_CANCELLED, data);
    }
  }

  // Injury Events
  async publishInjuryReported(data: InjuryReportedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing injury reported event', { 
      injuryId: data.injuryId,
      playerId: data.playerId,
      severity: data.severity 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.INJURY_REPORTED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.INJURY_REPORTED, data);
    }
  }

  async publishInjuryResolved(data: InjuryResolvedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing injury resolved event', { 
      injuryId: data.injuryId,
      playerId: data.playerId 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.INJURY_RESOLVED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.INJURY_RESOLVED, data);
    }
  }

  // Training Plan Events
  async publishPlanCreated(data: PlanCreatedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing plan created event', { 
      planId: data.planId,
      name: data.name 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.PLAN_CREATED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.PLAN_CREATED, data);
    }
  }

  async publishPlanUpdated(data: PlanUpdatedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing plan updated event', { 
      planId: data.planId,
      changes: data.changes.length 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.PLAN_UPDATED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.PLAN_UPDATED, data);
    }
  }

  async publishPlanCompleted(data: PlanCompletedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing plan completed event', { 
      planId: data.planId,
      completionRate: data.sessionsCompleted / data.sessionsTotal 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.PLAN_COMPLETED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.PLAN_COMPLETED, data);
    }
  }

  // Milestone Events
  async publishMilestoneAchieved(data: MilestoneAchievedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing milestone achieved event', { 
      milestoneId: data.milestoneId,
      playerId: data.playerId,
      type: data.type 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.MILESTONE_ACHIEVED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.MILESTONE_ACHIEVED, data);
    }
  }

  // Exercise Events
  async publishExerciseAdded(data: ExerciseAddedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing exercise added event', { 
      exerciseId: data.exerciseId,
      workoutId: data.workoutId 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.EXERCISE_ADDED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.EXERCISE_ADDED, data);
    }
  }

  async publishExerciseRemoved(data: ExerciseRemovedData, correlationId?: string): Promise<void> {
    this.logger.info('Publishing exercise removed event', { 
      exerciseId: data.exerciseId,
      workoutId: data.workoutId 
    });
    
    if (correlationId) {
      await this.publishCorrelated(TRAINING_EVENTS.EXERCISE_REMOVED, data, correlationId);
    } else {
      await this.publish(TRAINING_EVENTS.EXERCISE_REMOVED, data);
    }
  }
}