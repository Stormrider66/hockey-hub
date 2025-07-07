import { EventBus, EventHandler } from './EventBus';
import { 
  TRAINING_EVENTS,
  WorkoutCreatedEvent,
  WorkoutCompletedEvent,
  WorkoutUpdatedEvent,
  WorkoutCancelledEvent,
  InjuryReportedEvent,
  InjuryResolvedEvent,
  PlanCreatedEvent,
  PlanUpdatedEvent,
  PlanCompletedEvent,
  MilestoneAchievedEvent
} from './training-events';

export class TrainingEventListeners {
  private eventBus: EventBus;
  private subscriptions: Array<() => void> = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Subscribe to workout created events
   */
  onWorkoutCreated(handler: EventHandler<WorkoutCreatedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.WORKOUT_CREATED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to workout completed events
   */
  onWorkoutCompleted(handler: EventHandler<WorkoutCompletedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.WORKOUT_COMPLETED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to workout updated events
   */
  onWorkoutUpdated(handler: EventHandler<WorkoutUpdatedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.WORKOUT_UPDATED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to workout cancelled events
   */
  onWorkoutCancelled(handler: EventHandler<WorkoutCancelledEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.WORKOUT_CANCELLED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to injury reported events
   */
  onInjuryReported(handler: EventHandler<InjuryReportedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.INJURY_REPORTED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to injury resolved events
   */
  onInjuryResolved(handler: EventHandler<InjuryResolvedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.INJURY_RESOLVED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to plan created events
   */
  onPlanCreated(handler: EventHandler<PlanCreatedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.PLAN_CREATED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to plan updated events
   */
  onPlanUpdated(handler: EventHandler<PlanUpdatedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.PLAN_UPDATED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to plan completed events
   */
  onPlanCompleted(handler: EventHandler<PlanCompletedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.PLAN_COMPLETED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to milestone achieved events
   */
  onMilestoneAchieved(handler: EventHandler<MilestoneAchievedEvent['data']>): () => void {
    const unsubscribe = this.eventBus.on(TRAINING_EVENTS.MILESTONE_ACHIEVED, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to all training events
   */
  onAnyTrainingEvent(handler: EventHandler): () => void {
    const unsubscribes = Object.values(TRAINING_EVENTS).map(eventType => 
      this.eventBus.on(eventType, handler)
    );
    this.subscriptions.push(...unsubscribes);
    
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}

/**
 * Factory function to create training event listeners
 */
export function createTrainingEventListeners(eventBus: EventBus): TrainingEventListeners {
  return new TrainingEventListeners(eventBus);
}