# Training Service Event Bus Guide

## Overview

The Training Service publishes events to enable cross-service communication without tight coupling. Other services can subscribe to these events to react to training-related activities.

## Event Types

### Workout Events

#### `training.workout.created`
Published when a new workout is created or assigned.

```typescript
{
  workoutId: string;
  sessionTemplateId?: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  type: 'STRENGTH' | 'CARDIO' | 'SKILL' | 'RECOVERY';
  scheduledDate: Date;
  duration: number;
  exercises: Array<{
    exerciseTemplateId: string;
    name: string;
    sets?: number;
    reps?: number;
    duration?: number;
  }>;
}
```

#### `training.workout.completed`
Published when a workout session is completed.

```typescript
{
  workoutId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  completedAt: Date;
  totalDuration: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  performanceMetrics?: {
    averageHeartRate?: number;
    caloriesBurned?: number;
    playerLoad?: number;
  };
}
```

#### `training.workout.cancelled`
Published when a workout is cancelled.

```typescript
{
  workoutId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  reason?: string;
  cancelledBy: string;
}
```

### Injury Events

#### `training.injury.reported`
Published when an injury is reported during or after a workout.

```typescript
{
  injuryId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  bodyPart: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  type: string;
  occurredDuring?: string;
  workoutId?: string;
  reportedBy: string;
  estimatedRecoveryDays?: number;
}
```

### Milestone Events

#### `training.milestone.achieved`
Published when a player achieves a training milestone.

```typescript
{
  milestoneId: string;
  playerId: string;
  teamId: string;
  organizationId: string;
  type: 'PERSONAL_BEST' | 'GOAL_REACHED' | 'STREAK' | 'CONSISTENCY' | 'IMPROVEMENT';
  name: string;
  description: string;
  value?: number;
  unit?: string;
  previousValue?: number;
  achievedAt: Date;
  relatedWorkoutId?: string;
}
```

## Using the Event Bus

### Publishing Events (Training Service)

Events are automatically published by the TrainingEventService when certain actions occur:

```typescript
// Example: Publishing a workout completed event
const eventService = getTrainingEventService();
eventService.setUserContext(userId, organizationId);

await eventService.publishWorkoutCompleted(
  workoutAssignment,
  performanceMetrics,
  correlationId
);
```

### Consuming Events (Other Services)

To consume training events in other services:

```typescript
import { getGlobalEventBus, createTrainingEventListeners } from '@hockey-hub/shared-lib';

// Initialize listeners
const eventBus = getGlobalEventBus();
const trainingListeners = createTrainingEventListeners(eventBus);

// Subscribe to specific events
trainingListeners.onWorkoutCompleted(async (event) => {
  console.log('Workout completed:', event.data);
  // Update statistics, send notifications, etc.
});

trainingListeners.onInjuryReported(async (event) => {
  console.log('Injury reported:', event.data);
  // Notify medical staff, update player status, etc.
});

// Subscribe to all training events
trainingListeners.onAnyTrainingEvent(async (event) => {
  console.log('Training event:', event.type, event.data);
  // Audit logging, analytics, etc.
});

// Clean up when shutting down
trainingListeners.unsubscribeAll();
```

## Event Metadata

All events include metadata for tracking and correlation:

```typescript
{
  eventId: string;        // Unique event identifier
  timestamp: Date;        // When the event occurred
  correlationId?: string; // For tracing related events
  userId?: string;        // User who triggered the event
  organizationId?: string;// Organization context
  source: string;         // Service that published the event
  version: string;        // Event schema version
}
```

## Best Practices

1. **Idempotency**: Event handlers should be idempotent - processing the same event multiple times should have the same effect as processing it once.

2. **Error Handling**: Don't let event handler failures crash your service. Log errors and continue processing other events.

3. **Async Processing**: Use async handlers for time-consuming operations to avoid blocking the event bus.

4. **Event Versioning**: The event schema includes a version field. Check this when consuming events to handle schema changes gracefully.

5. **Correlation IDs**: Use correlation IDs to trace related events across services.

## Example Integration Scenarios

### Calendar Service
- Listen to `workout.created` to add workout sessions to the calendar
- Listen to `workout.cancelled` to remove cancelled sessions
- Listen to `plan.created` to schedule recurring workouts

### Communication Service
- Listen to `workout.completed` to send completion notifications
- Listen to `injury.reported` to alert medical staff
- Listen to `milestone.achieved` to send congratulations

### Statistics Service
- Listen to `workout.completed` to update player performance metrics
- Listen to `milestone.achieved` to track achievements
- Listen to all events for analytics and reporting

### Medical Service
- Listen to `injury.reported` to create injury records
- Listen to `injury.resolved` to update recovery status
- Listen to `workout.completed` to monitor player load

## Configuration

The event bus can be configured with these options:

```typescript
const eventBus = getGlobalEventBus({
  enableLogging: true,    // Log all events (default: true)
  asyncMode: true,        // Process events asynchronously (default: true)
  maxListeners: 100       // Maximum listeners per event (default: 100)
});
```

## Monitoring and Debugging

1. **Event Logging**: All events are logged with their metadata for debugging
2. **Failed Events**: Failed event handlers log errors but don't stop event processing
3. **Event Metrics**: Track event counts, processing times, and failures
4. **Event Replay**: Events can be replayed from logs for debugging or recovery