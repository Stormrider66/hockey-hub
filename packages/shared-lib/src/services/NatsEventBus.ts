import { connect, NatsConnection, StringCodec, Subscription } from 'nats';
import { EventBus, EventBusConfig, EventSubscription, EventHandler } from './EventBus';
import { EventEnvelope } from '../dto';

export interface NatsEventBusConfig extends EventBusConfig {
  servers: string[];
  user?: string;
  pass?: string;
  token?: string;
}

export class NatsEventBus extends EventBus {
  private connection?: NatsConnection;
  private codec = StringCodec();
  private natsSubscriptions: Map<string, Subscription> = new Map();
  private config: NatsEventBusConfig;

  constructor(config: NatsEventBusConfig) {
    super(config);
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await connect({
        servers: this.config.servers,
        user: this.config.user,
        pass: this.config.pass,
        token: this.config.token,
        name: `${this.serviceName}:${this.serviceVersion}`,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      });

      console.log(`Connected to NATS at ${this.config.servers.join(', ')}`);

      // Handle connection events
      this.connection.closed().then(() => {
        console.log('NATS connection closed');
      }).catch((err) => {
        console.error('NATS connection closed with error:', err);
      });

    } catch (error) {
      console.error('Failed to connect to NATS:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      // Unsubscribe from all topics
      for (const [_, subscription] of this.natsSubscriptions) {
        subscription.unsubscribe();
      }
      this.natsSubscriptions.clear();

      // Close connection
      await this.connection.close();
      this.connection = undefined;
    }
  }

  async publish<T>(eventType: string, data: T, metadata?: Record<string, any>): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    const envelope = this.createEventEnvelope(eventType, data, metadata);
    const subject = this.eventTypeToSubject(eventType);
    
    try {
      this.connection.publish(
        subject,
        this.codec.encode(JSON.stringify(envelope))
      );
    } catch (error) {
      console.error(`Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }

  async subscribe(subscription: EventSubscription): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    const subject = this.eventTypeToSubject(subscription.eventType);
    
    // Check if we already have a subscription for this event type
    if (this.natsSubscriptions.has(subscription.eventType)) {
      // Just add the handler to our internal map
      const handlers = this.subscriptions.get(subscription.eventType) || [];
      handlers.push(subscription);
      this.subscriptions.set(subscription.eventType, handlers);
      return;
    }

    // Create NATS subscription
    const natsSub = this.connection.subscribe(subject, {
      callback: async (err, msg) => {
        if (err) {
          console.error(`Error in subscription ${subscription.eventType}:`, err);
          return;
        }

        try {
          const envelope = JSON.parse(this.codec.decode(msg.data)) as EventEnvelope;
          await this.handleEvent(envelope);
        } catch (error) {
          console.error(`Error processing event ${subscription.eventType}:`, error);
        }
      },
    });

    // Store NATS subscription
    this.natsSubscriptions.set(subscription.eventType, natsSub);

    // Store handler
    const handlers = this.subscriptions.get(subscription.eventType) || [];
    handlers.push(subscription);
    this.subscriptions.set(subscription.eventType, handlers);
  }

  async unsubscribe(eventType: string, handler: EventHandler): Promise<void> {
    // Remove handler from internal map
    const handlers = this.subscriptions.get(eventType) || [];
    const filteredHandlers = handlers.filter(sub => sub.handler !== handler);
    
    if (filteredHandlers.length === 0) {
      // No more handlers, unsubscribe from NATS
      const natsSub = this.natsSubscriptions.get(eventType);
      if (natsSub) {
        natsSub.unsubscribe();
        this.natsSubscriptions.delete(eventType);
      }
      this.subscriptions.delete(eventType);
    } else {
      this.subscriptions.set(eventType, filteredHandlers);
    }
  }

  // Convert event type to NATS subject
  private eventTypeToSubject(eventType: string): string {
    // Convert dot notation to NATS subject format
    // e.g., "user.created" -> "events.user.created"
    return `events.${eventType}`;
  }

  // Request-Reply pattern for synchronous communication
  async request<TRequest, TResponse>(
    subject: string,
    data: TRequest,
    timeout: number = 5000
  ): Promise<TResponse> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    try {
      const msg = await this.connection.request(
        subject,
        this.codec.encode(JSON.stringify(data)),
        { timeout }
      );

      return JSON.parse(this.codec.decode(msg.data)) as TResponse;
    } catch (error) {
      console.error(`Request to ${subject} failed:`, error);
      throw error;
    }
  }

  // Subscribe to request-reply pattern
  async respondTo<TRequest, TResponse>(
    subject: string,
    handler: (request: TRequest) => Promise<TResponse>
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not established');
    }

    this.connection.subscribe(subject, {
      callback: async (err, msg) => {
        if (err) {
          console.error(`Error in responder ${subject}:`, err);
          return;
        }

        try {
          const request = JSON.parse(this.codec.decode(msg.data)) as TRequest;
          const response = await handler(request);
          
          if (msg.respond) {
            msg.respond(this.codec.encode(JSON.stringify(response)));
          }
        } catch (error) {
          console.error(`Error handling request ${subject}:`, error);
          if (msg.respond) {
            msg.respond(this.codec.encode(JSON.stringify({
              error: (error instanceof Error) ? error.message : 'Internal server error'
            })));
          }
        }
      },
    });
  }
}