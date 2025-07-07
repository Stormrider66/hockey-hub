import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

export interface EventMetadata {
  eventId: string;
  timestamp: Date;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
  source: string;
  version: string;
}

export interface BaseEvent<T = any> {
  type: string;
  data: T;
  metadata: EventMetadata;
}

export type EventHandler<T = any> = (event: BaseEvent<T>) => void | Promise<void>;

export interface EventBusOptions {
  enableLogging?: boolean;
  asyncMode?: boolean;
  maxListeners?: number;
}

export class EventBus {
  private emitter: EventEmitter;
  private logger: Logger;
  private options: EventBusOptions;
  private handlers: Map<string, Set<EventHandler>>;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      enableLogging: true,
      asyncMode: true,
      maxListeners: 100,
      ...options
    };
    
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(this.options.maxListeners);
    this.logger = new Logger('EventBus');
    this.handlers = new Map();
  }

  /**
   * Subscribe to an event
   */
  on<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler);
    
    const wrappedHandler = async (event: BaseEvent<T>) => {
      try {
        if (this.options.enableLogging) {
          this.logger.debug(`Processing event: ${eventType}`, {
            eventId: event.metadata.eventId,
            correlationId: event.metadata.correlationId
          });
        }
        
        if (this.options.asyncMode) {
          await handler(event);
        } else {
          handler(event);
        }
      } catch (error) {
        this.logger.error(`Error handling event ${eventType}:`, error as Error, {
          eventId: event.metadata.eventId
        });
        // Re-throw in sync mode
        if (!this.options.asyncMode) {
          throw error;
        }
      }
    };
    
    this.emitter.on(eventType, wrappedHandler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
      this.emitter.removeListener(eventType, wrappedHandler);
    };
  }

  /**
   * Subscribe to an event (one-time)
   */
  once<T = any>(eventType: string, handler: EventHandler<T>): void {
    const wrappedHandler = async (event: BaseEvent<T>) => {
      try {
        if (this.options.enableLogging) {
          this.logger.debug(`Processing one-time event: ${eventType}`, {
            eventId: event.metadata.eventId
          });
        }
        
        if (this.options.asyncMode) {
          await handler(event);
        } else {
          handler(event);
        }
      } catch (error) {
        this.logger.error(`Error handling one-time event ${eventType}:`, error as Error);
        if (!this.options.asyncMode) {
          throw error;
        }
      }
    };
    
    this.emitter.once(eventType, wrappedHandler);
  }

  /**
   * Emit an event
   */
  async emit<T = any>(event: BaseEvent<T>): Promise<void> {
    if (this.options.enableLogging) {
      this.logger.info(`Emitting event: ${event.type}`, {
        eventId: event.metadata.eventId,
        correlationId: event.metadata.correlationId,
        data: event.data
      });
    }
    
    if (this.options.asyncMode) {
      // In async mode, emit and wait for all handlers
      const listeners = this.emitter.listeners(event.type);
      await Promise.all(
        listeners.map(listener => 
          Promise.resolve(listener(event)).catch(error => {
            this.logger.error(`Async handler error for ${event.type}:`, error);
          })
        )
      );
    } else {
      // In sync mode, emit directly
      this.emitter.emit(event.type, event);
    }
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
      this.emitter.removeAllListeners(eventType);
    } else {
      this.handlers.clear();
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Get the number of listeners for an event type
   */
  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance for application-wide event bus
let globalEventBus: EventBus | null = null;

export function getGlobalEventBus(options?: EventBusOptions): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(options);
  }
  return globalEventBus;
}