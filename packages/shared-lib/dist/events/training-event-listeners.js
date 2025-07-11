"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrainingEventListeners = exports.TrainingEventListeners = void 0;
const training_events_1 = require("./training-events");
class TrainingEventListeners {
    constructor(eventBus) {
        this.subscriptions = [];
        this.eventBus = eventBus;
    }
    /**
     * Subscribe to workout created events
     */
    onWorkoutCreated(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.WORKOUT_CREATED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to workout completed events
     */
    onWorkoutCompleted(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.WORKOUT_COMPLETED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to workout updated events
     */
    onWorkoutUpdated(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.WORKOUT_UPDATED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to workout cancelled events
     */
    onWorkoutCancelled(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.WORKOUT_CANCELLED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to injury reported events
     */
    onInjuryReported(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.INJURY_REPORTED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to injury resolved events
     */
    onInjuryResolved(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.INJURY_RESOLVED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to plan created events
     */
    onPlanCreated(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.PLAN_CREATED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to plan updated events
     */
    onPlanUpdated(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.PLAN_UPDATED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to plan completed events
     */
    onPlanCompleted(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.PLAN_COMPLETED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to milestone achieved events
     */
    onMilestoneAchieved(handler) {
        const unsubscribe = this.eventBus.on(training_events_1.TRAINING_EVENTS.MILESTONE_ACHIEVED, handler);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }
    /**
     * Subscribe to all training events
     */
    onAnyTrainingEvent(handler) {
        const unsubscribes = Object.values(training_events_1.TRAINING_EVENTS).map(eventType => this.eventBus.on(eventType, handler));
        this.subscriptions.push(...unsubscribes);
        return () => {
            unsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }
    /**
     * Unsubscribe from all events
     */
    unsubscribeAll() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
    }
}
exports.TrainingEventListeners = TrainingEventListeners;
/**
 * Factory function to create training event listeners
 */
function createTrainingEventListeners(eventBus) {
    return new TrainingEventListeners(eventBus);
}
exports.createTrainingEventListeners = createTrainingEventListeners;
//# sourceMappingURL=training-event-listeners.js.map