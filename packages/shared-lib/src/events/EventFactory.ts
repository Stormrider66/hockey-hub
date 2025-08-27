// Avoid requiring @types/uuid; use a minimal fallback
let uuidv4: () => string;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  uuidv4 = require('uuid').v4;
} catch {
  uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
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
    this.options.defaultUserId = undefined as unknown as string;
    this.options.defaultOrganizationId = undefined as unknown as string;
  }
}