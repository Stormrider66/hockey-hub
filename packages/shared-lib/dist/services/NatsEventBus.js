"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsEventBus = void 0;
const nats_1 = require("nats");
const EventBus_1 = require("./EventBus");
class NatsEventBus extends EventBus_1.EventBus {
    constructor(config) {
        super(config);
        this.codec = (0, nats_1.StringCodec)();
        this.natsSubscriptions = new Map();
        this.config = config;
    }
    async connect() {
        try {
            this.connection = await (0, nats_1.connect)({
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
        }
        catch (error) {
            console.error('Failed to connect to NATS:', error);
            throw error;
        }
    }
    async disconnect() {
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
    async publish(eventType, data, metadata) {
        if (!this.connection) {
            throw new Error('NATS connection not established');
        }
        const envelope = this.createEventEnvelope(eventType, data, metadata);
        const subject = this.eventTypeToSubject(eventType);
        try {
            this.connection.publish(subject, this.codec.encode(JSON.stringify(envelope)));
        }
        catch (error) {
            console.error(`Failed to publish event ${eventType}:`, error);
            throw error;
        }
    }
    async subscribe(subscription) {
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
                    const envelope = JSON.parse(this.codec.decode(msg.data));
                    await this.handleEvent(envelope);
                }
                catch (error) {
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
    async unsubscribe(eventType, handler) {
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
        }
        else {
            this.subscriptions.set(eventType, filteredHandlers);
        }
    }
    // Convert event type to NATS subject
    eventTypeToSubject(eventType) {
        // Convert dot notation to NATS subject format
        // e.g., "user.created" -> "events.user.created"
        return `events.${eventType}`;
    }
    // Request-Reply pattern for synchronous communication
    async request(subject, data, timeout = 5000) {
        if (!this.connection) {
            throw new Error('NATS connection not established');
        }
        try {
            const msg = await this.connection.request(subject, this.codec.encode(JSON.stringify(data)), { timeout });
            return JSON.parse(this.codec.decode(msg.data));
        }
        catch (error) {
            console.error(`Request to ${subject} failed:`, error);
            throw error;
        }
    }
    // Subscribe to request-reply pattern
    async respondTo(subject, handler) {
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
                    const request = JSON.parse(this.codec.decode(msg.data));
                    const response = await handler(request);
                    if (msg.respond) {
                        msg.respond(this.codec.encode(JSON.stringify(response)));
                    }
                }
                catch (error) {
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
exports.NatsEventBus = NatsEventBus;
