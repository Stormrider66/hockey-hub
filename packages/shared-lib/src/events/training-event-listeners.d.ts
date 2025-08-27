import { EventBus, EventHandler } from './EventBus';
import { WorkoutCreatedEvent, WorkoutCompletedEvent, WorkoutUpdatedEvent, WorkoutCancelledEvent, InjuryReportedEvent, InjuryResolvedEvent, PlanCreatedEvent, PlanUpdatedEvent, PlanCompletedEvent, MilestoneAchievedEvent } from './training-events';
export declare class TrainingEventListeners {
    private eventBus;
    private subscriptions;
    constructor(eventBus: EventBus);
    /**
     * Subscribe to workout created events
     */
    onWorkoutCreated(handler: EventHandler<WorkoutCreatedEvent['data']>): () => void;
    /**
     * Subscribe to workout completed events
     */
    onWorkoutCompleted(handler: EventHandler<WorkoutCompletedEvent['data']>): () => void;
    /**
     * Subscribe to workout updated events
     */
    onWorkoutUpdated(handler: EventHandler<WorkoutUpdatedEvent['data']>): () => void;
    /**
     * Subscribe to workout cancelled events
     */
    onWorkoutCancelled(handler: EventHandler<WorkoutCancelledEvent['data']>): () => void;
    /**
     * Subscribe to injury reported events
     */
    onInjuryReported(handler: EventHandler<InjuryReportedEvent['data']>): () => void;
    /**
     * Subscribe to injury resolved events
     */
    onInjuryResolved(handler: EventHandler<InjuryResolvedEvent['data']>): () => void;
    /**
     * Subscribe to plan created events
     */
    onPlanCreated(handler: EventHandler<PlanCreatedEvent['data']>): () => void;
    /**
     * Subscribe to plan updated events
     */
    onPlanUpdated(handler: EventHandler<PlanUpdatedEvent['data']>): () => void;
    /**
     * Subscribe to plan completed events
     */
    onPlanCompleted(handler: EventHandler<PlanCompletedEvent['data']>): () => void;
    /**
     * Subscribe to milestone achieved events
     */
    onMilestoneAchieved(handler: EventHandler<MilestoneAchievedEvent['data']>): () => void;
    /**
     * Subscribe to all training events
     */
    onAnyTrainingEvent(handler: EventHandler): () => void;
    /**
     * Unsubscribe from all events
     */
    unsubscribeAll(): void;
}
/**
 * Factory function to create training event listeners
 */
export declare function createTrainingEventListeners(eventBus: EventBus): TrainingEventListeners;
//# sourceMappingURL=training-event-listeners.d.ts.map