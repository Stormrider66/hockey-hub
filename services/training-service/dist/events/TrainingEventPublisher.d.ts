import { EventPublisher, EventBus, EventFactory, WorkoutCreatedData, WorkoutCompletedData, WorkoutUpdatedData, WorkoutCancelledData, InjuryReportedData, InjuryResolvedData, PlanCreatedData, PlanUpdatedData, PlanCompletedData, MilestoneAchievedData, ExerciseAddedData, ExerciseRemovedData } from '@hockey-hub/shared-lib';
export declare class TrainingEventPublisher extends EventPublisher {
    constructor(eventBus: EventBus, eventFactory: EventFactory);
    publishWorkoutAssigned(data: any, correlationId?: string): Promise<void>;
    publishWorkoutCreated(data: WorkoutCreatedData, correlationId?: string): Promise<void>;
    publishWorkoutCompleted(data: WorkoutCompletedData, correlationId?: string): Promise<void>;
    publishWorkoutUpdated(data: WorkoutUpdatedData, correlationId?: string): Promise<void>;
    publishWorkoutCancelled(data: WorkoutCancelledData, correlationId?: string): Promise<void>;
    publishInjuryReported(data: InjuryReportedData, correlationId?: string): Promise<void>;
    publishInjuryResolved(data: InjuryResolvedData, correlationId?: string): Promise<void>;
    publishPlanCreated(data: PlanCreatedData, correlationId?: string): Promise<void>;
    publishPlanUpdated(data: PlanUpdatedData, correlationId?: string): Promise<void>;
    publishPlanCompleted(data: PlanCompletedData, correlationId?: string): Promise<void>;
    publishMilestoneAchieved(data: MilestoneAchievedData, correlationId?: string): Promise<void>;
    publishExerciseAdded(data: ExerciseAddedData, correlationId?: string): Promise<void>;
    publishExerciseRemoved(data: ExerciseRemovedData, correlationId?: string): Promise<void>;
}
//# sourceMappingURL=TrainingEventPublisher.d.ts.map