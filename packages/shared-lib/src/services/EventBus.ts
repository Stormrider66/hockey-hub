import { EventEnvelope } from '../dto';

export type EventHandler<T = any> = (event: EventEnvelope<T>) => Promise<void>;

export interface EventBusConfig {
  serviceName: string;
  serviceVersion: string;
}

export interface EventSubscription {
  eventType: string;
  handler: EventHandler;
  filter?: (event: EventEnvelope) => boolean;
}

export abstract class EventBus {
  protected serviceName: string;
  protected serviceVersion: string;
  protected subscriptions: Map<string, EventSubscription[]> = new Map();

  constructor(config: EventBusConfig) {
    this.serviceName = config.serviceName;
    this.serviceVersion = config.serviceVersion;
  }

  // Abstract methods to be implemented by specific event bus implementations
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract publish<T>(eventType: string, data: T, metadata?: Record<string, any>): Promise<void>;
  abstract subscribe(subscription: EventSubscription): Promise<void>;
  abstract unsubscribe(eventType: string, handler: EventHandler): Promise<void>;

  // Helper method to create event envelope
  protected createEventEnvelope<T>(
    eventType: string,
    data: T,
    metadata?: Record<string, any>
  ): EventEnvelope<T> {
    return {
      id: this.generateEventId(),
      type: eventType,
      source: `${this.serviceName}:${this.serviceVersion}`,
      timestamp: new Date().toISOString(),
      metadata,
      data,
    };
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method to handle incoming events
  protected async handleEvent(event: EventEnvelope): Promise<void> {
    const handlers = this.subscriptions.get(event.type) || [];
    
    for (const subscription of handlers) {
      if (!subscription.filter || subscription.filter(event)) {
        try {
          await subscription.handler(event);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
          // Could implement dead letter queue here
        }
      }
    }
  }

  // Batch publish multiple events
  async publishBatch(events: Array<{ type: string; data: any; metadata?: Record<string, any> }>): Promise<void> {
    for (const event of events) {
      await this.publish(event.type, event.data, event.metadata);
    }
  }

  // Subscribe to multiple event types with the same handler
  async subscribeMultiple(eventTypes: string[], handler: EventHandler, filter?: (event: EventEnvelope) => boolean): Promise<void> {
    for (const eventType of eventTypes) {
      await this.subscribe({ eventType, handler, filter });
    }
  }
}

// Event type constants
export const UserEvents = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role.changed',
  USER_ACTIVATED: 'user.activated',
  USER_DEACTIVATED: 'user.deactivated',
} as const;

export const OrganizationEvents = {
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',
  SUBSCRIPTION_CHANGED: 'organization.subscription.changed',
} as const;

export const TeamEvents = {
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',
  TEAM_MEMBER_ADDED: 'team.member.added',
  TEAM_MEMBER_REMOVED: 'team.member.removed',
  TEAM_MEMBER_ROLE_CHANGED: 'team.member.role.changed',
} as const;

export const TrainingEvents = {
  WORKOUT_CREATED: 'training.workout.created',
  WORKOUT_STARTED: 'training.workout.started',
  WORKOUT_COMPLETED: 'training.workout.completed',
  WORKOUT_CANCELLED: 'training.workout.cancelled',
  EXERCISE_COMPLETED: 'training.exercise.completed',
} as const;

export const MedicalEvents = {
  INJURY_REPORTED: 'medical.injury.reported',
  INJURY_UPDATED: 'medical.injury.updated',
  TREATMENT_SCHEDULED: 'medical.treatment.scheduled',
  PLAYER_STATUS_CHANGED: 'medical.player.status.changed',
} as const;