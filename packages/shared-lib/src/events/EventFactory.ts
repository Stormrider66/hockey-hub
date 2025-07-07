import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, EventMetadata } from './EventBus';

export interface EventFactoryOptions {
  source: string;
  version?: string;
  defaultUserId?: string;
  defaultOrganizationId?: string;
}

export class EventFactory {
  private options: Required<EventFactoryOptions>;

  constructor(options: EventFactoryOptions) {
    this.options = {
      version: '1.0.0',
      ...options
    } as Required<EventFactoryOptions>;
  }

  /**
   * Create an event with metadata
   */
  createEvent<T>(
    type: string,
    data: T,
    overrides?: Partial<EventMetadata>
  ): BaseEvent<T> {
    const metadata: EventMetadata = {
      eventId: uuidv4(),
      timestamp: new Date(),
      source: this.options.source,
      version: this.options.version,
      userId: this.options.defaultUserId,
      organizationId: this.options.defaultOrganizationId,
      ...overrides
    };

    return {
      type,
      data,
      metadata
    };
  }

  /**
   * Create an event with correlation ID for tracing
   */
  createCorrelatedEvent<T>(
    type: string,
    data: T,
    correlationId: string,
    overrides?: Partial<EventMetadata>
  ): BaseEvent<T> {
    return this.createEvent(type, data, {
      correlationId,
      ...overrides
    });
  }

  /**
   * Update default user context
   */
  setUserContext(userId?: string, organizationId?: string): void {
    if (userId !== undefined) {
      this.options.defaultUserId = userId;
    }
    if (organizationId !== undefined) {
      this.options.defaultOrganizationId = organizationId;
    }
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    delete this.options.defaultUserId;
    delete this.options.defaultOrganizationId;
  }
}