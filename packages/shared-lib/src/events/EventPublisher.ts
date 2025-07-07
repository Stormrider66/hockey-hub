import { EventBus, BaseEvent } from './EventBus';
import { EventFactory } from './EventFactory';
import { Logger } from '../utils/logger';

export interface EventPublisherOptions {
  eventBus: EventBus;
  eventFactory: EventFactory;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export class EventPublisher {
  protected eventBus: EventBus;
  protected eventFactory: EventFactory;
  protected logger: Logger;
  private options: Required<EventPublisherOptions>;

  constructor(options: EventPublisherOptions) {
    this.options = {
      enableRetry: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    } as Required<EventPublisherOptions>;
    
    this.eventBus = options.eventBus;
    this.eventFactory = options.eventFactory;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Publish an event with retry logic
   */
  protected async publish<T>(
    eventType: string,
    data: T,
    metadata?: Partial<EventMetadata>
  ): Promise<void> {
    const event = this.eventFactory.createEvent(eventType, data, metadata);
    
    if (this.options.enableRetry) {
      await this.publishWithRetry(event);
    } else {
      await this.publishOnce(event);
    }
  }

  /**
   * Publish an event with correlation ID
   */
  protected async publishCorrelated<T>(
    eventType: string,
    data: T,
    correlationId: string,
    metadata?: Partial<EventMetadata>
  ): Promise<void> {
    const event = this.eventFactory.createCorrelatedEvent(
      eventType,
      data,
      correlationId,
      metadata
    );
    
    if (this.options.enableRetry) {
      await this.publishWithRetry(event);
    } else {
      await this.publishOnce(event);
    }
  }

  /**
   * Publish multiple events in order
   */
  protected async publishBatch(events: BaseEvent[]): Promise<void> {
    for (const event of events) {
      if (this.options.enableRetry) {
        await this.publishWithRetry(event);
      } else {
        await this.publishOnce(event);
      }
    }
  }

  /**
   * Publish event once without retry
   */
  private async publishOnce(event: BaseEvent): Promise<void> {
    try {
      await this.eventBus.emit(event);
      this.logger.info(`Event published: ${event.type}`, {
        eventId: event.metadata.eventId,
        correlationId: event.metadata.correlationId
      });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error as Error, {
        eventId: event.metadata.eventId
      });
      throw error;
    }
  }

  /**
   * Publish event with retry logic
   */
  private async publishWithRetry(event: BaseEvent): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        await this.eventBus.emit(event);
        this.logger.info(`Event published: ${event.type}`, {
          eventId: event.metadata.eventId,
          correlationId: event.metadata.correlationId,
          attempt
        });
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Failed to publish event ${event.type}, attempt ${attempt}/${this.options.retryAttempts}`,
          {
            eventId: event.metadata.eventId,
            error: error instanceof Error ? error.message : String(error)
          }
        );
        
        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * attempt);
        }
      }
    }
    
    // All retries failed
    this.logger.error(
      `Failed to publish event after ${this.options.retryAttempts} attempts: ${event.type}`,
      lastError!,
      {
        eventId: event.metadata.eventId
      }
    );
    throw lastError;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}